"use client"

import { useState, useRef } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"
import { Upload, Youtube } from "lucide-react"

interface UploadProps {
  onUpload: (file: File) => void
  onYouTubeUrl: (url: string) => void
  isUploading?: boolean
}

export function VideoUpload({ onUpload, onYouTubeUrl, isUploading = false }: UploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState("")

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('video/')) {
        onUpload(file)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type.startsWith('video/')) {
        onUpload(file)
      }
    }
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleYouTubeSubmit = () => {
    if (youtubeUrl.trim()) {
      onYouTubeUrl(youtubeUrl.trim())
      setYoutubeUrl("")
    }
  }

  const isValidYouTubeUrl = (url: string) => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/
    return regex.test(url)
  }

  return (
    <Tabs defaultValue="upload" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upload" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload File
        </TabsTrigger>
        <TabsTrigger value="youtube" className="flex items-center gap-2">
          <Youtube className="h-4 w-4" />
          YouTube URL
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="upload">
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 w-full transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="video/*"
            onChange={handleChange}
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-2">
              Upload your video
            </h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop your MP4 file here, or click to browse
            </p>
            <Button 
              onClick={onButtonClick} 
              disabled={isUploading}
              variant="outline"
            >
              {isUploading ? "Processing..." : "Choose File"}
            </Button>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="youtube">
        <div className="border-2 border-dashed rounded-lg p-6 w-full border-muted-foreground/25">
          <div className="flex flex-col items-center justify-center text-center">
            <Youtube className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-2">
              Extract from YouTube
            </h3>
            <p className="text-muted-foreground mb-4">
              Enter a YouTube video URL to extract its transcript
            </p>
            <div className="flex gap-2 w-full max-w-md">
              <Input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                disabled={isUploading}
                className="flex-1"
              />
              <Button
                onClick={handleYouTubeSubmit}
                disabled={isUploading || !isValidYouTubeUrl(youtubeUrl)}
                variant="outline"
              >
                {isUploading ? "Processing..." : "Extract"}
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}