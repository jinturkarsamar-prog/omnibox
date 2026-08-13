import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # We want to replace the `) : (` which is followed by `<div className="relative w-full h-full group">`
    # and ends with `</div>` before the next JSX block.
    # Actually, it's easier to find: `) : (\n            <div className="relative w-full h-full group">\n              <img\n                src={activeItem.customPreviewUrl || activeItem.previewUrl}`
    
    pattern = r"\) : \(\s*<div className=\"relative w-full h-full group\">\s*<img\s*src=\{activeItem\.customPreviewUrl \|\| activeItem\.previewUrl\}\s*alt=\{activeItem\.header\}\s*className=\"[^\"]*\"\s*onClick=\{[^\}]+\}\s*referrerPolicy=\"no-referrer\"\s*/>\s*</div>\s*\)"
    
    replacement = """) : (activeItem.customPreviewUrl || activeItem.previewUrl) ? (
            <div className="relative w-full h-full group">
              <img
                src={activeItem.customPreviewUrl || activeItem.previewUrl}
                alt={activeItem.header}
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => setShowZoomModal(true)}
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center" style={{ backgroundColor: activeItem.brandColor ? `${activeItem.brandColor}22` : 'rgba(0,0,0,0.05)' }}>
               <div className="text-theme-text font-semibold text-lg opacity-80">{activeItem.platform || 'Link'}</div>
               <div className="text-theme-muted text-sm mt-2">No preview available</div>
            </div>
          )"""
    
    new_content = re.sub(pattern, replacement, content)

    # Now for `rec.customPreviewUrl || rec.previewUrl`
    rec_pattern = r"<img\s*src=\{rec\.customPreviewUrl \|\| rec\.previewUrl\}\s*alt=\{rec\.header\}\s*className=\"[^\"]*\"\s*referrerPolicy=\"no-referrer\"\s*/>"
    rec_replacement = """
                      { (rec.customPreviewUrl || rec.previewUrl) ? (
                        <img
                          src={rec.customPreviewUrl || rec.previewUrl}
                          alt={rec.header}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-2" style={{ backgroundColor: rec.brandColor ? `${rec.brandColor}22` : 'rgba(0,0,0,0.05)' }}>
                           <span className="text-[10px] text-theme-text opacity-70">{rec.platform}</span>
                        </div>
                      )}
    """
    new_content = re.sub(rec_pattern, rec_replacement, new_content)

    with open(filepath, 'w') as f:
        f.write(new_content)

fix_file('src/components/InspectorPanel.tsx')
fix_file('src/components/DetailSheet.tsx')

