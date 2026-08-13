import re

with open('src/components/Feed.tsx', 'r') as f:
    text = f.read()

# Update the feed container classes based on layout and size
container_logic = """      className={
        layout === 'list' 
          ? 'space-y-4 max-w-4xl mx-auto' 
          : gallerySize === 'compact'
          ? 'columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-3 space-y-3'
          : gallerySize === 'comfortable'
          ? 'columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6'
          : 'columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4'
      }"""

text = re.sub(r"className=\{\s*layout === 'list' \? 'space-y-4 max-w-4xl mx-auto' : 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4'\s*\}", container_logic, text)

# Add showNotesInFeed logic
text = text.replace("{item.note && (", "{showNotesInFeed && item.note && (")

# Adjust gallery image size based on gallerySize (instead of hardcoded aspect-video max-h-[250px])
image_class_pattern = r"className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 aspect-video max-h-\[250px\]`}"
image_class_logic = """className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                    gallerySize === 'compact' ? 'aspect-square max-h-[150px]' : gallerySize === 'comfortable' ? 'max-h-[400px]' : 'aspect-video max-h-[250px]'
                  }`}"""
text = text.replace(image_class_pattern, image_class_logic)

# Make list layout respect listDensity
list_wrapper_pattern = r"className={`break-inside-avoid group relative flex items-center overflow-hidden rounded-xl border transition-all duration-300 p-3.5 cursor-pointer space-x-4 shadow-\[0_4px_20px_-4px_rgba\(0,0,0,0\.05\)\] hover:shadow-\[0_12px_32px_-8px_rgba\(0,0,0,0\.08\)\] hover:-translate-y-0\.5 w-full \$\{(.*?)\}`}"
list_wrapper_logic = r"className={`break-inside-avoid group relative flex items-center overflow-hidden rounded-xl border transition-all duration-300 ${listDensity === 'compact' ? 'p-2 space-x-3' : 'p-3.5 space-x-4'} cursor-pointer shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 w-full ${\1}`}"
text = re.sub(list_wrapper_pattern, list_wrapper_logic, text)

list_img_pattern = r"className=\"w-24 h-24 rounded-xl object-cover\""
list_img_logic = r"className={`${listDensity === 'compact' ? 'w-16 h-16 rounded-lg' : 'w-24 h-24 rounded-xl'} object-cover`}"
text = text.replace(list_img_pattern, list_img_logic)

list_placeholder_pattern = r"className=\"w-24 h-24 rounded-xl bg-theme-sidebar flex items-center justify-center border border-theme-border/50 shrink-0 relative overflow-hidden\""
list_placeholder_logic = r"className={`${listDensity === 'compact' ? 'w-16 h-16 rounded-lg' : 'w-24 h-24 rounded-xl'} bg-theme-sidebar flex items-center justify-center border border-theme-border/50 shrink-0 relative overflow-hidden`}"
text = text.replace(list_placeholder_pattern, list_placeholder_logic)

# In list layout, hide note if compact
text = text.replace("{showNotesInFeed && item.note && (", "{showNotesInFeed && item.note && listDensity !== 'compact' && (", 1)

with open('src/components/Feed.tsx', 'w') as f:
    f.write(text)

