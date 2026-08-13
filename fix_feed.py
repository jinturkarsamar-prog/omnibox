import re

with open('src/components/Feed.tsx', 'r') as f:
    content = f.read()

# Replace the final img block with a conditional block
replacement = """
                  item.previewUrl ? (
                  // STANDARD WEB COVER/THUMBNAIL
                  <img
                    src={item.previewUrl}
                    alt={item.header}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col justify-center items-center p-6 text-center"
                      style={{ backgroundColor: item.brandColor ? `${item.brandColor}22` : 'rgba(0,0,0,0.05)' }}
                    >
                      <div className="text-theme-text font-semibold text-sm opacity-80">{item.platform || 'Link'}</div>
                      <div className="text-theme-muted text-xs mt-1">No preview available</div>
                    </div>
                  )
"""

content = re.sub(r"// STANDARD WEB COVER/THUMBNAIL\s*<img\s*src=\{item\.previewUrl\}\s*alt=\{item\.header\}\s*className=\"[^\"]*\"\s*referrerPolicy=\"no-referrer\"\s*/>", replacement.strip(), content)

with open('src/components/Feed.tsx', 'w') as f:
    f.write(content)
