import asyncio
from google import genai
from google.genai import types

client = genai.Client(http_options={"api_version": "v1beta"})

async def main():
    config = types.LiveConnectConfig(response_modalities=["AUDIO"])
    async with client.aio.live.connect(model="gemini-3.8-live", config=config) as session:
        print("connected")
        silence = b"\x00" * 3200  # 100 ms of 16 kHz, 16-bit mono PCM
        await session.send_realtime_input(
            audio=types.Blob(data=silence, mime_type="audio/pcm;rate=16000")
        )
        print("audio sent")
        await asyncio.sleep(2)
        print("still open")

asyncio.run(main())