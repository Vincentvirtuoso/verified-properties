# voice/test_live.py
import asyncio
import os
import sys

from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(
    api_key=os.environ["GEMINI_API_KEY"],
    http_options={"api_version": os.getenv("GEMINI_API_VERSION", "v1beta")},
)


async def try_model(name: str) -> None:
    try:
        async with client.aio.live.connect(
            model=name,
            config={"response_modalities": ["AUDIO"]},
        ) as session:
            print(f"OK    {name}")
    except Exception as e:
        print(f"FAIL  {name}  {type(e).__name__}: {str(e)[:200]}")


async def main() -> None:
    for name in sys.argv[1:]:
        await try_model(name)


asyncio.run(main())