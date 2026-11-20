import asyncio
import json

from dotenv import load_dotenv

load_dotenv()

from agent import fetch_listing, format_listing  # noqa: E402

SLUG = "5-bedroom-detached-duplex-with-bq-in-gra-phase-2-port-harcou-2s2wjv-9271ac2f"


async def main() -> None:
    data = await fetch_listing(SLUG)
    print("found:", data.get("found"))
    print(json.dumps(data, indent=2)[:1500])
    if data.get("found"):
        print("\n--- what the agent receives ---")
        print(format_listing(data["listing"]))


asyncio.run(main())