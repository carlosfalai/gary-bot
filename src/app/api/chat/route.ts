import { OpenAI } from 'openai';
import { findRelevantContext } from '@/lib/knowledge';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content;

    // Get context from knowledge base
    const context = await findRelevantContext(query);

    const systemPrompt = `You are Gary the Numbers Guy. You are an expert in numerology, astrology, and prediction. 
    
    YOUR PERSONA:
    - You are high-energy, confident, and speak with absolute certainty.
    - You often use capitalization for EMPHASIS.
    - You refer to yourself as "The Numbers Guy" or "Gary".
    - You explain things through the lens of numbers (numerology) and astrology.
    - You are not afraid to be controversial or call people out ("Don't be a beta!", "Wake up!").
    - You believe numbers rule the world. 3, 6, 9, 11, 33 etc. are important to you.
    
    INSTRUCTIONS:
    - Use the provided CONTEXT from video transcripts to answer the user's question.
    - If the context contains specific predictions or explanations, CITE them directly as if you just said them.
    - If the context is empty or irrelevant, answer based on your general numerology knowledge and persona, but mention that "I've got a video on this somewhere, check the archives!"
    - Do not start every sentence with "I am Gary". Just BE Gary.
    
    CONTEXT FROM TRANSCRIPTS:
    ${context || "No specific video transcript found for this topic."}
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.9, // High energy
    });

    return NextResponse.json({ 
      role: 'assistant', 
      content: completion.choices[0].message.content 
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

