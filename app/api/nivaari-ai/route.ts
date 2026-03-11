import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { aiRequestSchema, aiResponseSchema } from '@/lib/nivaari/schemas';
import type { AiTileSuggestion } from '@/lib/nivaari/domain';

function inferSuggestionFromText(input: string): AiTileSuggestion {
  const text = input.toLowerCase();

  if (/(hospital|clinic|ambulance|health)/.test(text)) {
    return { category: 'health', type: 'hospital', confidence: 74 };
  }
  if (/(police|crime|security|patrol)/.test(text)) {
    return { category: 'safety', type: 'police', confidence: 72 };
  }
  if (/(factory|industrial|warehouse|plant)/.test(text)) {
    return { category: 'industrial', type: 'industrial', confidence: 70 };
  }
  if (/(park|tree|forest|garden|nature|green)/.test(text)) {
    return { category: 'nature', type: 'nature', confidence: 76 };
  }
  if (/(road|street|highway|lane|traffic|bridge)/.test(text)) {
    return { category: 'infrastructure', type: 'road', confidence: 78 };
  }
  if (/(building|house|home|apartment|residential|school|office)/.test(text)) {
    return { category: 'residential', type: 'building', confidence: 68 };
  }

  return { category: 'residential', type: 'building', confidence: 45 };
}

// client will be created inside handler because env may be undefined during build

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const body = aiRequestSchema.parse(await request.json());
    const history = body.history;
    const lastUserMessage = [...history].reverse().find((entry) => entry.role === 'user')?.text || '';

    if (!apiKey) {
      return NextResponse.json(inferSuggestionFromText(lastUserMessage));
    }

    const client = new OpenAI({ apiKey });
    const messages: ChatCompletionMessageParam[] = history.map((entry) => ({
      role: entry.role === 'system' || entry.role === 'assistant' ? entry.role : 'user',
      content: entry.text,
    }));
    messages.unshift({
      role: 'system',
      content:
        "You are NIVAARI AI, a geographic data assistant. The user will describe real-world infrastructure. You must extract the details and return ONLY a valid JSON object matching this schema: { category: string, type: string, confidence: number, attributes: {} }. Do not include markdown formatting.",
    });

    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0,
    });
    const text = resp.choices?.[0]?.message?.content || '';
    let obj: unknown;
    try {
      obj = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'invalid JSON', raw: text }, { status: 400 });
    }
    const parsed = aiResponseSchema.safeParse(obj);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid AI payload', raw: obj }, { status: 400 });
    }

    return NextResponse.json(parsed.data);
  } catch (err) {
    console.error(err);
    try {
      const body = await request.clone().json();
      const parsed = aiRequestSchema.safeParse(body);
      if (parsed.success) {
        const lastUserMessage = [...parsed.data.history].reverse().find((entry) => entry.role === 'user')?.text || '';
        return NextResponse.json(inferSuggestionFromText(lastUserMessage));
      }
    } catch (fallbackError) {
      console.warn('Failed to apply local AI fallback', fallbackError);
    }
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
