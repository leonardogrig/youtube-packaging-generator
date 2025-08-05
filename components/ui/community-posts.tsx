"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Copy, Check } from "lucide-react"

interface CommunityPostsProps {
  content: {
    communityPosts: string[]
  }
}

export function CommunityPosts({ content }: CommunityPostsProps) {
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItems(prev => new Set(prev).add(id))
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copyToClipboard(text, id)}
      className="ml-2"
    >
      {copiedItems.has(id) ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">📢</span>
            Community Post Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.communityPosts.map((post, index) => (
            <div key={index} className="p-4 bg-muted rounded-lg border-l-4 border-primary">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-primary">Post {index + 1}</span>
                <CopyButton text={post} id={`community-post-${index}`} />
              </div>
              <div className="text-sm whitespace-pre-wrap text-foreground">
                {post}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {post.length} characters
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}