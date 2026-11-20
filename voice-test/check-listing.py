import asyncio, os, json
import httpx
from dotenv import load_dotenv

load_dotenv()
SLUG = "3-plots-of-land-in-lagos-4y5ch0-009618ce"

async def main():
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            os.environ["LISTING_TOOL_URL"],
            headers={"x-tool-secret": os.environ["LISTING_TOOL_SECRET"]},
            json={"slug": SLUG},
        )
        print("status:", r.status_code)
        print(json.dumps(r.json(), indent=2)[:1500])

asyncio.run(main())