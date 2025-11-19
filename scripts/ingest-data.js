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

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

async function ingest() {
  const dataPath = path.join(__dirname, '../data/transcripts.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('Please create a JSON file at gary-bot/data/transcripts.json with your data.');
    console.error('Format: [{ "content": "text...", "metadata": { "url": "..." } }]');
    return;
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const documents = JSON.parse(rawData);

  console.log(`Found ${documents.length} documents. Starting ingestion...`);

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const { content, ...metadata } = doc;

    try {
      const embedding = await generateEmbedding(content);
      
      const { error } = await supabase.from('documents').insert({
        content,
        metadata,
        embedding,
      });

      if (error) {
        console.error(`Error inserting document ${i}:`, error.message);
      } else {
        console.log(`Inserted document ${i + 1}/${documents.length}`);
      }
    } catch (e) {
      console.error(`Error processing document ${i}:`, e.message);
    }
  }
  
  console.log('Ingestion complete!');
}

ingest();

