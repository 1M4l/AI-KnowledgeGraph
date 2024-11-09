import { NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/openai';
import { queryVectors } from '@/lib/pinecone';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // Generate embedding for the question
    const questionEmbedding = await generateEmbedding(message);

    // Query Pinecone for similar vectors
    const results = await queryVectors(questionEmbedding);

    // Extract relevant content from results
    const context = results
      .map((match) => (match.metadata as { content: string })?.content || '')
      .join('\n\n');

    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that answers questions based on the provided context. Only use the information from the context to answer questions. If you cannot find the answer in the context, say so."
        },
        {
          role: "user",
          content: `Context: ${context}\n\nQuestion: ${message}`
        }
      ],
      temperature: 0.7,
    });

    return NextResponse.json({
      success: true,
      response: completion.choices[0].message.content,
      results: results.length,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}