import asyncio
from dotenv import load_dotenv
from livekit import api

load_dotenv()

async def main():
    lkapi = api.LiveKitAPI()  # reads LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
    d = await lkapi.agent_dispatch.create_dispatch(
        api.CreateAgentDispatchRequest(
            agent_name="affilhomes-enquiry",
            room="slug-test-3",
            metadata="3-plots-of-land-in-lagos-4y5ch0-009618ce",
        )
    )
    print(d)
    await lkapi.aclose()

asyncio.run(main())