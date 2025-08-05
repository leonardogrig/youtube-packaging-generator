import { NextRequest, NextResponse } from 'next/server'
import { transcribeVideo } from '../../../lib/transcription'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { videoId, fileUrl } = await request.json()

    if (!videoId || !fileUrl) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
    }

    // Get the full path to the video file
    const filePath = path.join(process.cwd(), 'public', fileUrl)

    // Extract audio and transcribe
    const transcription = await transcribeVideo(videoId, filePath)

    return NextResponse.json({ 
      success: true, 
      transcription 
    })

  } catch (error) {
    console.error('Transcription API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Transcription failed' 
    }, { status: 500 })
  }
}