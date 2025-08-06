import Groq from "groq-sdk"
import { PrismaClient } from "../app/generated/prisma"
import ffmpeg from "fluent-ffmpeg"
import { writeFile, unlink } from "fs/promises"
import path from "path"

const groq = new Groq({
  apiKey: process.env.GROQ_KEY,
})

const prisma = new PrismaClient()

export async function transcribeVideo(videoId: string, videoPath: string) {
  let tempAudioPath: string | null = null
  
  try {
    // Extract audio from video using ffmpeg
    const tempDir = path.join(process.cwd(), 'temp')
    tempAudioPath = path.join(tempDir, `${videoId}_audio.wav`)
    
    // Ensure temp directory exists
    try {
      await require('fs/promises').mkdir(tempDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Extract audio from video
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat('wav')
        .audioChannels(1)
        .audioBitrate('16k')
        .audioFrequency(16000)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(tempAudioPath!)
    })

    // Read the extracted audio file
    const audioBuffer = await require('fs/promises').readFile(tempAudioPath!)
    
    // Create a File object from buffer for Groq
    const audioFile = new File([audioBuffer], "audio.wav", { type: "audio/wav" })

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3-turbo",
      response_format: "verbose_json",
      timestamp_granularities: ["word"]
    })

    // Format transcription into YouTube-style format
    const formattedTranscription = formatTranscription(transcription)

    // Update video record with transcription
    await prisma.video.update({
      where: { id: videoId },
      data: { transcription: formattedTranscription }
    })

    return formattedTranscription
  } catch (error) {
    console.error('Transcription error:', error)
    throw new Error('Failed to transcribe video')
  } finally {
    // Clean up temporary audio file
    if (tempAudioPath) {
      try {
        await unlink(tempAudioPath)
      } catch (error) {
        console.error('Failed to clean up temp file:', error)
      }
    }
  }
}

function formatTranscription(transcription: any): string {
  if (!transcription.words) {
    return transcription.text || ""
  }

  let formatted = ""
  let currentTimestamp = ""
  let currentLine = ""
  const maxLineLength = 50

  for (const word of transcription.words) {
    // Round to nearest 3-second interval
    const roundedTime = Math.floor(word.start / 3) * 3
    const timestamp = formatTimestamp(roundedTime)
    
    if (timestamp !== currentTimestamp) {
      if (currentLine.trim()) {
        formatted += `${currentTimestamp}\n${currentLine.trim()}\n`
      }
      currentTimestamp = timestamp
      currentLine = word.word
    } else {
      const testLine = currentLine + " " + word.word
      if (testLine.length > maxLineLength) {
        formatted += `${currentTimestamp}\n${currentLine.trim()}\n`
        currentTimestamp = timestamp
        currentLine = word.word
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