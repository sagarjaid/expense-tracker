/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import {
  fetchSubcategories,
  subcategories as staticSubcategories,
  categoryOptions,
} from '@/lib/utils';

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
        'Transcribe the expense in the format: Amount, Description, Category, Subcategory and Date',
    });
    const text = transcription.text;

    // Dynamically fetch subcategories for each category
    let needs = await fetchSubcategories('Needs');
    if (!needs || needs.length === 0) needs = staticSubcategories['Needs'];
    let wants = await fetchSubcategories('Wants');
    if (!wants || wants.length === 0) wants = staticSubcategories['Wants'];
    let investment = await fetchSubcategories('Investment');
    if (!investment || investment.length === 0)
      investment = staticSubcategories['Investment'];

    const systemPrompt = `Extract the following fields from the user transcription text and return a JSON object in this format: {amount: number, description: string (1-2 words as label), category: Categories string, subcategory: Subcategories string (if not able to understand, use "Other" but try to understand the subcategory from the text first "Other" is last resort)}. Only return the JSON object, nothing else. Category and subcategory must be from these lists: Categories: ${categoryOptions.join(
      ', '
    )}. Subcategories for Needs: ${needs.join(
      ', '
    )}. Subcategories for Wants: ${wants.join(
      ', '
    )}. Subcategories for Investment: ${investment.join(', ')}.`;

    // Now send to OpenAI Chat API to extract structured JSON
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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
      max_tokens: 500,
    });
    // Try to parse the response as JSON
    let extracted;
    try {
      extracted = JSON.parse(chatCompletion.choices[0].message.content || '{}');
    } catch (e) {
      return NextResponse.json(
        {
          error: 'Failed to parse extracted JSON',
          transcription,
          raw: chatCompletion.choices[0].message.content,
        },
        { status: 500 }
      );
    }

    console.log(transcription, extracted, 'extracted');
    return NextResponse.json({ transcription, extracted });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Failed to transcribe' },
      { status: 500 }
    );
  }
}
