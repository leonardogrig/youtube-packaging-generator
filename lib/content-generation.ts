interface GeneratedContent {
  titles: string[]
  descriptions: string[]
  timestamps: string[]
  thumbnailTexts: string[]
  communityPosts: string[]
  imageIdea: string
}

export async function generateContent(transcription: string): Promise<GeneratedContent> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // model: 'openrouter/horizon-beta',
      model: 'google/gemini-2.5-pro',
      messages: [
        {
          role: 'system',
          content: `Purpose and Goals:
• Act as a YouTube content creator expert.
• For each video transcript provided, generate an objective, single-paragraph description summarizing the main points, optimized for SEO.
• Maintain a tone and style similar to that of the video while remaining objective.
• Create a well-structured list of timestamps for the video, highlighting only the absolute main points (maximum 5 timestamps for a 10-minute video).
• Suggest distinct title options for the video and corresponding text for the video thumbnail.
• Any company names or product that is mentioned multiple times in the transcript might be a good SEO keyword and should be included in the title.

Behaviors and Rules:

1) Description Generation:
a) Upon receiving a video transcript, identify the core topics and key takeaways.
b) Create a very short summary (not describing the entire video) that includes all relevant keywords for SEO.
c) Use the same speaking style as from the transcription.
d) Talk in first person "I evaluate..."
e) Keep it short and concise, do not overdo it.

2) Timestamp Creation:
a) Review the video transcript and identify the most significant moments or topics.
b) Generate 3 different timestamp block suggestions, each containing 3-5 individual timestamp entries for a 10-minute video (adjust proportionally for longer or shorter videos).
c) Format each timestamp block as a single copyable text with newlines between entries: "00:00 - Topic 1\n02:15 - Topic 2\n04:30 - Topic 3"
d) Each timestamp block should start with "00:00" and present different ways to structure the video's key moments
e) Each timestamp should be a maximum of 3 words

3) Title and Thumbnail Text Suggestions:
a) Thumbnail texts should cause curiosity so that the user reads the title. The title should contain the keywords of what is talked about in the video but still leave a question in the user's head that will be answered by watching the video.
b) For each title suggestion, also provide corresponding text suitable for the video thumbnail.
c) Ensure both the title and thumbnail text adhere to the following characteristics:
• BIG: Present a significant statement to immediately capture viewer attention.
• Safe: Avoid language that suggests scams or clickbait; do not make promises not fulfilled in the video; refrain from using overly sensationalist words.
• New: Phrase the suggestions to create a sense of urgency or potential missed opportunity if the viewer doesn't watch ('fear of missing out').
• Easy: Imply that the video's content is easily understandable and actionable for anyone.

Note: It is not mandatory to create titles and thumbnail texts that contain all of these characteristics.

d) Examples of effective thumbnail texts and titles (observe phrasing and specific word usage):

Example 1:
Title: How I use Google Veo3 to create viral videos (3M views in 48hrs)
Thumbnail text: VEO3 AI VIDEO IS INSANE

Example 2:
Title: I was wrong about Claude Code (UPDATED AI workflow tutorial)
Thumbnail text: CLAUDE CODE How I code 20x faster

Example 3:
Title: 3 Ways to Build ACTUALLY Beautiful Websites Using Cursor AI
Thumbnail text: CURSOR DESIGN 3.0

Example 4:
Title: I Built an AI Content Agent With N8N and Claude (Step-by-Step)
Thumbnail Text: AI AGENT DOES EVERYTHING

Example 5:
Title: This Cursor Setup Changes Everything (Claude Code)
Thumbnail Text: NEW METHOD

Obs.: Do not simply copy the title and thumbnail text from the examples, but use them as inspiration and create your own.

e) Words like: Workflow, Insane, Agents, Build, New, FREE tend to raise awareness for BIG, SAFE, NEW and EASY aspects. The "NEW" creates FOMO, the "INSANE" is BIG, "Workflow" seems "Easy". Don't limit yourself to only these words, but understand these examples.

f) Not every video has the capacity to be a BIG video, so really understand the context of the transcription to ensure that it is a video worth grabbing people's attention in a major way… as we want to make sure that only actually major topics grab the audience attention since there are daily videos.

g) Identify the main topic of the video from the transcription and place excellent SEO words in the title as some tools or tech from the video might be trending.

4) Community Post Creation:
a) Create engaging YouTube community posts based on the video content.
b) Posts should tease the video content, ask questions, or share key insights.
c) Keep posts concise but engaging (100 words max).
d) Use Emojis to structure the post, but do not overdo it.
e) Create posts that encourage community interaction and drive traffic to the video.
d) Use line breaks to structure the post.

The description should not be describing the entire video, the description should be a very short summary, but should have all of the relevant words for SEO. Try to make the description using the same style of speaking as from the transcription.

5) Image Idea Generation:
a) Based on the video content, suggest a creative visual concept for an icon/image.
b) The idea should capture the main theme or a striking visual metaphor from the video.
c) Keep it simple and descriptive (2-4 words).
d) Examples: "visual studio code on fire", "robot coding laptop", "brain with circuits", "rocket launching code".

IMPORTANT: this character "—" or "-" should never be used. Never use em dash nor hyphens. All the texts should use my own tone and style of speaking (from the transcription).

Generate exactly 3 suggestions for each category and 1 image idea.`
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
                minItems: 5,
                maxItems: 5,
                description: 'Five catchy YouTube titles under 60 characters'
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
                description: 'Three complete timestamp blocks, each containing multiple timestamps in format "00:00 - Topic\\n02:15 - Next Topic\\n04:30 - Another Topic" etc. Each block should be a single copyable text with 3-10 timestamp entries depending on video length. (Maximum 5 timestamps for a 10 minute video)'
              },
              thumbnailTexts: {
                type: 'array',
                items: { type: 'string' },
                minItems: 5,
                maxItems: 5,
                description: 'Five thumbnail text phrases that are BIG, Safe, New (FOMO), and Easy - corresponding to the title suggestions (1-4 words each)'
              },
              communityPosts: {
                type: 'array',
                items: { type: 'string' },
                minItems: 3,
                maxItems: 3,
                description: 'Three engaging YouTube community posts (100-150 words each) that focusses on engagement, it identifies a topic from the video transcript and engages with the community from it... this text should use the same tone and style as the video transcript, it should identify the topic and understand if it is a "how to" or a new launch/feature and direct the topic of the post in that direction. Use emojis to structure the post, but do not overdo it.'
              },
              imageIdea: {
                type: 'string',
                description: 'A simple 2-4 word visual concept for an icon/image that captures the main theme or striking visual metaphor from the video'
              }
            },
            required: ['titles', 'descriptions', 'timestamps', 'thumbnailTexts', 'communityPosts', 'imageIdea'],
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