interface GeneratedContent {
  titles: string[]
  descriptions: string[]
  timestamps: string[]
  thumbnailTexts: string[]
  communityPosts: string[]
}

export async function generateContent(transcription: string): Promise<GeneratedContent> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/horizon-beta',
      messages: [
        {
          role: 'system',
          content: `Purpose and Goals:
• Act as a YouTube content creator expert.
• For each video transcript provided, generate an objective, single-paragraph description summarizing the main points, optimized for SEO.
• Maintain a tone and style similar to that of the video while remaining objective.
• Create a well-structured list of timestamps for the video, highlighting only the absolute main points (maximum 5 timestamps for a 10-minute video).
• Suggest distinct title options for the video and corresponding text for the video thumbnail.

Behaviors and Rules:

1) Description Generation:
a) Upon receiving a video transcript, identify the core topics and key takeaways.
b) Condense this information into a single paragraph that objectively summarizes the video's content.
c) Mimic the user's speaking style and tone from the transcript, but ensure the description remains objective and factual.
d) Talk in first person "I evaluate..."

2) Timestamp Creation:
a) Review the video transcript and identify the most significant moments or topics.
b) Generate 3 different timestamp block suggestions, each containing 3-5 individual timestamp entries for a 10-minute video (adjust proportionally for longer or shorter videos).
c) Format each timestamp block as a single copyable text with newlines between entries: "00:00 - Topic 1\n02:15 - Topic 2\n04:30 - Topic 3"
d) Each timestamp block should start with "00:00" and present different ways to structure the video's key moments

3) Title and Thumbnail Text Suggestions:
a) Develop separate title suggestions for the video.
b) For each title suggestion, also provide corresponding text suitable for the video thumbnail.
c) Ensure both the title and thumbnail text adhere to the following characteristics:
• BIG: Present a significant statement to immediately capture viewer attention.
• Safe: Avoid language that suggests scams or clickbait; do not make promises not fulfilled in the video; refrain from using overly sensationalist words.
• New: Phrase the suggestions to create a sense of urgency or potential missed opportunity if the viewer doesn't watch ('fear of missing out').
• Easy: Imply that the video's content is easily understandable and actionable for anyone.

e) Identify the main topic of the video from the transcription and place excellent SEO words in the title as some tools or tech from the video might be trending.

4) Community Post Creation:
a) Create engaging YouTube community posts based on the video content.
b) Posts should tease the video content, ask questions, or share key insights.
c) Keep posts concise but engaging (100-200 words max).
d) Include relevant emojis and call-to-action elements.
e) Create posts that encourage community interaction and drive traffic to the video.

Generate exactly 3 suggestions for each category.`
        },
        {
          role: 'user',
          content: `Please analyze this video transcription and generate YouTube content suggestions:\n\n${transcription}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'youtube_content',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              titles: {
                type: 'array',
                items: { type: 'string' },
                minItems: 3,
                maxItems: 3,
                description: 'Three catchy YouTube titles under 60 characters'
              },
              descriptions: {
                type: 'array',
                items: { type: 'string' },
                minItems: 3,
                maxItems: 3,
                description: 'Three single-paragraph descriptions in first person, mimicking the speaking style from transcript, 200-300 words each, starting with "I evaluate..." or similar'
              },
              timestamps: {
                type: 'array',
                items: { type: 'string' },
                minItems: 3,
                maxItems: 3,
                description: 'Three complete timestamp blocks, each containing multiple timestamps in format "00:00 - Topic\\n02:15 - Next Topic\\n04:30 - Another Topic" etc. Each block should be a single copyable text with 3-5 timestamp entries depending on video length'
              },
              thumbnailTexts: {
                type: 'array',
                items: { type: 'string' },
                minItems: 3,
                maxItems: 3,
                description: 'Three thumbnail text phrases that are BIG, Safe, New (FOMO), and Easy - corresponding to the title suggestions (1-3 words each)'
              },
              communityPosts: {
                type: 'array',
                items: { type: 'string' },
                minItems: 3,
                maxItems: 3,
                description: 'Three engaging YouTube community posts (100-200 words each) that tease video content, ask questions, or share insights with emojis and call-to-action'
              }
            },
            required: ['titles', 'descriptions', 'timestamps', 'thumbnailTexts', 'communityPosts'],
            additionalProperties: false
          }
        }
      }
    })
  })

  if (!response.ok) {
    throw new Error('Failed to generate content')
  }

  const data = await response.json()
  const content = JSON.parse(data.choices[0].message.content)
  
  return content
}