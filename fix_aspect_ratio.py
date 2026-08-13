import re

with open('src/components/Feed.tsx', 'r') as f:
    content = f.read()

helper_functions = """
const getGalleryThumbnailClass = (item: SavedItem) => {
  const p = (item.platform || '').toLowerCase();
  const f = (item.format || '').toLowerCase();
  const u = (item.url || '').toLowerCase();

  let aspectRatio = 'aspect-video';

  if (p === 'instagram') {
    if (f === 'video' || f === 'reel' || f === 'story') aspectRatio = 'aspect-[9/16]';
    else aspectRatio = 'aspect-square';
  } else if (p === 'youtube') {
    if (u.includes('/shorts/')) aspectRatio = 'aspect-[9/16]';
    else aspectRatio = 'aspect-video';
  } else if (p === 'tiktok') {
    aspectRatio = 'aspect-[9/16]';
  } else if (p === 'pinterest') {
    aspectRatio = 'aspect-[2/3]';
  } else if (p === 'threads' || p === 'twitter' || p === 'x') {
    aspectRatio = 'aspect-square';
  } else if (f === 'profile' || f === 'song' || f === 'playlist') {
    aspectRatio = 'aspect-square';
  } else if (f === 'image') {
    aspectRatio = 'aspect-[4/5]';
  }

  return `relative ${aspectRatio} w-full overflow-hidden bg-theme-card/40 flex-shrink-0`;
};

const getListThumbnailClass = (item: SavedItem) => {
  const p = (item.platform || '').toLowerCase();
  const f = (item.format || '').toLowerCase();
  const u = (item.url || '').toLowerCase();

  let aspectRatio = 'aspect-video';

  if (p === 'instagram') {
    if (f === 'video' || f === 'reel' || f === 'story') aspectRatio = 'aspect-[9/16]';
    else aspectRatio = 'aspect-square';
  } else if (p === 'youtube') {
    if (u.includes('/shorts/')) aspectRatio = 'aspect-[9/16]';
    else aspectRatio = 'aspect-video';
  } else if (p === 'tiktok') {
    aspectRatio = 'aspect-[9/16]';
  } else if (p === 'pinterest') {
    aspectRatio = 'aspect-[2/3]';
  } else if (p === 'threads' || p === 'twitter' || p === 'x') {
    aspectRatio = 'aspect-square';
  } else if (f === 'profile' || f === 'song' || f === 'playlist' || f === 'image') {
    aspectRatio = 'aspect-square';
  }

  return `relative h-16 ${aspectRatio} rounded-xl overflow-hidden bg-theme-card/30 flex-shrink-0`;
};
"""

content = content.replace(
    'export const Feed: React.FC<FeedProps> = ({',
    helper_functions + '\nexport const Feed: React.FC<FeedProps> = ({'
)

# Gallery Thumbnail
content = content.replace(
    '<div className="relative aspect-video w-full overflow-hidden bg-theme-card/40 flex-shrink-0">',
    '<div className={getGalleryThumbnailClass(item)}>'
)

# List Thumbnail
content = content.replace(
    '<div className="relative w-24 h-16 rounded-xl overflow-hidden bg-theme-card/30 flex-shrink-0">',
    '<div className={getListThumbnailClass(item)}>'
)

with open('src/components/Feed.tsx', 'w') as f:
    f.write(content)
