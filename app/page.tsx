"use client"

import { useState, useEffect } from "react"
import { VideoUpload } from "../components/ui/upload"
import { VideoCard } from "../components/ui/video-card"
import { VideoModal } from "../components/ui/video-modal"

interface Video {
  id: string
  filename: string
  fileUrl: string
  createdAt: Date
  transcription?: string | null
  generatedContent?: string | null
  generatedImageUrl?: string | null
  source?: string
  youtubeVideoId?: string
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos')
      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos)
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    }
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    
    try {
      // Check file size - use chunked upload for files > 4MB
      const MAX_SINGLE_UPLOAD_SIZE = 4 * 1024 * 1024 // 4MB
      
      if (file.size <= MAX_SINGLE_UPLOAD_SIZE) {
        // Small file - use regular upload
        const formData = new FormData()
        formData.append('file', file)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          await fetchVideos()
          
          // Find and open the newly uploaded video
          const updatedVideos = await fetch('/api/videos').then(r => r.json())
          const newVideo = updatedVideos.videos.find((v: Video) => v.id === uploadData.videoId)
          if (newVideo) {
            setSelectedVideo(newVideo)
          }
        } else {
          const error = await uploadResponse.json()
          console.error('Upload failed:', error.message)
        }
      } else {
        // Large file - use chunked upload
        console.log(`File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB - using chunked upload`)
        
        const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB chunks
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
        const uploadId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE
          const end = Math.min(start + CHUNK_SIZE, file.size)
          const chunk = file.slice(start, end)
          
          const formData = new FormData()
          formData.append('chunk', chunk)
          formData.append('chunkIndex', i.toString())
          formData.append('totalChunks', totalChunks.toString())
          formData.append('filename', file.name)
          formData.append('uploadId', uploadId)
          
          const response = await fetch('/api/upload-chunk', {
            method: 'POST',
            body: formData,
          })
          
          if (!response.ok) {
            throw new Error(`Chunk ${i + 1}/${totalChunks} upload failed`)
          }
          
          const result = await response.json()
          console.log(`Uploaded chunk ${i + 1}/${totalChunks}`)
          
          if (result.complete) {
            // Upload complete
            await fetchVideos()
            
            // Find and open the newly uploaded video
            const updatedVideos = await fetch('/api/videos').then(r => r.json())
            const newVideo = updatedVideos.videos.find((v: Video) => v.id === result.videoId)
            if (newVideo) {
              setSelectedVideo(newVideo)
            }
          }
        }
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleYouTubeUrl = async (youtubeUrl: string) => {
    setIsUploading(true)
    
    try {
      const response = await fetch('/api/youtube-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ youtubeUrl }),
      })

      if (response.ok) {
        const data = await response.json()
        await fetchVideos()
        
        // Open the newly created video
        if (data.video) {
          setSelectedVideo(data.video)
        }
      } else {
        const errorData = await response.json()
        console.error('YouTube transcript extraction failed:', errorData.message)
      }
    } catch (error) {
      console.error('YouTube transcript extraction failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleVideoUpdate = (updatedVideo: Video) => {
    setVideos(prev => prev.map(v => v.id === updatedVideo.id ? updatedVideo : v))
  }

  const handleVideoDelete = (videoId: string) => {
    setVideos(prev => prev.filter(v => v.id !== videoId))
  }

  return (
    <div className="container mx-auto p-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">YouTube Package Generator</h1>
        <p className="text-muted-foreground">
          Upload your videos to generate titles, descriptions, timestamps, and thumbnail text
        </p>
      </header>

      <div className="mb-8">
        <VideoUpload onUpload={handleUpload} onYouTubeUrl={handleYouTubeUrl} isUploading={isUploading} />
      </div>

      {videos.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Videos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={setSelectedVideo}
              />
            ))}
          </div>
        </div>
      )}

      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onDelete={handleVideoDelete}
          onVideoUpdate={handleVideoUpdate}
        />
      )}
    </div>
  )
}
