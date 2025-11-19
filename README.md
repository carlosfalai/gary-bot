# Gary The Numbers Bot

A chatbot powered by Gary the Numbers Guy's wisdom, using OpenAI and Supabase Vector Search.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   A `.env.local` file has been created with your provided keys.
   Ensure these variables are set in your Netlify deployment settings as well.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`

3. **Database Setup (Supabase):**
   - Go to your Supabase project SQL Editor.
   - Copy and paste the content of `scripts/schema.sql` and run it. This creates the `documents` table and the vector search function.

4. **Ingest Knowledge Base:**
   - Export your Google Sheet transcripts to JSON.
   - Format them like the example in `data/transcripts.json`.
   - Run the ingestion script:
     ```bash
     node scripts/ingest-data.js
     ```
   - This will generate embeddings and store them in Supabase.

5. **Run Locally:**
   ```bash
   npm run dev
   ```

6. **Deploy to Netlify:**
   - Connect this repository to Netlify.
   - Add the environment variables in the Netlify dashboard.
   - Deploy!

## Features

- **RAG (Retrieval Augmented Generation):** Searches your transcripts for relevant context before answering.
- **Gary Persona:** System prompt tuned to sound like Gary.
- **Modern UI:** Dark mode, smooth animations, specific styling.
