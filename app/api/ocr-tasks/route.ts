/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY! });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image');

    if (!image || !(image instanceof Blob)) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert blob to base64
    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = image.type;

    const systemPrompt = `You are an OCR assistant that extracts todo tasks from notebook images. 

Instructions:
1. Look for any text that appears to be a task or todo item
2. Common task indicators: checkboxes (☐, □, [ ], etc.), bullet points (•, -, *), numbers, or lines starting with action words
3. Extract each task as a clean, actionable item
4. Remove any checkmarks, bullet points, or formatting symbols
5. Convert handwriting to clean, readable text
6. If a task is crossed out or marked as complete, skip it
7. Only return actual tasks, not headers, dates, or other non-task text

Return the tasks as a JSON array of strings. Each task should be a clean, actionable item.

Example output:
["Buy groceries", "Call dentist", "Finish project report", "Schedule meeting"]

If no tasks are found, return an empty array.`;

    const userPrompt = `Please extract all todo tasks from this notebook image. Look for any items that appear to be tasks, whether they have checkboxes, bullet points, or are just listed as things to do.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No response from OCR service' },
        { status: 500 }
      );
    }

    // Try to parse the response as JSON
    let tasks: string[] = [];
    try {
      // Look for JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        tasks = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: try to extract tasks from plain text
        const lines = content.split('\n').filter((line) => line.trim());
        tasks = lines
          .map((line) => line.replace(/^[-•*□☐\s]+/, '').trim())
          .filter((task) => task.length > 0);
      }
    } catch (parseError) {
      console.error('Failed to parse OCR response:', parseError);
      // Fallback: extract tasks from plain text
      const lines = content.split('\n').filter((line) => line.trim());
      tasks = lines
        .map((line) => line.replace(/^[-•*□☐\s]+/, '').trim())
        .filter((task) => task.length > 0);
    }

    // Clean up tasks
    tasks = tasks
      .map((task) => task.trim())
      .filter((task) => task.length > 0 && task.length < 200) // Remove empty or too long tasks
      .filter((task) => !task.match(/^(date|time|header|title|page)/i)); // Remove non-task items

    console.log('OCR Response:', content);
    console.log('Extracted tasks:', tasks);

    return NextResponse.json({
      tasks,
      rawResponse: content,
    });
  } catch (error: any) {
    console.error('OCR processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    );
  }
}
