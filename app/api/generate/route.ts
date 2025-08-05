import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '../../../lib/content-generation'
import { PrismaClient } from '../../generated/prisma'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { transcription, videoId } = await request.json()

    if (!transcription || !videoId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Transcription and videoId are required' 
      }, { status: 400 })
    }

    const content = await generateContent(transcription)

    // Save generated content to database
    await prisma.video.update({
      where: { id: videoId },
      data: { 
        generatedContent: JSON.stringify(content) 
      }
    })

    return NextResponse.json({ 
      success: true, 
      content 
    })

  } catch (error) {
    console.error('Content generation error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to generate content' 
    }, { status: 500 })
  }
}