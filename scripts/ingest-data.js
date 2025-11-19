require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function splitText(text, maxLength = 4000, overlap = 200) {
  if (text.length <= maxLength) return [text];
  
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    let endIndex = startIndex + maxLength;
    
    if (endIndex < text.length) {
      // Find the last period or newline to avoid cutting in the middle of a sentence
      const lastPeriod = text.lastIndexOf('.', endIndex);
      const lastNewline = text.lastIndexOf('\n', endIndex);
      const cutIndex = Math.max(lastPeriod, lastNewline);
      
      if (cutIndex > startIndex) {
        endIndex = cutIndex + 1; // Include the punctuation
      }
    }
    
    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk) chunks.push(chunk);
    
    startIndex = endIndex - overlap;
  }
  
  return chunks;
}

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  } catch (e) {
    console.error('Error generating embedding:', e.message);
    return null;
  }
}

async function ingest() {
  const dataPath = path.join(__dirname, '../data/transcripts.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('No data found at data/transcripts.json');
    return;
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const documents = JSON.parse(rawData);

  console.log(`Found ${documents.length} original videos. Starting chunking and ingestion...`);

  let totalChunks = 0;

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const { content, ...metadata } = doc;

    // Split content into manageable chunks
    const chunks = splitText(content);
    
    for (let j = 0; j < chunks.length; j++) {
      const chunkContent = chunks[j];
      
      // Add chunk metadata
      const chunkMetadata = {
        ...metadata,
        chunk_index: j,
        total_chunks: chunks.length
      };

      try {
        const embedding = await generateEmbedding(chunkContent);
        if (!embedding) continue;
        
        const { error } = await supabase.from('documents').insert({
          content: chunkContent,
          metadata: chunkMetadata,
          embedding,
        });

        if (error) {
          console.error(`Error inserting video ${i+1}, chunk ${j+1}:`, error.message);
        } else {
          totalChunks++;
          if (totalChunks % 10 === 0) {
             console.log(`Processed video ${i + 1}/${documents.length} (Total chunks inserted: ${totalChunks})`);
          }
        }
      } catch (e) {
        console.error(`Error processing video ${i+1}, chunk ${j+1}:`, e.message);
      }
    }
  }
  
  console.log(`Ingestion complete! Total chunks: ${totalChunks}`);
}

ingest();
