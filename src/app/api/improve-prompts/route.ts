import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { originalPrompt, imageDescription } = await req.json();

    const systemPrompt = imageDescription 
      ? `You are a specialist in improving image generation prompts. Based on the previous image description: "${imageDescription}", enhance this prompt to create an even better image.`
      : 'You are a specialist in improving image generation prompts. Enhance this prompt to create a better image.';

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `${systemPrompt}

Original prompt: "${originalPrompt}"

Focus on:
- Adding specific details about composition, lighting, and atmosphere
- Improving visual elements and style
- Enhancing artistic direction
- Including technical aspects

Return ONLY the enhanced prompt text, nothing else.`
      }]
    });

    // Extract text content from the response
    const content = message.content.find(block => block.type === 'text')?.text;
    if (!content) {
      throw new Error('No text content in response');
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return NextResponse.json({ error: 'Failed to enhance prompt' }, { status: 500 });
  }
}