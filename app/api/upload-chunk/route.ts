import { NextRequest, NextResponse } from 'next/server'
import { writeFile, appendFile, mkdir, unlink, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { PrismaClient } from '../../generated/prisma'

const prisma = new PrismaClient()

export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Temporary storage for upload sessions
const uploadSessions = new Map<string, { 
  filename: string, 
  totalChunks: number, 
  receivedChunks: Set<number>,
  tempPath: string 
}>()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Get chunk data
    const chunk = formData.get('chunk') as File
    const chunkIndex = parseInt(formData.get('chunkIndex') as string)
    const totalChunks = parseInt(formData.get('totalChunks') as string)
    const filename = formData.get('filename') as string
    const uploadId = formData.get('uploadId') as string
    
    if (!chunk || isNaN(chunkIndex) || isNaN(totalChunks) || !filename || !uploadId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required chunk data' 
      }, { status: 400 })
    }
    
    console.log(`Receiving chunk ${chunkIndex + 1}/${totalChunks} for ${filename}`)
    
    // Create temp directory
    const tempDir = path.join(process.cwd(), 'temp', 'uploads')
    await mkdir(tempDir, { recursive: true })
    
    // Initialize or get session
    if (!uploadSessions.has(uploadId)) {
      uploadSessions.set(uploadId, {
        filename,
        totalChunks,
        receivedChunks: new Set(),
        tempPath: path.join(tempDir, `${uploadId}_${filename}`)
      })
    }
    
    const session = uploadSessions.get(uploadId)!
    
    // Save chunk
    const chunkData = Buffer.from(await chunk.arrayBuffer())
    const chunkPath = `${session.tempPath}.part${chunkIndex}`
    await writeFile(chunkPath, chunkData)
    
    session.receivedChunks.add(chunkIndex)
    
    // Check if all chunks received
    if (session.receivedChunks.size === totalChunks) {
      console.log('All chunks received, assembling file...')
      
      // Combine chunks
      const chunks: Buffer[] = []
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = `${session.tempPath}.part${i}`
        const chunkBuffer = await readFile(chunkPath)
        chunks.push(chunkBuffer)
        
        // Clean up chunk file
        await unlink(chunkPath).catch(() => {})
      }
      
      const completeFile = Buffer.concat(chunks)
      
      // Save to public/uploads
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadsDir, { recursive: true })
      
      const timestamp = Date.now()
      const originalName = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
      const finalFilename = `${timestamp}_${originalName}`
      const finalPath = path.join(uploadsDir, finalFilename)
      
      await writeFile(finalPath, completeFile)
      console.log('File assembled and saved to:', finalPath)
      
      // Save to database
      const video = await prisma.video.create({
        data: {
          filename: originalName,
          fileUrl: `/uploads/${finalFilename}`,
        },
      })
      
      // Clean up session
      uploadSessions.delete(uploadId)
      
      return NextResponse.json({
        success: true,
        complete: true,
        videoId: video.id,
        filename: video.filename,
        fileUrl: video.fileUrl
      })
    }
    
    // Return progress
    return NextResponse.json({
      success: true,
      complete: false,
      receivedChunks: session.receivedChunks.size,
      totalChunks
    })
    
  } catch (error: any) {
    console.error('Chunk upload error:', error)
    return NextResponse.json({
      success: false,
      message: error.message || 'Chunk upload failed'
    }, { status: 500 })
  }
}