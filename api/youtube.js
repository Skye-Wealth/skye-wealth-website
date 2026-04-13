export default async function handler(req, res) {
  const KEY     = process.env.YOUTUBE_API_KEY;
  const CHANNEL = process.env.YOUTUBE_CHANNEL_ID;

  if (!KEY || !CHANNEL) {
    return res.status(503).json({ error: 'YouTube API not configured', videos: [], playlists: [] });
  }

  // 30 min edge cache, 1 hr stale-while-revalidate
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  const { type = 'videos', playlistId, maxResults = '12' } = req.query;

  try {
    /* ── Playlists ──────────────────────────────────────────────────────── */
    if (type === 'playlists') {
      const r = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${CHANNEL}&maxResults=20&key=${KEY}`
      );
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return res.json({
        playlists: (d.items || []).map(p => ({ id: p.id, title: p.snippet.title })),
      });
    }

    /* ── Videos (from uploads playlist or a specific playlist) ──────────── */
    let pid = playlistId;
    if (!pid) {
      // Resolve channel uploads playlist ID
      const ch = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL}&key=${KEY}`
      );
      const chd = await ch.json();
      if (chd.error) throw new Error(chd.error.message);
      pid = chd.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!pid) throw new Error('Could not resolve uploads playlist');
    }

    const r = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${pid}&maxResults=${maxResults}&key=${KEY}`
    );
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);

    const videos = (d.items || [])
      .map(item => {
        const sn = item.snippet;
        const videoId = sn.resourceId?.videoId;
        return {
          id:          videoId,
          title:       sn.title,
          description: (sn.description || '').split('\n')[0].slice(0, 120),
          thumbnail:
            sn.thumbnails?.maxres?.url ||
            sn.thumbnails?.high?.url   ||
            sn.thumbnails?.medium?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          publishedAt: sn.publishedAt,
        };
      })
      .filter(v => v.id && v.title !== 'Deleted video' && v.title !== 'Private video');

    return res.json({ videos });

  } catch (err) {
    console.error('[api/youtube]', err.message);
    return res.status(500).json({ error: err.message, videos: [] });
  }
}
