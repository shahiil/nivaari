import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Mapping from model class names to report types
const CLASS_TO_REPORT_TYPE: Record<string, string> = {
  'Damaged_Concrete_Structures': 'danger',
  'Damaged_Electric_Poles': 'danger',
  'Damaged_Road_Signs': 'danger',
  'Dead_Animal_Pollution': 'danger',
  'Fallen_Trees': 'trees',
  'Garbage': 'garbage',
  'Graffiti': 'other',
  'pothole': 'potholes',
  'road_crack': 'potholes',
};

export interface DetectionResult {
  category: string;
  reportType: string;
  confidence: number;
  detections: Array<{
    category: string;
    class_id: number;
    confidence: number;
    bbox: number[];
  }>;
  total_detections: number;
  filename: string;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Convert image to buffer
    const buffer = await imageFile.arrayBuffer();
    const blob = new Blob([buffer], { type: imageFile.type });

    // Call local model service
    const detectionFormData = new FormData();
    detectionFormData.append('image', blob, imageFile.name);

    const modelResponse = await fetch(
      'http://127.0.0.1:8000/predict?confidence=0.3',
      {
        method: 'POST',
        body: detectionFormData,
      }
    );

    if (!modelResponse.ok) {
      const errorText = await modelResponse.text();
      console.error('Model service error:', errorText);
      return NextResponse.json(
        { error: `Model service error: ${modelResponse.statusText}` },
        { status: modelResponse.status }
      );
    }

    const detectionData = (await modelResponse.json()) as {
      category: string;
      confidence: number;
      detections: Array<{
        category: string;
        class_id: number;
        confidence: number;
        bbox: number[];
      }>;
      total_detections: number;
      filename: string;
    };

    // Map detected category to report type
    let reportType = 'other';
    if (detectionData.category && detectionData.category !== 'No issue detected') {
      reportType = CLASS_TO_REPORT_TYPE[detectionData.category] || 'other';
    }

    const result: DetectionResult = {
      category: detectionData.category,
      reportType,
      confidence: detectionData.confidence,
      detections: detectionData.detections,
      total_detections: detectionData.total_detections,
      filename: detectionData.filename,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Detection API error:', error);
    
    // Check if it's a connection error to the local service
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Local model service not running. Please start it on http://127.0.0.1:8000' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
