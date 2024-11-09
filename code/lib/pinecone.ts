import { PineconeClient } from '@pinecone-database/pinecone';

let pineconeClient: PineconeClient | null = null;

export async function initPinecone() {
  if (!pineconeClient) {
    pineconeClient = new PineconeClient();
    await pineconeClient.init({
      environment: process.env.PINECONE_ENVIRONMENT!,
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pineconeClient;
}

export async function upsertVectors(vectors: any[]) {
  try {
    const client = await initPinecone();
    const index = client.Index(process.env.PINECONE_INDEX_NAME!);
    
    const upsertResponse = await index.upsert({ 
      upsertRequest: {
        vectors,
        namespace: 'default'
      }
    });
    
    return upsertResponse;
  } catch (error) {
    console.error('Error upserting vectors:', error);
    throw error;
  }
}

export async function queryVectors(vector: number[], topK: number = 5) {
  try {
    const client = await initPinecone();
    const index = client.Index(process.env.PINECONE_INDEX_NAME!);
    
    const queryResponse = await index.query({ 
      queryRequest: {
        vector,
        topK,
        includeMetadata: true,
        namespace: 'default'
      }
    });
    
    return queryResponse.matches || [];
  } catch (error) {
    console.error('Error querying vectors:', error);
    throw error;
  }
}