import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const falKey = process.env.NEXT_PUBLIC_FAL_KEY;
  
  if (!falKey) {
    return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    
    const response = await fetch('https://queue.fal.run/fal-ai/flux-lora', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to Fal.ai:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}