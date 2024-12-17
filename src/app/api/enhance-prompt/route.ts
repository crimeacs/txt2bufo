import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface ComicLayout {
    id: string;
    name: string;
    description: string;
    dimensions: string;
}

export async function POST(request: Request) {
    if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json(
            { error: 'ANTHROPIC_API_KEY not configured' },
            { status: 500 }
        );
    }

    try {
        const { originalPrompt, imageDescription, layout, improvements } = await request.json();
        
        // Validate layout data
        if (!layout || !layout.name || !layout.description) {
            return NextResponse.json(
                { error: 'Invalid layout information' },
                { status: 400 }
            );
        }

        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            messages: [{
                role: "user",
                content: `You are an AI assistant specializing in generating meme-worthy Bufo frog cartoon images. Your task is to analyze the original prompt and enhance it to create humorous and expressive frog meme art.

${imageDescription ? `Description of previously generated image:
${imageDescription}

` : ''}${improvements ? `Suggested improvements from analysis:
${improvements}

` : ''}Original prompt: "${originalPrompt}"

Layout: ${layout.description}

IMPORTANT: Always start the prompt with "${layout.name.toLowerCase()}:" and maintain this format throughout.

Please follow these steps to create an improved meme frog prompt that considers the ${layout.name} format:

1. Consider these key meme frog elements:
   - Frog character design (Bufo style)
   - Exaggerated expressions and reactions
   - Meme text placement and style
   - Humorous poses and situations
   - Simple but impactful backgrounds
   - Meme-appropriate lighting and effects
   - Internet culture references
   - Memorable visual impact

2. Structure the improved prompt using:
   art_style: {
     - Cartoon/meme art style
     - Bold outlines
     - Vibrant colors
     - Exaggerated features
   }
   frog_elements: {
     - Bufo frog characteristics
     - Expression and pose
     - Meme context
     - Interaction elements
   }
   meme_components: {
     - Text style and placement
     - Background elements
     - Visual gags
     - Meme format conventions
   }

3. Format requirements:
   - Keep it under 1000 characters
   - Focus on meme culture elements
   - Emphasize humor and expressiveness
   - Maintain meme recognition
   - Optimize for ${layout.name} format

Provide ONLY the improved prompt text, without explanations or notes.`
            }]
        });

        return NextResponse.json(message.content[0].text);
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}