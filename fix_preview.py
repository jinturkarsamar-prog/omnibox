import re

with open('src/components/SettingsSection.tsx', 'r') as f:
    content = f.read()

preview_code = """
              </div>

              {/* Live Preview Window */}
              <div className="pt-4 pb-2">
                <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-3">Live Card Preview</label>
                <div className="w-full flex justify-center items-center p-6 rounded-xl border border-theme-border/50" style={{ backgroundColor: customBgApp }}>
                  <div 
                    className="w-full max-w-[280px] rounded-xl overflow-hidden shadow-sm transition-all duration-300"
                    style={{ 
                      backgroundColor: customBgCard, 
                      borderColor: customBorderColor,
                      borderWidth: 1,
                      borderStyle: 'solid'
                    }}
                  >
                    <div className="aspect-video relative bg-black/10 flex items-center justify-center overflow-hidden">
                      <Sparkles size={24} style={{ color: customAccentColor, opacity: 0.5 }} />
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider" style={{ backgroundColor: customAccentColor, color: '#fff' }}>
                        Platform
                      </div>
                    </div>
                    <div className="p-3.5 space-y-2">
                      <h3 className="text-sm font-semibold leading-tight line-clamp-2" style={{ color: customTextPrimary, fontFamily: customFontDisplay }}>
                        A beautiful mock title for your saved media
                      </h3>
                      <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: customTextMuted, fontFamily: customFontSans }}>
                        This is a simulated description text showing exactly how your typography, colors, and background contrast will look.
                      </p>
                      
                      <div className="flex items-center justify-between pt-2 mt-2" style={{ borderTop: `1px solid ${customBorderColor}` }}>
                        <div className="flex items-center space-x-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ backgroundColor: `${customAccentColor}22`, color: customAccentColor }}>#design</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ backgroundColor: `${customAccentColor}22`, color: customAccentColor }}>#inspo</span>
                        </div>
                        <button type="button" className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity" style={{ backgroundColor: `${customAccentColor}15`, color: customAccentColor }}>
                          <LayoutGrid size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
"""

content = content.replace('              </div>\n              \n              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">', preview_code.strip('\n'))

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(content)

