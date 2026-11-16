const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Extracts the 11-char video id from a youtube.com / youtu.be URL (or a bare id). */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (ID_RE.test(value)) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\.|^m\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      id = url.searchParams.get('v');
      if (!id) {
        const m = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
        id = m ? m[1] : null;
      }
    }
    return id && ID_RE.test(id) ? id : null;
  } catch {
    return null;
  }
}

export const youtubeEmbedUrl = (id: string, autoplay = false) =>
  `https://www.youtube-nocookie.com/embed/${id}?rel=0${autoplay ? '&autoplay=1' : ''}`;

export const youtubeThumbnailUrl = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
