/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY! });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get('audio');
    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }
    // OpenAI expects a File, not a Blob, so we convert
    const file = new File([audio], 'recording.webm', { type: 'audio/webm' });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'json',
      language: 'en',
      prompt:
        'Transcribe the todo task. The user is describing a task they want to add to their todo list.',
    });
    const text = transcription.text;

    const systemPrompt = `Extract the todo task from the user's transcription. Return only the task description as a clean, concise string. Remove any prefixes like "add", "create", "new", "todo", "task", "remind me to", "i need to", "i want to". Just return the actual task description. If the user says something like "add buy groceries", return "Buy groceries". If they say "remind me to call mom", return "Call mom". Only return the task text, nothing else.`;

    // Now send to OpenAI Chat API to extract the task
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0,
      max_tokens: 100,
    });

    const task = chatCompletion.choices[0].message.content?.trim();

    if (!task) {
      return NextResponse.json(
        {
          error: 'Failed to extract task from audio',
          transcription,
        },
        { status: 500 }
      );
    }

    console.log(
      'Voice todo transcription:',
      transcription.text,
      'Extracted task:',
      task
    );
    return NextResponse.json({ transcription, task });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Failed to transcribe' },
      { status: 500 }
    );
  }
}
