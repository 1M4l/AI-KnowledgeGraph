import { PDFLoader } from "langchain/document_loaders/fs/pdf";

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const loader = new PDFLoader(new Blob([buffer]));
    const docs = await loader.load();
    return docs.map(doc => doc.pageContent).join('\n');
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

export function splitTextIntoChunks(text: string, chunkSize: number = 1000): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    if (currentLength + word.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
      currentLength = 0;
    }
    currentChunk.push(word);
    currentLength += word.length + 1; // +1 for the space
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}