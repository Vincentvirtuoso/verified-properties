# affilhomes-voice

LiveKit agent scaffold for Affilhomes AI calling (pilot).

Stack (per current plan):
- Voice layer: LiveKit Agents (Build plan for pilot)
- Assistant model: Gemini (live model name to be confirmed against Google's docs)
- Telephony: Africa's Talking SIP trunk (voice sandbox is not operational; live tests need a paid production account)

Status: SCAFFOLD ONLY. No real calls are wired yet.

## Setup (free parts)
1. Python 3.10+ recommended.
2. `python -m venv .venv && source .venv/bin/activate`
3. `pip install -r requirements.txt`
4. `cp .env.example .env` and fill in values. Never commit `.env`.
5. Run locally in console mode: `python agent.py console`

## Before going live
- Confirm the Gemini live model name and the LiveKit plugin API versions from their docs.
- Africa's Talking SIP trunk and +234 routing need a paid production account.
- Calls are for Nigerian numbers (+234) only for now.
- The assistant must announce itself as an AI assistant and must not impersonate the agent.