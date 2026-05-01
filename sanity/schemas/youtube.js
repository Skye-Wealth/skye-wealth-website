export default {
  type: 'object',
  name: 'youtube',
  title: 'YouTube Video',
  fields: [
    {
      name: 'videoId',
      title: 'YouTube video ID',
      type: 'string',
      description: 'e.g. QwwdarAeYm8 (the bit after /watch?v= or /embed/)',
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
  ],
  preview: {
    select: { videoId: 'videoId', caption: 'caption' },
    prepare: ({ videoId, caption }) => ({
      title: caption || 'YouTube video',
      subtitle: videoId || '(missing video ID)',
    }),
  },
}
