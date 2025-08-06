import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../generated/prisma'
import OpenAI from 'openai'

const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { idea, videoId } = await request.json()

    if (!idea || !videoId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Idea and videoId are required' 
      }, { status: 400 })
    }

    const prompt = `generate a ${idea} icon with this json style 
{
"icon_style": {
"perspective": "isometric",
"geometry": {
"proportions": "1:1 ratio canvas, with objects fitting comfortably within margins",
"element_arrangement": "central dominant object, with supporting elements symmetrically or diagonally placed"
},
"composition": {
"element_count": "2–4 main objects",
"spatial_depth": "layered to create sense of dimension and slight elevation",
"scale_consistency": "uniform object scale across icon set",
"scene_density": "minimal to moderate, maintaining clarity and visual focus"
},
"lighting": {
"type": "soft ambient light",
"light_source": "subtle top-right or front-top direction",
"shadow": "gentle drop shadows below and behind objects",
"highlighting": "mild edge illumination to define forms"
},
"textures": {
"material_finish": "semi-matte to satin surfaces",
"surface_treatment": "smooth with light tactile variation (e.g., wood grain, soft textures)",
"texture_realism": "stylized naturalism without hyper-realistic noise"
},
"render_quality": {
"resolution": "high-resolution octane 3D rendering",
"edge_definition": "crisp, no outlines; separation achieved via lighting and depth",
"visual_clarity": "clean, readable shapes with minimal clutter"
},
"color_palette": {
"tone": "naturalistic with slight saturation boost",
"range": "harmonious muted tones with gentle contrast",
"usage": "distinct colors per object to improve identification and readability"
},
"background": {
"color": "#FFFFFF",
"style": "pure white, flat",
"texture": "none"
},
"stylistic_tone": "premium, friendly, clean with lifestyle or service-oriented appeal",
"icon_behavior": {
"branding_alignment": "neutral enough for broad applications",
"scalability": "legible at small and medium sizes",
"interchangeability": "part of a cohesive icon system with interchangeable subject matter"
}
}
}`

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    })

    if (!response.data || response.data.length === 0) {
      throw new Error('No image data returned from OpenAI')
    }

    const imageUrl = response.data[0].url

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI')
    }

    // Save image URL to database
    await prisma.video.update({
      where: { id: videoId },
      data: { 
        generatedImageUrl: imageUrl
      }
    })

    return NextResponse.json({ 
      success: true, 
      imageUrl 
    })

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to generate image' 
    }, { status: 500 })
  }
}