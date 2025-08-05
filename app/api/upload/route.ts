import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { PrismaClient } from '../../generated/prisma'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 })
    }

    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ success: false, message: 'Invalid file type' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}_${originalName}`
    const filepath = path.join(uploadsDir, filename)

    // Write file to disk
    await writeFile(filepath, buffer)

    // Save to database
    const video = await prisma.video.create({
      data: {
        filename: originalName,
        fileUrl: `/uploads/${filename}`,
      },
    })

    return NextResponse.json({ 
      success: true, 
      videoId: video.id,
      filename: video.filename,
      fileUrl: video.fileUrl
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 })
  }
}