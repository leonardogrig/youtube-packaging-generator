"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog"
import { Button } from "./button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
import { ScrollArea } from "./scroll-area"
import { GenerationResults } from "./generation-results"
import { CommunityPosts } from "./community-posts"
import { ImageGeneration } from "./image-generation"
import { Trash2 } from "lucide-react"

interface VideoModalProps {
  video: {
    id: string
    filename: string
    fileUrl: string
    transcription?: string | null
    generatedContent?: string | null
    generatedImageUrl?: string | null
  }
  isOpen: boolean
  onClose: () => void
  onDelete: (videoId: string) => void
  onVideoUpdate: (video: any) => void
}

export function VideoModal({ video, isOpen, onClose, onDelete, onVideoUpdate }: VideoModalProps) {
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [currentVideo, setCurrentVideo] = useState(video)

  useEffect(() => {
    setCurrentVideo(video)
    // Load existing generated content if available
    if (video.generatedContent) {
      try {
        const parsed = JSON.parse(video.generatedContent)
        setGeneratedContent(parsed)
      } catch (error) {
        console.error('Failed to parse generated content:', error)
      }
    }
  }, [video])

  const handleTranscribe = async () => {
    setIsTranscribing(true)
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: currentVideo.id,
          fileUrl: currentVideo.fileUrl,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const updatedVideo = { ...currentVideo, transcription: data.transcription }
        setCurrentVideo(updatedVideo)
        onVideoUpdate(updatedVideo)
      } else {
        alert('Failed to transcribe video')
      }
    } catch (error) {
      console.error('Transcription error:', error)
      alert('Failed to transcribe video')
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleGenerate = async () => {
    if (!currentVideo.transcription) {
      alert('Transcription is required to generate content')
      return
    }

    // Check if content already exists and ask for confirmation
    if (generatedContent) {
      if (!confirm('Generated content already exists. Do you want to replace it with new content?')) {
        return
      }
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcription: currentVideo.transcription,
          videoId: currentVideo.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedContent(data.content)
        
        // Update the current video with generated content
        const updatedVideo = { ...currentVideo, generatedContent: JSON.stringify(data.content) }
        setCurrentVideo(updatedVideo)
        onVideoUpdate(updatedVideo)
      } else {
        alert('Failed to generate content')
      }
    } catch (error) {
      console.error('Generation error:', error)
      alert('Failed to generate content')
    } finally {
      setIsGenerating(false)
    }
  }


  const handleImageGenerated = (imageUrl: string) => {
    const updatedVideo = { ...currentVideo, generatedImageUrl: imageUrl }
    setCurrentVideo(updatedVideo)
    onVideoUpdate(updatedVideo)
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this video?')) {
      try {
        const response = await fetch(`/api/videos/${currentVideo.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          onDelete(currentVideo.id)
          onClose()
        } else {
          alert('Failed to delete video')
        }
      } catch (error) {
        console.error('Delete error:', error)
        alert('Failed to delete video')
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-6xl flex flex-col h-[90vh] max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {currentVideo.filename}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="transcription" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mx-6 flex-shrink-0">
              <TabsTrigger value="transcription">Transcription</TabsTrigger>
              <TabsTrigger 
                value="generated" 
                disabled={!currentVideo.transcription}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generated Content
              </TabsTrigger>
              <TabsTrigger value="video">Video</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-auto">
              <TabsContent value="video" className="px-6 pb-6 mt-4">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video 
                    src={currentVideo.fileUrl}
                    controls
                    className="w-full h-full"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="transcription" className="px-6 pb-6 mt-4">
                <div className="space-y-4">
                  {!currentVideo.transcription && (
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Transcribe Video</h3>
                      <Button 
                        onClick={handleTranscribe}
                        disabled={isTranscribing}
                      >
                        {isTranscribing ? 'Transcribing...' : 'Start Transcription'}
                      </Button>
                    </div>
                  )}
                  
                  <ScrollArea className="h-[50vh] w-full border rounded-md p-4">
                    <pre className="text-sm whitespace-pre-wrap">
                      {currentVideo.transcription || (isTranscribing ? 'Transcribing video...' : 'Click "Start Transcription" to transcribe this video.')}
                    </pre>
                  </ScrollArea>
                </div>
              </TabsContent>
              
              <TabsContent value="generated" className="px-6 pb-6 mt-4 flex-1 flex flex-col">
                <div className="flex flex-col space-y-4 flex-1">
                  <div className="flex items-center justify-between flex-shrink-0">
                    <h3 className="text-lg font-semibold">Generate Content</h3>
                    <Button 
                      onClick={handleGenerate}
                      disabled={isGenerating || !currentVideo.transcription}
                    >
                      {isGenerating ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                  
                  <ScrollArea className="flex-1">
                    <div className="space-y-6">
                      {generatedContent && (
                        <GenerationResults content={generatedContent} />
                      )}
                      
                      {generatedContent && generatedContent.communityPosts && (
                        <CommunityPosts content={{ communityPosts: generatedContent.communityPosts }} />
                      )}
                      
                      {generatedContent && (
                        <ImageGeneration 
                          content={generatedContent}
                          videoId={currentVideo.id}
                          existingImageUrl={currentVideo.generatedImageUrl}
                          onImageGenerated={handleImageGenerated}
                        />
                      )}
                      
                      {!generatedContent && !isGenerating && (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>Click "Generate" to create titles, descriptions, timestamps, thumbnail text, and community posts based on your video transcription.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}