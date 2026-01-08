import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
const EMBEDDING_MODEL = 'embed-english-v3.0';

/**
 * Creates embeddings for document chunks.
 */
export const embedDocuments = async (texts: string[]): Promise<number[][]> => {
  const response = await cohere.embed({
    texts,
    model: EMBEDDING_MODEL,
    inputType: 'search_document',
  });

  // A runtime check to ensure the response format is correct.
  if (response && Array.isArray(response.embeddings)) {
    return response.embeddings as number[][];
  }
  
  throw new Error("Unexpected embedding response format from Cohere.");
};

/**
 * Creates a single embedding for a user query.
 */
export const embedQuery = async (text: string): Promise<number[]> => {
  const response = await cohere.embed({
    texts: [text],
    model: EMBEDDING_MODEL,
    inputType: 'search_query',
  });

  // A runtime check for the single query response.
  if (response && Array.isArray(response.embeddings) && response.embeddings.length > 0) {
    return response.embeddings[0] as number[];
  }
  
  throw new Error("Unexpected embedding response format from Cohere for query.");
};