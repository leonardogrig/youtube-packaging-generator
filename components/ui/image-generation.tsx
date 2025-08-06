"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Input } from "./input"
import { Wand2 } from "lucide-react"

interface ImageGenerationProps {
  content: {
    imageIdea?: string
  }
  videoId: string
  existingImageUrl?: string | null
  onImageGenerated: (imageUrl: string) => void
}

export function ImageGeneration({ content, videoId, existingImageUrl, onImageGenerated }: ImageGenerationProps) {
  const [idea, setIdea] = useState(content.imageIdea || "")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateImage = async () => {
    if (!idea.trim()) {
      alert('Please enter an image idea')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea: idea.trim(),
          videoId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onImageGenerated(data.imageUrl)
      } else {
        alert('Failed to generate image')
      }
    } catch (error) {
      console.error('Image generation error:', error)
      alert('Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Image Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {existingImageUrl && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Generated Image:</h4>
            <img 
              src={existingImageUrl} 
              alt="Generated content image" 
              className="w-full max-w-md rounded-lg border"
            />
          </div>
        )}
        
        <div className="space-y-3">
          <div>
            <label htmlFor="image-idea" className="text-sm font-medium mb-2 block">
              Image Idea
            </label>
            <Input
              id="image-idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. visual studio code on fire"
              className="w-full"
            />
          </div>
          
          <Button 
            onClick={handleGenerateImage}
            disabled={isGenerating || !idea.trim()}
            className="w-full"
          >
            {isGenerating ? 'Generating Image...' : 'Generate Image'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}