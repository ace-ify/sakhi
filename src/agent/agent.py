import asyncio
import os
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import openai, silero

load_dotenv(".env.local")
load_dotenv()

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    groq_api_key = os.getenv("GROQ_API_KEY")
    openai_api_key = os.getenv("OPENAI_API_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    # STT: Groq Whisper Turbo (High-accuracy Hindi/Hinglish) or OpenAI
    if groq_api_key:
        stt_plugin = openai.STT(
            base_url="https://api.groq.com/openai/v1",
            api_key=groq_api_key,
            model="whisper-large-v3-turbo",
            language="hi",
        )
    else:
        stt_plugin = openai.STT(model="whisper-1", language="hi", api_key=openai_api_key or "demo")

    # LLM: Groq Llama 3.3 70B (Fast sub-200ms) or Google Gemini
    if groq_api_key:
        llm_plugin = openai.LLM(
            base_url="https://api.groq.com/openai/v1",
            api_key=groq_api_key,
            model="llama-3.3-70b-versatile",
        )
    elif gemini_api_key:
        import livekit.plugins.google as g
        llm_plugin = g.LLM(api_key=gemini_api_key, model="gemini-2.5-flash")
    else:
        llm_plugin = openai.LLM(model="gpt-4o-mini", api_key=openai_api_key or "demo")

    # TTS
    tts_plugin = openai.TTS(voice="alloy", api_key=openai_api_key or "demo")

    instructions = (
        "You are Sakhi (सखी), a loving, warm, and highly respectful companion for elderly Indian grandparents (Dadi ji). "
        "You speak primarily in polite, gentle Hindi and simple Hinglish ('नमस्ते दादी जी', 'हाँ दादी', 'दवा का समय हो गया है'). "
        "Your main tasks are: "
        "1. Reminding them of medication schedules politely with warm care. "
        "2. Asking if they took their medicine with lukewarm water or after meals. "
        "3. If they report symptoms, shortness of breath, or emergency, advise resting immediately and state that the caregiver is being alerted. "
        "Keep your responses short, gentle, and easy for an elderly person to hear and understand."
    )

    agent = Agent(
        instructions=instructions,
        vad=silero.VAD.load(),
        stt=stt_plugin,
        llm=llm_plugin,
        tts=tts_plugin,
    )

    session = AgentSession(agent=agent)
    await session.start(room=ctx.room)
    await session.say(
        "नमस्ते दादी जी! मैं आपकी सखी हूँ। क्या आपने सुबह की बीपी की दवा ले ली है?",
        allow_interruptions=True,
    )

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
