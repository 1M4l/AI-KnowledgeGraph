import { NextResponse } from 'next/server';
import { extractTextFromPDF } from '@/lib/text-processing';
import { generateEmbedding } from '@/lib/openai';
import { upsertVectors } from '@/lib/pinecone';
import { splitTextIntoChunks } from '@/lib/text-processing';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files');
    const vectors = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      // Extract text based on file type
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else if (file.type === 'text/plain') {
        text = await file.text();
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }

      // Split text into chunks
      const chunks = splitTextIntoChunks(text);

      // Generate embeddings for each chunk
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i]);
        vectors.push({
          id: `${file.name}-chunk-${i}`,
          values: embedding,
          metadata: {
            filename: file.name,
            chunk: i,
            content: chunks[i].slice(0, 1000), // Store first 1000 chars of chunk
          },
        });
      }
    }

    // Store vectors in Pinecone
    if (vectors.length > 0) {
      await upsertVectors(vectors);
    }

    return NextResponse.json({ 
      success: true, 
      count: files.length,
      vectorsCreated: vectors.length 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}