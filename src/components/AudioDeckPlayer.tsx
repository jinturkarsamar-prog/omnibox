import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, RotateCw, Tv, Sparkles, MessageSquare, ListMusic } from 'lucide-react';
import { SavedItem } from '../types';

interface AudioDeckPlayerProps {
  item: SavedItem;
  ytVideoId: string | null;
}

const SIMULATED_LYRICS = [
  { time: 0, text: "🎵 [Intro Instrumental - Holographic Beat]" },
  { time: 10, text: "Saved this precious moment in my digital memory..." },
  { time: 22, text: "Pasted the URL, categorized so clean and free..." },
  { time: 35, text: "Local inference running, private models in the zone..." },
  { time: 48, text: "All my links are organized, a space to call my own..." },
  { time: 62, text: "🎵 [Chorus - Elevated Synth Waves]" },
  { time: 75, text: "OmniBox, guide my focus through the digital stream..." },
  { time: 88, text: "Curating inspiration, living out a high-tech dream..." },
  { time: 105, text: "CD rotating, frequency is riding high..." },
  { time: 120, text: "Waveform bouncing, shining like a summer sky..." },
  { time: 135, text: "🎵 [Outro - Soft Fade out]" }
];

export const AudioDeckPlayer: React.FC<AudioDeckPlayerProps> = ({ item, ytVideoId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerMode, setPlayerMode] = useState<'deck' | 'native'>('deck');
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'lyrics'>('visualizer');

  // Track timer simulation
  const duration = 150; // 2:30 total length
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseInt(e.target.value));
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const jumpToLyricTime = (time: number) => {
    setCurrentTime(time);
    setIsPlaying(true);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Find active lyric line
  const activeLyricIdx = SIMULATED_LYRICS.reduce((acc, lyric, idx) => {
    if (currentTime >= lyric.time) return idx;
    return acc;
  }, 0);

  // Heuristic visualizer bars
  const visualizerBars = Array.from({ length: 24 }).map((_, i) => {
    // Generate organic height multipliers
    const baseHeight = 15 + Math.sin(i * 0.4) * 10;
    const randomMultiplier = isPlaying ? 0.4 + Math.random() * 0.8 : 0.15;
    const height = Math.min(60, Math.max(4, baseHeight * randomMultiplier * (speed * 0.8)));
    return height;
  });

  const brandColor = item.brandColor || '#3b82f6';

  return (
    <div className="w-full h-full flex flex-col bg-slate-950/80 rounded-xl overflow-hidden border border-white/10 shadow-2xl relative group/player">
      {/* Top Media Tabs */}
      <div className="flex justify-between items-center bg-black/40 border-b border-white/10 px-4 py-2 text-xs shrink-0 z-10">
        <div className="flex items-center space-x-2">
          <Music size={13} className="text-theme-accent" />
          <span className="font-semibold text-zinc-300 truncate max-w-[140px] md:max-w-[200px]">
            {item.header}
          </span>
        </div>
        {ytVideoId && (
          <div className="flex bg-zinc-900 border border-white/10 rounded-xl p-0.5 shadow-inner">
            <button
              onClick={() => setPlayerMode('deck')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                playerMode === 'deck' ? 'bg-theme-accent text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Immersive Deck
            </button>
            <button
              onClick={() => {
                setPlayerMode('native');
                setIsPlaying(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                playerMode === 'native' ? 'bg-theme-accent text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Native Player
            </button>
          </div>
        )}
      </div>

      {playerMode === 'native' && ytVideoId ? (
        /* Native YouTube Player */
        <div className="relative w-full h-full aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&mute=0`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full absolute inset-0"
          />
        </div>
      ) : (
        /* Immersive Audio Deck Player */
        <div className="flex-1 flex flex-col p-4 sm:p-5 justify-between relative overflow-hidden select-none">
          {/* Neon background accent glows */}
          <div
            className="absolute -top-12 -left-12 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none transition-all duration-1000"
            style={{ backgroundColor: brandColor }}
          />
          <div
            className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none transition-all duration-1000"
            style={{ backgroundColor: brandColor }}
          />

          {/* Central CD deck and lyric display */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 items-center justify-center my-2 min-h-0">
            {/* Spinning CD/Vinyl layout (7 columns on MD) */}
            <div className="md:col-span-6 flex flex-col items-center justify-center relative">
              {/* CD Outer Case Shadow */}
              <div
                className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full flex items-center justify-center shadow-2xl bg-zinc-900 border border-white/10"
                style={{
                  boxShadow: isPlaying
                    ? `0 0 30px ${brandColor}25, inset 0 0 20px rgba(0,0,0,0.8)`
                    : 'inset 0 0 20px rgba(0,0,0,0.8)',
                }}
              >
                {/* Vinyl Grooves concentric rings */}
                <div className="absolute inset-2 border border-white/[0.04] rounded-full pointer-events-none" />
                <div className="absolute inset-6 border border-white/[0.04] rounded-full pointer-events-none" />
                <div className="absolute inset-10 border border-white/[0.04] rounded-full pointer-events-none" />
                <div className="absolute inset-14 border border-white/[0.04] rounded-full pointer-events-none" />

                {/* Spinning Core */}
                <div
                  className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden transition-transform duration-1000"
                  style={{
                    animation: isPlaying ? `spin ${10 / speed}s linear infinite` : 'none',
                    transform: `rotate(${currentTime * 12}deg)`,
                  }}
                >
                  {/* CD Album Cover Background */}
                  {item.customPreviewUrl || item.previewUrl ? (
                    <img
                      src={item.customPreviewUrl || item.previewUrl}
                      alt={item.header}
                      className="absolute inset-10 rounded-full object-cover opacity-60 mix-blend-lighten pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="absolute inset-10 rounded-full opacity-30 mix-blend-color"
                      style={{ backgroundColor: brandColor }}
                    />
                  )}

                  {/* Laser light shines overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent rounded-full rotate-45 transform origin-center pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-white/10 to-transparent rounded-full -rotate-45 transform origin-center pointer-events-none" />

                  {/* CD Center Hole Label */}
                  <div
                    className="w-12 h-12 rounded-full bg-slate-950 border-4 border-zinc-800 shadow-inner flex items-center justify-center z-10"
                    style={{ borderColor: brandColor }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow" />
                  </div>
                </div>
              </div>

              {/* Status Pill Badge */}
              <div
                className="mt-4 px-2.5 py-1 rounded-xl border text-[9px] font-bold uppercase tracking-widest flex items-center space-x-1.5 transition-all"
                style={{
                  backgroundColor: isPlaying ? `${brandColor}15` : 'rgba(255,255,255,0.05)',
                  borderColor: isPlaying ? `${brandColor}40` : 'rgba(255,255,255,0.1)',
                  color: isPlaying ? brandColor : '#a1a1aa',
                }}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'animate-ping' : ''}`} style={{ backgroundColor: brandColor }} />
                <span>{isPlaying ? 'Streaming Audio' : 'Paused'}</span>
              </div>
            </div>

            {/* Timed Lyrics & Info Panel (5 columns on MD) */}
            <div className="md:col-span-6 h-full flex flex-col justify-center min-h-[140px] max-h-[220px] bg-black/30 border border-white/5 rounded-xl p-3 relative overflow-hidden">
              {/* Tab Toggles */}
              <div className="flex border-b border-white/5 pb-1.5 mb-1.5 shrink-0 justify-between items-center">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">Audio Visuals</span>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => setActiveTab('visualizer')}
                    className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded transition ${
                      activeTab === 'visualizer' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Wave
                  </button>
                  <button
                    onClick={() => setActiveTab('lyrics')}
                    className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded transition ${
                      activeTab === 'lyrics' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Lyrics
                  </button>
                </div>
              </div>

              {activeTab === 'visualizer' ? (
                /* Live Waveform */
                <div className="flex-1 flex items-end justify-center space-x-1.5 pb-2 min-h-0">
                  {visualizerBars.map((height, idx) => (
                    <div
                      key={idx}
                      className="w-1.5 rounded-t transition-all duration-150"
                      style={{
                        height: `${height}px`,
                        backgroundColor: brandColor,
                        opacity: isPlaying ? 0.3 + (idx % 3) * 0.25 : 0.2,
                        boxShadow: isPlaying ? `0 0 10px ${brandColor}40` : 'none',
                      }}
                    />
                  ))}
                </div>
              ) : (
                /* Scrollable timed lyrics drawer */
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none min-h-0">
                  {SIMULATED_LYRICS.map((lyric, idx) => {
                    const isPassed = currentTime >= lyric.time;
                    const isActive = activeLyricIdx === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => jumpToLyricTime(lyric.time)}
                        className={`text-[10px] py-1 px-2 rounded-lg cursor-pointer transition-all border text-left ${
                          isActive
                            ? 'bg-white/10 border-white/20 text-white font-semibold'
                            : isPassed
                            ? 'border-transparent text-zinc-400'
                            : 'border-transparent text-zinc-600 hover:text-zinc-400'
                        }`}
                        style={{
                          color: isActive ? brandColor : undefined,
                          borderColor: isActive ? `${brandColor}40` : undefined,
                        }}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="leading-snug">{lyric.text}</span>
                          <span className="text-[8px] font-mono opacity-50">{formatTime(lyric.time)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Current timed lyric banner footer (always visible at bottom if lyrics is not selected) */}
              {activeTab === 'visualizer' && (
                <div className="border-t border-white/5 pt-2 text-center text-[10px] italic font-semibold text-zinc-300 min-h-[30px] flex items-center justify-center">
                  "{SIMULATED_LYRICS[activeLyricIdx]?.text || 'No lyrics available'}"
                </div>
              )}
            </div>
          </div>

          {/* Player controls deck */}
          <div className="space-y-3 pt-3 border-t border-white/5 shrink-0 bg-black/20 rounded-b-xl p-3">
            {/* Scrubber timeline bar */}
            <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-400">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-white/10 hover:bg-white/15 rounded-xl appearance-none cursor-pointer accent-theme-accent"
                style={{
                  background: `linear-gradient(to right, ${brandColor} 0%, ${brandColor} ${
                    (currentTime / duration) * 100
                  }%, rgba(255,255,255,0.1) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.1) 100%)`,
                }}
              />
              <span>{formatTime(duration)}</span>
            </div>

            {/* Audio controllers action grid */}
            <div className="flex justify-between items-center">
              {/* Speed multiplier controls */}
              <div className="flex items-center space-x-1.5 bg-zinc-900 border border-white/5 px-2 py-1 rounded-xl">
                <RotateCw size={10} className="text-zinc-400 animate-pulse" />
                <select
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="bg-transparent border-none text-[9px] font-bold text-zinc-300 focus:outline-none cursor-pointer p-0"
                >
                  <option value="0.5" className="bg-zinc-900">0.5x Speed</option>
                  <option value="1.0" className="bg-zinc-900">Normal 1.0x</option>
                  <option value="1.25" className="bg-zinc-900">1.25x Speed</option>
                  <option value="1.5" className="bg-zinc-900">1.5x Fast</option>
                  <option value="2.0" className="bg-zinc-900">2.0x Double</option>
                </select>
              </div>

              {/* Main Play / Pause circle buttons */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/50"
                style={{ backgroundColor: brandColor }}
              >
                {isPlaying ? <Pause size={18} fill="#fff" /> : <Play size={18} fill="#fff" className="ml-0.5" />}
              </button>

              {/* Interactive volume slider controller */}
              <div className="flex items-center space-x-2 w-[80px] sm:w-[100px]">
                <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition cursor-pointer">
                  {isMuted || volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseInt(e.target.value));
                    setIsMuted(false);
                  }}
                  className="flex-1 h-0.5 bg-white/10 rounded-xl appearance-none cursor-pointer accent-zinc-300"
                  style={{
                    background: `linear-gradient(to right, #e4e4e7 0%, #e4e4e7 ${
                      isMuted ? 0 : volume
                    }%, rgba(255,255,255,0.1) ${isMuted ? 0 : volume}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded spinning CD CSS animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
