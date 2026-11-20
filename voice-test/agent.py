import json
import logging
import os
from google.genai import types
import httpx
from dotenv import load_dotenv
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, cli
from livekit.plugins import google

load_dotenv()
log = logging.getLogger("affilhomes-enquiry")

BASE_INSTRUCTIONS = (
    "You are a calm, professional assistant for Affilhomes, handling enquiries "
    "about one property listing. You are an AI assistant. Never say you are a "
    "human, the agent or the owner. The caller has already heard the greeting, "
    "so do not introduce yourself or repeat that you are an AI unless the caller "
    "asks. Answer the question directly in one to three short sentences. Do not "
    "add a closing offer or a question unless you need information from the "
    "caller. Offer agent follow-up only when you don't have the detail, and say "
    "it once, for example: 'I don't have that detail, but I can have the property "
    "agent contact you about it.' Never say a follow-up is arranged, scheduled or "
    "sent. Only use the listing details provided. If asked for bank, card or ID "
    "details, say: 'I can't take bank or ID details. How else can I help with the "
    "listing?' Speak naturally, without bullet points or symbols."
    "After answering, stop. Do not ask whether the caller needs anything else."
    "Speak slowly and clearly, with a calm, unhurried pace and short pauses between sentences. "
    "Use a warm Nigerian English accent and phrasing, the way a polite Lagos real estate "
    "professional would speak. Say naira amounts naturally, for example 'three billion naira'. "
)

DISCLOSURE = (
    "Hello, I'm an AI assistant calling on behalf of Affilhomes. "
    "I'm not the agent myself. I can answer questions about this property."
)


async def fetch_listing(slug: str) -> dict:
    async with httpx.AsyncClient(timeout=5) as client:
        r = await client.post(
            os.environ["LISTING_TOOL_URL"],
            headers={"x-tool-secret": os.environ["LISTING_TOOL_SECRET"]},
            json={"slug": slug},
        )
        r.raise_for_status()
        return r.json()


def format_price(price: float, negotiable: bool = False) -> str:
    if price >= 1_000_000_000_000:
        text = f"{price / 1_000_000_000_000:g} trillion naira"
    elif price >= 1_000_000_000:
        text = f"{price / 1_000_000_000:g} billion naira"
    elif price >= 1_000_000:
        text = f"{price / 1_000_000:g} million naira"
    elif price >= 1_000:
        text = f"{price / 1_000:g} thousand naira"
    else:
        text = f"{price:g} naira"
    return text + (", negotiable" if negotiable else "")


def format_listing(listing: dict) -> str:
    l = dict(listing)
    if l.get("price"):
        l["price"] = format_price(l["price"], bool(l.get("negotiable")))
    for key in ("currency", "negotiable", "id"):
        l.pop(key, None)
    lines = [f"{k}: {v}" for k, v in l.items() if v not in (None, "", [])]
    return "\n".join(lines)


async def entrypoint(ctx: JobContext) -> None:
    await ctx.connect()

    raw = (ctx.job.metadata or "").strip()
    slug = None
    if raw:
        try:
            slug = json.loads(raw).get("slug")
        except (json.JSONDecodeError, AttributeError):
            slug = raw  # plain slug, no JSON needed
    log.info("job metadata=%r slug=%r", raw, slug)

    listing_text = "No listing details are available for this call."
    if slug:
        try:
            data = await fetch_listing(slug)
            if data.get("found"):
                listing_text = format_listing(data["listing"])
        except Exception:
            log.exception("listing lookup failed")
    log.info("listing_text=%r", listing_text[:300])

    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            model=os.getenv("GEMINI_LIVE_MODEL", "gemini-3.8-live"),
            api_key=os.getenv("GEMINI_API_KEY"),
            api_version="v1beta",
            voice=os.getenv("GEMINI_VOICE", "Puck"),
            **({"language": os.environ["GEMINI_LANGUAGE"]} if os.getenv("GEMINI_LANGUAGE") else {}),
            temperature=0.6,
            # input_audio_transcription=types.AudioTranscriptionConfig(),
        ),
    )
    session.on("user_state_changed", lambda ev: log.info("user state: %s -> %s", ev.old_state, ev.new_state))
    session.on("agent_state_changed", lambda ev: log.info("agent state: %s -> %s", ev.old_state, ev.new_state))
    session.on("user_input_transcribed", lambda ev: log.info("heard: %r final=%s", ev.transcript, ev.is_final))
    await session.start(
        room=ctx.room,
        agent=Agent(instructions=f"{BASE_INSTRUCTIONS}\n\nListing details:\n{listing_text}"),
    )
    await session.generate_reply(
        instructions=f"Greet the caller in one or two sentences. Say: {DISCLOSURE}"
    )


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="affilhomes-enquiry",
            initialize_process_timeout=60,
            num_idle_processes=1,
        )
    )