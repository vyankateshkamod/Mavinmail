import { Pinecone } from '@pinecone-database/pinecone';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;

if (!PINECONE_API_KEY) {
  throw new Error('Pinecone environment variables are not set');
}

const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

export const pineconeIndex = pinecone.Index('cohere-kb-index');