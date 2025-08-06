import { NextRequest, NextResponse } from 'next/server'
import { Innertube } from 'youtubei.js'
import { PrismaClient } from '../../generated/prisma'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { youtubeUrl } = await request.json()

    if (!youtubeUrl) {
      return NextResponse.json({ success: false, message: 'YouTube URL is required' }, { status: 400 })
    }

    // Extract video ID from URL
    const videoId = extractVideoId(youtubeUrl)
    if (!videoId) {
      return NextResponse.json({ success: false, message: 'Invalid YouTube URL' }, { status: 400 })
    }

    // Create YouTube client
    const youtube = await Innertube.create()
    
    // Get video info
    const info = await youtube.getInfo(videoId)
    
    if (!info) {
      return NextResponse.json({ 
        success: false, 
        message: 'Video not found or unavailable' 
      }, { status: 404 })
    }

    // Check if captions are available
    if (!info.captions || !info.captions.caption_tracks || info.captions.caption_tracks.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No captions available for this video' 
      }, { status: 404 })
    }

    // Get transcript
    const transcriptData = await info.getTranscript()
    
    if (!transcriptData || !transcriptData.transcript || !transcriptData.transcript.content) {
      return NextResponse.json({ 
        success: false, 
        message: 'No transcript available for this video' 
      }, { status: 404 })
    }

    const body = transcriptData.transcript.content.body
    if (!body || !body.initial_segments) {
      return NextResponse.json({ 
        success: false, 
        message: 'No transcript segments found' 
      }, { status: 404 })
    }
    
    const segments = body.initial_segments
    
    if (segments.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No transcript segments found' 
      }, { status: 404 })
    }

    // Format transcript to match existing format
    const formattedTranscription = formatYouTubeTranscript(segments)

    // Create video record in database
    const video = await prisma.video.create({
      data: {
        filename: `${info.basic_info.title || 'YouTube Video'}.youtube`,
        fileUrl: youtubeUrl,
        transcription: formattedTranscription,
        source: 'youtube',
        youtubeVideoId: videoId
      }
    })

    return NextResponse.json({ 
      success: true, 
      video,
      transcription: formattedTranscription 
    })

  } catch (error) {
    console.error('YouTube transcript extraction error:', error)
    return NextResponse.json({ 
      success: false, 
      message: `Failed to extract YouTube transcript: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

function formatYouTubeTranscript(segments: any[]): string {
  let formatted = ""
  let currentTimestamp = ""
  let currentLine = ""
  const maxLineLength = 50

  for (const segment of segments) {
    // Extract text from the segment
    let text = ''
    if (segment.snippet?.text) {
      text = segment.snippet.text
    } else if (segment.snippet?.runs?.[0]?.text) {
      text = segment.snippet.runs[0].text
    }
    
    // Skip empty segments or headers
    if (!text || text.trim() === '' || segment.type === 'TranscriptSectionHeader') {
      continue
    }
    
    // Convert start time from milliseconds to seconds
    const startSeconds = Math.floor(parseInt(segment.start_ms || '0') / 1000)
    const roundedTime = Math.floor(startSeconds / 3) * 3
    const timestamp = formatTimestamp(roundedTime)
    
    if (timestamp !== currentTimestamp) {
      if (currentLine.trim()) {
        formatted += `${currentTimestamp}\n${currentLine.trim()}\n`
      }
      currentTimestamp = timestamp
      currentLine = text
    } else {
      const testLine = currentLine + " " + text
      if (testLine.length > maxLineLength) {
        formatted += `${currentTimestamp}\n${currentLine.trim()}\n`
        currentTimestamp = timestamp
        currentLine = text
      } else {
        currentLine = testLine
      }
    }
  }

  // Add the last line
  if (currentLine.trim()) {
    formatted += `${currentTimestamp}\n${currentLine.trim()}\n`
  }

  return formatted
}

function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}