import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// client will be created inside handler because env may be undefined during build

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'no API key set' }, { status: 500 });
    }
    const client = new OpenAI({ apiKey });

    const body = await request.json();
    const history: Array<{ role: string; text: string }> = body.history || [];
    const messages = history.map((h) => ({ role: h.role, content: h.text }));
    messages.unshift({
      role: 'system',
      content:
        "You are NIVAARI AI, a geographic data assistant. The user will describe real-world infrastructure. You must extract the details and return ONLY a valid JSON object matching this schema: { category: string, type: string, confidence: number, attributes: {} }. Do not include markdown formatting.",
    });

    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      // typing is overly strict; cast to any to satisfy interface
      messages: messages as any,
      temperature: 0,
    });
    const text = resp.choices?.[0]?.message?.content || '';
    let obj: any;
    try {
      obj = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: 'invalid JSON', raw: text }, { status: 400 });
    }
    return NextResponse.json(obj);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
