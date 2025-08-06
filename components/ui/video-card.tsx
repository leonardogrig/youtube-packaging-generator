"use client"

import { Card, CardContent } from "./card"
import { Play, Youtube } from "lucide-react"

interface VideoCardProps {
  video: {
    id: string
    filename: string
    fileUrl: string
    createdAt: Date
    transcription?: string | null
    source?: string
    youtubeVideoId?: string
  }
  onClick: (video: any) => void
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
      onClick={() => onClick(video)}
    >
      <CardContent className="p-4">
        <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center relative overflow-hidden">
          {video.source === 'youtube' && video.youtubeVideoId ? (
            <>
              <img 
                src={`https://img.youtube.com/vi/${video.youtubeVideoId}/maxresdefault.jpg`}
                alt="YouTube thumbnail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to medium quality thumbnail if maxres doesn't exist
                  const target = e.target as HTMLImageElement;
                  target.src = `https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`;
                }}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Play className="h-12 w-12 text-white" fill="white" />
              </div>
            </>
          ) : (
            <>
              <video 
                src={video.fileUrl}
                className="w-full h-full object-cover"
                muted
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Play className="h-12 w-12 text-white" fill="white" />
              </div>
            </>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate flex-1">{video.filename}</h3>
            {video.source === 'youtube' && (
              <Youtube className="h-4 w-4 text-red-500" />
            )}
          </div>
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