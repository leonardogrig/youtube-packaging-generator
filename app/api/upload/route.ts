import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { PrismaClient } from '../../generated/prisma'

const prisma = new PrismaClient()

// Disable body size limit
export const maxDuration = 300 // 5 minutes for large files
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload endpoint called')
    
    // Check content type
    const contentType = request.headers.get('content-type') || ''
    console.log('Content-Type:', contentType)
    console.log('Content-Length:', request.headers.get('content-length'))
    
    // Try to parse FormData - wrap in try-catch for better error handling
    let formData: FormData
    let file: File | null = null
    
    try {
      // For Next.js 14+, we need to handle large files differently
      formData = await request.formData()
      file = formData.get('file') as File | null
    } catch (parseError: any) {
      console.error('FormData parse error:', parseError)
      
      // If FormData parsing fails, it might be due to size limits
      // Return a more helpful error message
      if (parseError.message?.includes('CRLF') || parseError.message?.includes('boundary')) {
        return NextResponse.json({ 
          success: false, 
          message: 'File too large or corrupted. The server cannot parse files larger than 4.5MB using standard upload. Please use chunks or reduce file size.',
          error: parseError.message
        }, { status: 413 }) // 413 = Payload Too Large
      }
      
      throw parseError
    }

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 })
    }

    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2)
    })

    // Check file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ success: false, message: 'Invalid file type - must be a video' }, { status: 400 })
    }

    // Convert to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true }).catch(() => {})

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}_${originalName}`
    const filepath = path.join(uploadsDir, filename)

    // Write file
    await writeFile(filepath, buffer)
    console.log('File saved to:', filepath)

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
      fileUrl: video.fileUrl,
      size: file.size
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    
    // Provide detailed error information
    return NextResponse.json({
      success: false,
      message: error.message || 'Upload failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}