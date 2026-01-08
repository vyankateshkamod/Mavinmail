import { pineconeIndex } from '../utils/pinecone.js';
import { embedDocuments, embedQuery } from './cohereService.js';
import { ScoredPineconeRecord } from '@pinecone-database/pinecone';
import crypto from 'crypto';

// Chunk helper
const chunkText = (text: string, chunkSize = 500): string[] => {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
};

// Hash helper for dedupe protection
const hash = (str: string) =>
  crypto.createHash('sha256').update(str).digest('hex');

export interface EmailMeta {
  messageId: string;      // From email header
  subject: string;
  from: string;
  to: string;
  timestamp: string;      // ISO string
}

export const upsertEmailChunks = async (
  emailContent: string,
  emailId: string,
  userId: string,
  emailMeta: EmailMeta
): Promise<void> => {
  const chunks = chunkText(emailContent);
  const embeddings = await embedDocuments(chunks);

  const emailContentHash = hash(emailContent);

  const vectors = chunks.map((chunk, i) => ({
    id: `${emailId}-chunk-${i}`,
    values: embeddings[i],
    metadata: {
      // Chunk info
      // originalText: chunk, // REMOVED for Privacy - do not store raw text
      chunkIndex: i,

      // Email-level info (CRITICAL)
      emailId,
      messageId: emailMeta.messageId,
      subject: emailMeta.subject,
      from: emailMeta.from,
      to: emailMeta.to,
      emailTimestamp: emailMeta.timestamp,
      emailContentHash
    }
  }));

  // Upsert in batches of 100
  for (let i = 0; i < vectors.length; i += 100) {
    const batch = vectors.slice(i, i + 100);
    await pineconeIndex.namespace(userId).upsert(batch);
  }
};

// Query relevant chunks
export const queryRelevantEmailChunks = async (
  query: string,
  userId: string
): Promise<
  ScoredPineconeRecord<{
    emailId: string;
    chunkIndex: number;
    messageId: string;
    subject: string;
    emailTimestamp: string;
  }>[]
> => {
  const queryEmbedding = await embedQuery(query);

  const queryResult = await pineconeIndex.namespace(userId).query({
    topK: 10,
    vector: queryEmbedding,
    includeMetadata: true
  });

  return (queryResult.matches || []).filter(
    (m): m is ScoredPineconeRecord<any> =>
      !!m.metadata?.emailId
  );
};
