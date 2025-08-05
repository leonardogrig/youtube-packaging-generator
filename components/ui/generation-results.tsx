"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react"

interface GenerationResultsProps {
  content: {
    titles: string[]
    descriptions: string[]
    timestamps: string[]
    thumbnailTexts: string[]
    communityPosts?: string[]
  }
}

export function GenerationResults({ content }: GenerationResultsProps) {
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

  const DescriptionCard = ({ description, index, onCopy, isCopied }: {
    description: string
    index: number
    onCopy: (text: string, id: string) => void
    isCopied: boolean
  }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const isLong = description.length > 150

    return (
      <div className="p-3 bg-muted rounded-lg">
        <div className="flex items-start justify-between mb-2">
          <span className="text-sm font-medium">Option {index + 1}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopy(description, `description-${index}`)}
            className="ml-2"
          >
            {isCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className={`text-xs text-muted-foreground ${!isExpanded && isLong ? 'line-clamp-3' : ''}`}>
          {description}
        </p>
        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-primary hover:text-primary/80 mt-2 flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                See less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                See more
              </>
            )}
          </button>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {description.length} characters
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Titles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Suggested Titles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.titles.map((title, index) => (
            <div key={index} className="p-3 bg-muted rounded-lg">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium flex-1">{title}</p>
                <CopyButton text={title} id={`title-${index}`} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {title.length} characters
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Suggested Descriptions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.descriptions.map((description, index) => (
            <DescriptionCard
              key={index}
              description={description}
              index={index}
              onCopy={(text: string, id: string) => copyToClipboard(text, id)}
              isCopied={copiedItems.has(`description-${index}`)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Key Timestamps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.timestamps.map((timestamp, index) => (
            <div key={index} className="p-3 bg-muted rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <pre className="text-sm font-mono whitespace-pre-wrap">{timestamp}</pre>
                </div>
                <CopyButton text={timestamp} id={`timestamp-${index}`} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Thumbnail Texts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Thumbnail Text Ideas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.thumbnailTexts.map((text, index) => (
            <div key={index} className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-primary">{text}</p>
                <CopyButton text={text} id={`thumbnail-${index}`} />
              </div>
              <p className="text-xs text-muted-foreground">
                Perfect for bold thumbnail text
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}