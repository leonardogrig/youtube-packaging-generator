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
      }
    } catch (error) {
      console.error('Upload failed:', error)
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
        <VideoUpload onUpload={handleUpload} isUploading={isUploading} />
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
