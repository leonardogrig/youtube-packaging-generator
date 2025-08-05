import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../generated/prisma'
import { unlink } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const videoId = (await params).id

    // Get video details before deletion
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Delete video file from filesystem
    const filePath = path.join(process.cwd(), 'public', video.fileUrl)
    try {
      await unlink(filePath)
    } catch (error) {
      console.error('Failed to delete file:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete video record from database
    await prisma.video.delete({
      where: { id: videoId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete video:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}