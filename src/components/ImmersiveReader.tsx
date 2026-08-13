import React, { useState, useRef, useEffect } from 'react';
import { Type, Compass, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { SavedItem } from '../types';

interface ImmersiveReaderProps {
  item: SavedItem;
}

const READER_THEMES = [
  { id: 'paper', name: 'Classic Paper', bg: 'bg-[#f5f1e9]', text: 'text-zinc-800', border: 'border-[#dfdad0]' },
  { id: 'light', name: 'Clean Light', bg: 'bg-white', text: 'text-zinc-900', border: 'border-zinc-200' },
  { id: 'charcoal', name: 'Midnight Charcoal', bg: 'bg-[#121212]', text: 'text-zinc-200', border: 'border-zinc-800' },
  { id: 'cyber', name: 'Cyber Slate', bg: 'bg-slate-900', text: 'text-slate-100', border: 'border-slate-800' },
];

export const ImmersiveReader: React.FC<ImmersiveReaderProps> = ({ item }) => {
  const [theme, setTheme] = useState('paper');
  const [fontSize, setFontSize] = useState(14); // in px
  const [isSerif, setIsSerif] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Monitor scrolling to calculate progress percentage
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const totalHeight = scrollHeight - clientHeight;
    const pct = totalHeight > 0 ? (scrollTop / totalHeight) * 100 : 0;
    setScrollProgress(pct);
  };

  const increaseFont = () => {
    setFontSize((prev) => Math.min(24, prev + 1));
  };

  const decreaseFont = () => {
    setFontSize((prev) => Math.max(11, prev - 1));
  };

  // Derive simple statistics
  const wordCount = (item.note || '').split(/\s+/).filter(Boolean).length || 20;
  const minutesToRead = Math.max(1, Math.ceil(wordCount / 180)); // average 180 wpm

  // Extract simulated headers from the text to form a table of contents
  const lines = (item.note || '').split('\n').filter((l) => l.trim().length > 0);
  const headings = lines
    .filter((l) => l.startsWith('#') || l.length < 50)
    .slice(0, 5)
    .map((h, i) => ({
      id: `section-${i}`,
      title: h.replace(/^#+\s*/, '').trim(),
      textSnippet: h,
    }));

  const activeThemeObj = READER_THEMES.find((t) => t.id === theme) || READER_THEMES[0];

  return (
    <div className={`w-full h-full flex flex-col rounded-xl overflow-hidden border border-white/10 shadow-2xl relative select-text font-sans ${activeThemeObj.bg} ${activeThemeObj.text}`}>
      
      {/* Top Header Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-black/40 border-b border-white/5 px-4 py-3 text-xs shrink-0 z-10 gap-2 select-none">
        
        {/* Left indicators */}
        <div className="flex items-center space-x-3 text-zinc-300">
          <BookOpen size={13} className="text-theme-accent" />
          <span className="font-bold uppercase tracking-wider text-[9px]">Distraction-Free Reader</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400">
            {wordCount} words
          </span>
          <span className="text-[9px] text-theme-accent font-semibold flex items-center space-x-0.5">
            <Clock size={10} />
            <span>{minutesToRead} min read</span>
          </span>
        </div>

        {/* Right configuration switches */}
        <div className="flex items-center space-x-2.5">
          
          {/* Typography font swap toggler */}
          <div className="flex bg-zinc-900/60 border border-white/10 rounded-lg p-0.5 shadow-inner">
            <button
              onClick={() => setIsSerif(false)}
              className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition ${
                !isSerif ? 'bg-theme-accent text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sans
            </button>
            <button
              onClick={() => setIsSerif(true)}
              className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition ${
                isSerif ? 'bg-theme-accent text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Serif
            </button>
          </div>

          {/* Text size scale buttons */}
          <div className="flex bg-zinc-900/60 border border-white/10 rounded-lg p-0.5 items-center">
            <button
              onClick={decreaseFont}
              className="px-2 py-0.5 text-[10px] text-zinc-400 hover:text-white font-bold transition rounded-md"
              title="Decrease Font Size"
            >
              A-
            </button>
            <span className="text-[9px] font-mono px-1 border-x border-white/5 text-zinc-300">{fontSize}px</span>
            <button
              onClick={increaseFont}
              className="px-2 py-0.5 text-[10px] text-zinc-400 hover:text-white font-bold transition rounded-md"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          {/* Theme circles selector */}
          <div className="flex space-x-1.5 pl-1.5 border-l border-white/10">
            {[
              { id: 'paper', color: 'bg-[#f5f1e9]' },
              { id: 'light', color: 'bg-white border-white/10' },
              { id: 'charcoal', color: 'bg-[#121212]' },
              { id: 'cyber', color: 'bg-slate-900' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`w-3.5 h-3.5 rounded-full border cursor-pointer hover:scale-105 active:scale-95 transition ${t.color} ${
                  theme === t.id ? 'ring-1 ring-theme-accent border-theme-accent scale-105' : 'border-zinc-700'
                }`}
                title={`Switch to ${t.id} theme`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Reading scroll progress meter bar */}
      <div className="h-0.5 w-full bg-white/5 shrink-0 z-10 select-none">
        <div
          className="h-full bg-theme-accent shadow-sm shadow-theme-accent/50 transition-all duration-100"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Main Reader layout structure */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Table of Contents left panel (only if headings exist, hidden on narrow screens) */}
        {headings.length > 1 && (
          <div className="hidden lg:flex w-[160px] border-r border-white/5 p-4 flex-col justify-start space-y-3.5 shrink-0 select-none bg-black/5">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center space-x-1">
              <Compass size={11} className="text-theme-accent" />
              <span>Outline Map</span>
            </span>
            <div className="space-y-2">
              {headings.map((heading) => (
                <button
                  key={heading.id}
                  className="text-left text-[10px] text-zinc-400 hover:text-theme-accent leading-snug transition block w-full truncate border-l border-white/5 pl-2 hover:border-theme-accent"
                  title={heading.title}
                >
                  {heading.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-6 sm:px-10 scrollbar-thin scrollbar-thumb-white/5"
        >
          {/* Article visual presentation frame */}
          <article className="max-w-2xl mx-auto space-y-5 text-left">
            
            {/* Metadata headers */}
            <div className="space-y-1 select-none">
              <div className="flex items-center space-x-2 text-[10px] font-semibold text-zinc-400">
                <span className="uppercase tracking-widest">{item.platform} Article</span>
                <span>•</span>
                <span>Original Link Domain</span>
              </div>
              <h1 className={`text-xl md:text-2xl font-bold leading-tight ${isSerif ? 'font-serif' : 'font-sans'}`}>
                {item.header}
              </h1>
            </div>

            <div className="h-px bg-white/5 w-full select-none" />

            {/* Simulated reading content */}
            <div
              style={{ fontSize: `${fontSize}px` }}
              className={`leading-relaxed space-y-4 whitespace-pre-wrap break-words ${
                isSerif ? 'font-serif' : 'font-sans'
              }`}
            >
              {item.note ? (
                item.note
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-10 space-y-2 select-none">
                  <AlertCircle size={24} className="text-zinc-500" />
                  <p className="text-xs text-zinc-400 max-w-sm italic">
                    This item has no saved text content. Write or scrape a detailed description/summary to unlock the full distraction-free reading mode experience!
                  </p>
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};
