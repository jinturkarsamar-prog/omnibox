/**
 * Extracts an 11-character YouTube video ID from standard watch, short, live, share, or embed URLs.
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp =
    /(?:youtu\.be\/|(?:[a-z0-9-]+\.)?youtube(?:-nocookie)?\.com\/(?:v\/|u\/\w\/|embed\/|shorts\/|live\/|watch\?(?:.*&)?v=))([A-Za-z0-9_-]{11})/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
}
