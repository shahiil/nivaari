import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tile = body.tile;
    if (!tile) {
      return NextResponse.json({ error: 'no tile provided' }, { status: 400 });
    }
    const sectorX = Math.floor(tile.x / 50);
    const sectorZ = Math.floor(tile.z / 50);
    const sectorStr = `${sectorX}${sectorX >= 0 ? 'N' : 'S'}-${Math.abs(sectorZ)}${sectorZ >= 0 ? 'E' : 'W'}`;
    const category = tile.disaster?.category || 'Unknown';
    const confidence = tile.data?.confidence || 0;
    const msg = `🚨 NIVAARI ALERT: ${category === 'natural' ? 'Natural' : 'Man-Made'} Disaster reported at Sector ${sectorStr}. Confidence: ${confidence}%`;
    const webhookUrl = process.env.DISASTER_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg }),
      });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
