"use client"

import { Card, CardContent } from "./card"
import { Play } from "lucide-react"

interface VideoCardProps {
  video: {
    id: string
    filename: string
    fileUrl: string
    createdAt: Date
    transcription?: string | null
  }
  onClick: (video: any) => void
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={() => onClick(video)}
    >
      <CardContent className="p-4">
        <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center relative overflow-hidden">
          <video 
            src={video.fileUrl}
            className="w-full h-full object-cover"
            muted
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Play className="h-12 w-12 text-white" fill="white" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold truncate">{video.filename}</h3>
          <p className="text-sm text-muted-foreground">
            {new Date(video.createdAt).toLocaleDateString()}
          </p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              video.transcription ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            <span className="text-xs text-muted-foreground">
              {video.transcription ? 'Transcribed' : 'Ready to transcribe'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}