// At the top of the file
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Create anthropic client outside the handler
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

interface ImprovementDirection {
  title: string;
  description: string;
  prompt: string;
}

interface AnalysisResponse {
  description: string;
  isOptimal: boolean;
  improvementDirections: ImprovementDirection[];
}

// Valid media types for Anthropic API
const VALID_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type ValidMediaType = typeof VALID_MEDIA_TYPES[number];

// Helper function to validate media type
function isValidMediaType(mediaType: string): mediaType is ValidMediaType {
  return VALID_MEDIA_TYPES.includes(mediaType as ValidMediaType);
}

// Add timeout to fetch
const fetchWithTimeout = async (url: string, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const { imageUrl, prompt, layout } = await request.json();

    // Add debug logging
    console.log('Analyzing image:', { imageUrl, layout });

    // Fetch the image with timeout
    const response = await fetchWithTimeout(imageUrl, 5000);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!isValidMediaType(contentType)) {
      throw new Error(`Unsupported image type: ${contentType}. Supported types are: ${VALID_MEDIA_TYPES.join(', ')}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    console.log('Image fetched and encoded, sending to Claude...');

    // Set a timeout for the Claude API call
    const messagePromise = anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: contentType,
              data: base64Image
            }
          },
          {
            type: "text",
            text: `Analyze this meme-style Bufo frog image and provide critical feedback in this EXACT JSON format:
      {
          "description": "Brief analysis of the current image focusing on design, expressions, and meme effectiveness",
          "isOptimal": boolean indicating if the image is truly exceptional and perfect (should be false unless absolutely perfect),
          "improvementDirections": [
              {
                  "title": "Short, catchy title for this improvement direction",
                  "description": "Detailed explanation of what would be improved",
                  "prompt": "Complete, ready-to-use prompt incorporating these improvements"
              },
              // Two more similar objects for alternative directions
          ]
      }
      
      Be constructively critical and suggest improvements unless the image is truly exceptional. Consider these aspects:
      - Bufo frog character design and proportions
      - Facial expressions and emotional impact
      - Meme text style and placement
      - Background elements and composition
      - Color palette and visual harmony
      - Humor and meme potential
      - Anatomical accuracy (3 fingers, proper limbs)
      - Overall impact and memorability
      
      Guidelines for evaluation:
      1. isOptimal should be true ONLY if the image is truly exceptional in ALL aspects
      2. Even good images can usually be improved in some way
      3. For each improvement direction:
         - Focus on a different aspect (e.g., expression, composition, style)
         - Provide specific, actionable improvements
         - Include a complete, ready-to-use prompt that builds on the current version
      
      Original prompt: "${prompt}"
      Layout format: ${layout.name.toLowerCase()}
      
      Provide response as a SINGLE LINE JSON object.`
          }
        ]
      }]
    });

    // Wait for Claude's response with a timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Claude API timeout')), 50000);
    });

    const message = await Promise.race([messagePromise, timeoutPromise]) as Anthropic.Message;

    // Extract text content from the response
    const content = message.content.find(block => block.type === 'text')?.text;
    if (!content) {
      throw new Error('No text content in response');
    }

    try {
      const cleanedContent = content
        .replace(/[\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const parsedResponse = JSON.parse(cleanedContent) as AnalysisResponse;

      // Validate response structure
      if (!Array.isArray(parsedResponse.improvementDirections) ||
        parsedResponse.improvementDirections.length !== 3) {
        throw new Error('Invalid response structure');
      }

      return NextResponse.json(parsedResponse);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      return NextResponse.json({
        description: content.replace(/[\n\r\t]/g, ' ').trim(),
        isOptimal: false,
        improvementDirections: [{
          title: "Error Processing Response",
          description: "Failed to parse improvement directions",
          prompt: prompt
        }]
      });
    }
  } catch (error: any) {
    console.error('Error in analyze-image:', error);
    return NextResponse.json({
      description: "Failed to analyze image due to an error",
      isOptimal: false,
      improvementDirections: [{
        title: "Error Processing Request",
        description: error.message,
        prompt: prompt
      }]
    }, { status: 500 });
  }
}