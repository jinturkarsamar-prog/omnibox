import re

with open('src/components/SettingsSection.tsx', 'r') as f:
    text = f.read()

layout_settings_block = """          {/* FEED & LAYOUT PREFERENCES */}
          <div className="border border-theme-border bg-theme-sidebar rounded-xl p-5 space-y-4 shadow-sm">
            <div className="border-b border-theme-border pb-3">
              <h2 className="text-sm font-semibold text-theme-text uppercase tracking-wider flex items-center space-x-2">
                <Layout size={14} className="text-theme-muted" />
                <span>App-Wide Layout Preferences</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-1">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                  Gallery Column Density
                </label>
                <div className="flex bg-black/20 rounded-xl p-0.5 border border-theme-border">
                  {[
                    { id: 'compact', label: 'Compact' },
                    { id: 'standard', label: 'Standard' },
                    { id: 'comfortable', label: 'Spacious' }
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setGallerySize(sz.id as 'compact' | 'standard' | 'comfortable')}
                      className={`flex-1 py-1.5 text-xs rounded-xl font-semibold transition cursor-pointer ${
                        gallerySize === sz.id ? 'bg-theme-card text-theme-text shadow-xs border border-theme-border/50' : 'text-theme-muted hover:text-theme-text'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                  List Row Density
                </label>
                <div className="flex bg-black/20 rounded-xl p-0.5 border border-theme-border">
                  {[
                    { id: 'compact', label: 'Compact' },
                    { id: 'comfortable', label: 'Comfortable' }
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setListDensity(sz.id as 'compact' | 'comfortable')}
                      className={`flex-1 py-1.5 text-xs rounded-xl font-semibold transition cursor-pointer ${
                        listDensity === sz.id ? 'bg-theme-card text-theme-text shadow-xs border border-theme-border/50' : 'text-theme-muted hover:text-theme-text'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                  Feed Content Details
                </label>
                <div className="flex items-center mt-2 cursor-pointer" onClick={() => setShowNotesInFeed(!showNotesInFeed)}>
                  <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${showNotesInFeed ? 'bg-theme-accent' : 'bg-black/30 border border-theme-border'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${showNotesInFeed ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="ml-3 text-xs font-semibold text-theme-text">Show Descriptions</span>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC CUSTOM THEME BUILDER (Span full width) */}"""

text = text.replace("{/* DYNAMIC CUSTOM THEME BUILDER (Span full width) */}", layout_settings_block)

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(text)

