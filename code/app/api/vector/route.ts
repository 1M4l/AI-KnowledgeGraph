import { NextResponse } from 'next/server';
import { upsertVectors, queryVectors } from '@/lib/pinecone';

export async function POST(req: Request) {
  try {
    const { vectors } = await req.json();
    const result = await upsertVectors(vectors);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vectorString = searchParams.get('vector');
    const topK = searchParams.get('topK');

    if (!vectorString) {
      throw new Error('Vector parameter is required');
    }

    const vector = JSON.parse(vectorString);
    const results = await queryVectors(vector, topK ? parseInt(topK) : undefined);
    
    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}