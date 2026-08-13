import React, { useState } from 'react';
import { Grid3X3, Palette, RotateCw, Copy, Check, Eye, SlidersHorizontal, RefreshCw, ZoomIn } from 'lucide-react';
import { SavedItem } from '../types';

interface MoodboardStudioProps {
  item: SavedItem;
}

const PHOTO_FILTERS = [
  { id: 'normal', name: 'Original', class: '' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', class: 'hue-rotate-15 saturate-150 contrast-125 brightness-110 sepia-15' },
  { id: 'vintage', name: 'Vintage Sepia', class: 'sepia contrast-85 brightness-95' },
  { id: 'noir', name: 'Midnight Noir', class: 'grayscale contrast-150 brightness-75' },
  { id: 'warmth', name: 'Sunset Glow', class: 'sepia-30 saturate-125 contrast-110 warm-glow' },
  { id: 'cold', name: 'Polar Glacier', class: 'hue-rotate-180 saturate-75 brightness-105' },
];

export const MoodboardStudio: React.FC<MoodboardStudioProps> = ({ item }) => {
  const [activeFilter, setActiveFilter] = useState('normal');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);

  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Derive 5 matching palette colors based on item branding / colors
  const baseColor = item.brandColor || '#3b82f6';
  const derivedPalette = [
    baseColor,
    adjustColorHex(baseColor, -30), // Dark shade
    adjustColorHex(baseColor, 40),  // Light tint
    adjustColorHex(baseColor, 80),  // Bright highlight
    '#1e293b'                      // Slate balance
  ];

  function adjustColorHex(hex: string, percent: number): string {
    // Basic hex color adjuster
    try {
      let num = parseInt(hex.replace('#', ''), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        G = ((num >> 8) & 0x00ff) + amt,
        B = (num & 0x0000ff) + amt;
      return (
        '#' +
        (
          0x1000000 +
          (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
          (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
          (B < 255 ? (B < 0 ? 0 : B) : 255)
        )
          .toString(16)
          .slice(1)
      );
    } catch (_) {
      return hex;
    }
  }

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => {
      setCopiedColor(null);
    }, 1500);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setActiveFilter('normal');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setShowGrid(false);
  };

  // Build composite CSS filters
  const currentFilterObj = PHOTO_FILTERS.find((f) => f.id === activeFilter);
  const filterStyles = {
    filter: `
      brightness(${brightness}%) 
      contrast(${contrast}%) 
      saturate(${saturation}%) 
      blur(${blur}px)
    `,
    transform: `
      rotate(${rotation}deg) 
      scaleX(${flipH ? -1 : 1}) 
      scaleY(${flipV ? -1 : 1})
    `,
    transition: 'transform 0.3s ease, filter 0.2s ease',
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-slate-950/80 rounded-xl overflow-hidden border border-white/10 shadow-2xl relative select-none font-sans min-h-[350px]">
      
      {/* LEFT: Image preview stage & filters */}
      <div className="flex-1 flex flex-col bg-black/60 relative p-4 items-center justify-center min-w-0">
        
        {/* Composition guide rules overlay */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden flex items-center justify-center border border-white/5 bg-zinc-900 shadow-inner group/canvas">
          
          {/* Main Image Asset */}
          <img
            src={item.customPreviewUrl || item.previewUrl}
            alt={item.header}
            style={filterStyles}
            className={`w-full h-full object-contain pointer-events-none ${currentFilterObj?.class || ''}`}
            referrerPolicy="no-referrer"
          />

          {/* Rule of Thirds Composition Guideline Grid overlay */}
          {showGrid && (
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none animate-fade-in z-10">
              <div className="border-r border-b border-white/30 border-dashed" />
              <div className="border-r border-b border-white/30 border-dashed" />
              <div className="border-b border-white/30 border-dashed" />
              <div className="border-r border-b border-white/30 border-dashed" />
              <div className="border-r border-b border-white/30 border-dashed" />
              <div className="border-b border-white/30 border-dashed" />
              <div className="border-r border-white/30 border-dashed" />
              <div className="border-r border-white/30 border-dashed" />
              <div className="border-none" />
            </div>
          )}

          {/* Composition Metadata Overlay Box */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-2.5 py-1 text-[8px] font-mono text-zinc-300 opacity-0 group-hover/canvas:opacity-100 transition duration-300 pointer-events-none">
            STAGE: {rotation}° rotation • {flipH ? 'H-flipped' : 'standard'} • {flipV ? 'V-flipped' : 'standard'}
          </div>
        </div>

        {/* Quick presets list carousel */}
        <div className="w-full mt-3.5 space-y-1">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 block mb-1 text-left">Creative Filter Presets</span>
          <div className="flex space-x-1.5 overflow-x-auto pb-1.5 scrollbar-none">
            {PHOTO_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition cursor-pointer border ${
                  activeFilter === filter.id
                    ? 'bg-theme-accent border-theme-accent text-white shadow'
                    : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Tweak parameters, rotation, palette copy */}
      <div className="w-full md:w-[260px] border-t md:border-t-0 md:border-l border-white/10 p-4 sm:p-5 flex flex-col justify-between space-y-4 shrink-0 bg-black/40">
        
        {/* Section: Sliders Adjustments */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-1 border-b border-white/5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-300 flex items-center space-x-1">
              <SlidersHorizontal size={11} className="text-theme-accent" />
              <span>Manual Tuning</span>
            </span>
            <button
              onClick={handleReset}
              className="text-[9px] font-bold text-zinc-500 hover:text-theme-accent transition flex items-center space-x-0.5 cursor-pointer"
            >
              <RefreshCw size={8} />
              <span>Reset</span>
            </button>
          </div>

          {/* Slider parameters list */}
          {[
            { label: 'Brightness', val: brightness, setter: setBrightness, min: 50, max: 150, unit: '%' },
            { label: 'Contrast', val: contrast, setter: setContrast, min: 50, max: 150, unit: '%' },
            { label: 'Saturation', val: saturation, setter: setSaturation, min: 0, max: 200, unit: '%' },
            { label: 'Blur Depth', val: blur, setter: setBlur, min: 0, max: 10, unit: 'px' },
          ].map((slider) => (
            <div key={slider.label} className="space-y-1">
              <div className="flex justify-between text-[9px] font-semibold text-zinc-400">
                <span>{slider.label}</span>
                <span className="font-mono text-zinc-300">{slider.val}{slider.unit}</span>
              </div>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                value={slider.val}
                onChange={(e) => slider.setter(parseInt(e.target.value))}
                className="w-full h-1 bg-white/5 rounded-xl appearance-none cursor-pointer accent-zinc-400"
              />
            </div>
          ))}
        </div>

        {/* Section: Transformations & Helpers */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-300 block text-left">Transform Studio</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleRotate}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 border border-white/5 hover:border-zinc-700 transition flex items-center justify-center space-x-1 cursor-pointer"
            >
              <RotateCw size={10} />
              <span>Rotate 90°</span>
            </button>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition flex items-center justify-center space-x-1 cursor-pointer ${
                showGrid
                  ? 'bg-zinc-800 border-theme-accent text-theme-accent'
                  : 'bg-zinc-900 border-white/5 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <Grid3X3 size={10} />
              <span>Grid Guide</span>
            </button>

            <button
              onClick={() => setFlipH(!flipH)}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition flex items-center justify-center space-x-1 cursor-pointer ${
                flipH
                  ? 'bg-zinc-800 border-theme-accent text-theme-accent'
                  : 'bg-zinc-900 border-white/5 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <span>Flip Horizontal</span>
            </button>

            <button
              onClick={() => setFlipV(!flipV)}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition flex items-center justify-center space-x-1 cursor-pointer ${
                flipV
                  ? 'bg-zinc-800 border-theme-accent text-theme-accent'
                  : 'bg-zinc-900 border-white/5 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <span>Flip Vertical</span>
            </button>
          </div>
        </div>

        {/* Section: Interactive 5-Swatch Palette */}
        <div className="space-y-2 border-t border-white/5 pt-3">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-300 flex items-center space-x-1">
            <Palette size={11} className="text-theme-accent animate-spin-slow" />
            <span>AI Color Extractor</span>
          </span>
          <div className="flex space-x-1.5 justify-between">
            {derivedPalette.map((color, idx) => (
              <button
                key={idx}
                onClick={() => handleCopyColor(color)}
                style={{ backgroundColor: color }}
                className="flex-1 aspect-square rounded-lg border border-white/10 hover:scale-105 active:scale-95 hover:border-white/35 transition cursor-pointer relative group/swatch"
                title={`Copy hex: ${color}`}
              >
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/swatch:opacity-100 flex items-center justify-center rounded-lg transition duration-200">
                  <Copy size={9} className="text-white" />
                </div>
              </button>
            ))}
          </div>
          <div className="h-4 text-center">
            {copiedColor ? (
              <span className="text-[8px] font-bold font-mono text-theme-accent tracking-wider uppercase animate-bounce-short">
                Copied Hex: {copiedColor}!
              </span>
            ) : (
              <span className="text-[8px] font-medium text-zinc-500 tracking-wider uppercase">
                Click color swatch to copy hex
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
