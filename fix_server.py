import re

with open('server.ts', 'r') as f:
    content = f.read()

# 1. Remove Unsplash placeholders in heuristicScrape
content = re.sub(r"let previewUrl = 'https://images.unsplash.com[^']*'; // elegant neutral default gradient", "let previewUrl = '';", content)
content = re.sub(r"previewUrl = 'https://images.unsplash.com[^']*'; // custom premium social mockup", "previewUrl = '';", content)
content = re.sub(r"previewUrl = 'https://images.unsplash.com[^']*';", "previewUrl = '';", content)

# 2. Fix Pinterest oEmbed fallback
content = re.sub(r"const previewUrl = oembedJson.thumbnail_url \|\| 'https://images.unsplash.com[^']*';", "const previewUrl = oembedJson.thumbnail_url || '';", content)
content = re.sub(r"previewUrl = previewUrl \|\| 'https://images.unsplash.com[^']*';", "previewUrl = previewUrl || '';", content)

# 3. Update Gemini schema
content = re.sub(r"'High-res image URL \(og:image, thumbnail, or polished Unsplash placeholder\.\)'", "'High-res image URL (og:image, thumbnail). Return empty string if not found.'", content)

# 4. Make sure YouTube thumbnails are robustly assigned and we don't fall back to empty if we have youtube ID
# Wait, for YouTube, Gemini schema will return empty string. fallback.previewUrl will be hqdefault.jpg
# So finalPreviewUrl = parsed.previewUrl || fallback.previewUrl will pick hqdefault.jpg! This is PERFECT.

with open('server.ts', 'w') as f:
    f.write(content)

