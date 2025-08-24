import Groq from "groq-sdk"
import { PrismaClient } from "../app/generated/prisma"
import ffmpeg from "fluent-ffmpeg"
import { writeFile, unlink } from "fs/promises"
import path from "path"

const groq = new Groq({
  apiKey: process.env.GROQ_KEY,
})

const prisma = new PrismaClient()

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on non-network errors
      if (!isNetworkError(error)) {
        throw error
      }
      
      if (attempt === maxRetries) {
        throw error
      }
      
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Transcription attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

function isNetworkError(error: any): boolean {
  return error?.code === 'ECONNRESET' || 
         error?.code === 'ECONNREFUSED' || 
         error?.code === 'ETIMEDOUT' ||
         error?.message?.includes('Connection error') ||
         error?.cause?.code === 'ECONNRESET'
}

async function chunkAudioFile(audioPath: string, chunkDurationMinutes: number = 10): Promise<string[]> {
  const tempDir = path.dirname(audioPath)
  const baseName = path.basename(audioPath, '.wav')
  const chunkPaths: string[] = []
  
  // Get audio duration first
  const duration = await new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) reject(err)
      else resolve(metadata.format.duration || 0)
    })
  })
  
  const chunkDurationSeconds = chunkDurationMinutes * 60
  const numberOfChunks = Math.ceil(duration / chunkDurationSeconds)
  
  console.log(`Audio duration: ${duration}s, splitting into ${numberOfChunks} chunks of ${chunkDurationMinutes} minutes each`)
  
  // Create chunks
  for (let i = 0; i < numberOfChunks; i++) {
    const startTime = i * chunkDurationSeconds
    const chunkPath = path.join(tempDir, `${baseName}_chunk_${i}.wav`)
    chunkPaths.push(chunkPath)
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg(audioPath)
        .seekInput(startTime)
        .duration(chunkDurationSeconds)
        .toFormat('wav')
        .audioChannels(1)
        .audioBitrate('16k')
        .audioFrequency(16000)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(chunkPath)
    })
  }
  
  return chunkPaths
}

export async function transcribeVideo(videoId: string, videoPath: string) {
  let tempAudioPath: string | null = null
  let chunkPaths: string[] = []
  
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

    // Check file size and chunk if necessary (limit ~20MB for safety)
    const stats = await require('fs/promises').stat(tempAudioPath!)
    const fileSizeMB = stats.size / (1024 * 1024)
    
    let allTranscriptions: any[] = []
    
    if (fileSizeMB > 20) {
      console.log(`Audio file is ${fileSizeMB.toFixed(1)}MB, chunking into smaller segments`)
      chunkPaths = await chunkAudioFile(tempAudioPath!, 10) // 10-minute chunks
      
      // Process each chunk
      for (let i = 0; i < chunkPaths.length; i++) {
        const chunkPath = chunkPaths[i]
        const audioBuffer = await require('fs/promises').readFile(chunkPath)
        const audioFile = new File([audioBuffer], `audio_chunk_${i}.wav`, { type: "audio/wav" })
        
        console.log(`Processing chunk ${i + 1}/${chunkPaths.length}`)
        
        const chunkTranscription = await retryWithBackoff(async () => {
          return await groq.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-large-v3-turbo",
            response_format: "verbose_json",
            timestamp_granularities: ["word"]
          })
        })
        
        // Adjust timestamps for chunk offset
        const chunkStartTime = i * 10 * 60 // 10 minutes per chunk in seconds
        if (chunkTranscription.words) {
          chunkTranscription.words = chunkTranscription.words.map((word: any) => ({
            ...word,
            start: word.start + chunkStartTime,
            end: word.end + chunkStartTime
          }))
        }
        
        allTranscriptions.push(chunkTranscription)
      }
    } else {
      // File is small enough, process normally
      const audioBuffer = await require('fs/promises').readFile(tempAudioPath!)
      const audioFile = new File([audioBuffer], "audio.wav", { type: "audio/wav" })

      const transcription = await retryWithBackoff(async () => {
        return await groq.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-large-v3-turbo",
          response_format: "verbose_json",
          timestamp_granularities: ["word"]
        })
      })
      
      allTranscriptions.push(transcription)
    }
    
    // Combine all transcriptions
    const combinedTranscription = combineTranscriptions(allTranscriptions)
    
    // Format transcription into YouTube-style format
    const formattedTranscription = formatTranscription(combinedTranscription)

    // Update video record with transcription
    await prisma.video.update({
      where: { id: videoId },
      data: { transcription: formattedTranscription }
    })

    return formattedTranscription
  } catch (error: any) {
    console.error('Transcription error:', error)
    
    // Provide more specific error messages
    if (isNetworkError(error)) {
      throw new Error('Network connection failed. Please check your internet connection and try again.')
    } else if (error?.status === 401) {
      throw new Error('Invalid API key. Please check your GROQ_KEY configuration.')
    } else if (error?.status === 413) {
      throw new Error('Audio file too large. Try with a shorter video or check chunking logic.')
    } else if (error?.status === 429) {
      throw new Error('Rate limit exceeded. Please wait before trying again.')
    } else {
      throw new Error(`Transcription failed: ${error?.message || 'Unknown error'}`)
    }
  } finally {
    // Clean up temporary audio files
    const filesToClean = [tempAudioPath, ...chunkPaths].filter(Boolean)
    
    for (const filePath of filesToClean) {
      try {
        await unlink(filePath!)
      } catch (error) {
        console.error(`Failed to clean up temp file ${filePath}:`, error)
      }
    }
  }
}

function combineTranscriptions(transcriptions: any[]): any {
  if (transcriptions.length === 0) {
    return { text: "", words: [] }
  }
  
  if (transcriptions.length === 1) {
    return transcriptions[0]
  }
  
  // Combine all text
  const combinedText = transcriptions.map(t => t.text || "").join(" ")
  
  // Combine all words with proper timestamps
  const combinedWords = transcriptions.reduce((allWords, transcription) => {
    if (transcription.words && Array.isArray(transcription.words)) {
      return allWords.concat(transcription.words)
    }
    return allWords
  }, [])
  
  return {
    text: combinedText,
    words: combinedWords
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