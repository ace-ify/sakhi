import asyncio
import os
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import openai, silero

load_dotenv()

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            "You are Parcha, a caring and compassionate Indian healthcare companion for elderly individuals like Dadi. "
            "You speak primarily in respectful Hindi and Hinglish ('नमस्ते दादी जी', 'हाँ दादी', 'दवा ले ली?'). "
            "Your main tasks are: "
            "1. Reminding them of medication schedules politely. "
            "2. Asking if they took their medicine with water/food. "
            "3. If they mention emergency or chest pain, immediately advise resting and alert family."
        ),
    )

    assistant = VoiceAssistant(
        vad=silero.VAD.load(),
        stt=openai.STT(model="whisper-1", language="hi"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=openai.TTS(voice="alloy"),
        chat_ctx=initial_ctx,
    )

    assistant.start(ctx.room)
    await assistant.say("नमस्ते दादी जी! मैं आपका स्वास्थ्य साथी पर्चा हूँ। क्या आपने सुबह की दवा ले ली है?", allow_interruptions=True)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))

