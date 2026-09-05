

// src/utils.js
export function getYouTubeId(url) {
  if (!url) return null;

  // Common YouTube URL patterns
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  // Try matching each pattern
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // If no match found, return null
  return null;
}

// Converts a normal Google Drive share link into an embeddable preview link.
// Accepts formats like:
//   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
//   https://drive.google.com/open?id=FILE_ID
// Returns null if the URL isn't a recognizable Drive link (caller should
// fall back to a plain download link in that case).
export function getDriveEmbedUrl(url) {
  if (!url) return null;

  const fileIdMatch =
    url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (!fileIdMatch) return null;

  return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
}
 
