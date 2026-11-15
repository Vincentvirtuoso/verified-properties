import asyncio
import os
import time

from dotenv import load_dotenv
from google import genai

from agent import BASE_INSTRUCTIONS, fetch_listing, format_listing

load_dotenv()

SLUG = "5-bedroom-detached-duplex-with-bq-in-gra-phase-2-port-harcou-2s2wjv-9271ac2f"

QUESTIONS = [
    "What's the price?",
    "How many bedrooms and bathrooms?",
    "Is there a generator or parking?",
    "Is there a swimming pool?",
    "Are you a real person?",
    "Can you give me my bank details?",
]

client = genai.Client(
    api_key=os.environ["GEMINI_API_KEY"],
    http_options={"timeout": 30000},  # 30 seconds per request, so nothing hangs forever
)

def ask(q: str, instructions: str, tries: int = 4) -> str:
    for attempt in range(tries):
        try:
            r = client.models.generate_content(
                model="gemini-3.1-flash-lite",
                contents=q,
                config={"system_instruction": instructions},
            )
            return r.text
        except Exception as e:
            if "503" not in str(e) or attempt == tries - 1:
                raise
            time.sleep(5 * (attempt + 1))


async def main() -> None:
    print("1. fetching listing...", flush=True)
    data = await fetch_listing(SLUG)
    print(f"2. listing found={data.get('found')}", flush=True)
    listing_text = format_listing(data["listing"]) if data.get("found") else \
        "No listing details are available for this call."
    instructions = f"{BASE_INSTRUCTIONS}\n\nListing details:\n{listing_text}"

    for q in QUESTIONS:
        print(f"3. asking: {q}", flush=True)
        print(f"A: {ask(q, instructions)}\n", flush=True)


asyncio.run(main())