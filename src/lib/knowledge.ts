import { supabase } from './supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function findRelevantContext(query: string): Promise<string> {
  try {
    // 1. Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const embedding = embeddingResponse.data[0].embedding;

    // 2. Search in Supabase (assuming 'match_documents' function exists)
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: 5,
    });

    if (error) {
      console.error('Supabase search error (match_documents might be missing):', error);
      // Fallback: Try simple text search if vector search fails
      const { data: textDocs, error: textError } = await supabase
        .from('documents')
        .select('content')
        .textSearch('content', query.split(' ').join(' & '))
        .limit(3);
      
      if (textError || !textDocs || textDocs.length === 0) {
        return "";
      }
      
      return textDocs.map(d => d.content).join('\n\n');
    }

    if (documents && documents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return documents.map((d: any) => d.content).join('\n\n');
    }

    return "";
  } catch (e) {
    console.error('Error in findRelevantContext:', e);
    return "";
  }
}

