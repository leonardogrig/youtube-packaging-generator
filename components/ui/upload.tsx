"use client"

import { useState, useRef } from "react"
import { Button } from "./button"
import { Upload } from "lucide-react"

interface UploadProps {
  onUpload: (file: File) => void
  isUploading?: boolean
}

export function VideoUpload({ onUpload, isUploading = false }: UploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

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

  return (
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
  )
}