import React from 'react';
import {
  Youtube,
  Music,
  ListMusic,
  Instagram,
  FileText,
  Globe,
  Play,
  BookOpen,
  Image as ImageIcon,
  MessageCircle,
  Hash,
  Compass,
  User,
  Gamepad2,
  Bookmark,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { PlatformType, FormatType } from '../types';

interface PlatformIconProps {
  platform: PlatformType;
  className?: string;
  size?: number;
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({
  platform,
  className = '',
  size = 18,
}) => {
  switch (platform) {
    case 'YouTube':
      return <Youtube className={`text-rose-500 ${className}`} size={size} />;
    case 'Music':
      return <Music className={`text-red-400 ${className}`} size={size} />;
    case 'Instagram':
      return <Instagram className={`text-pink-500 ${className}`} size={size} />;
    case 'Threads':
      return <Hash className={`text-slate-100 ${className}`} size={size} />;
    case 'Pinterest':
      return <Compass className={`text-red-600 ${className}`} size={size} />;
    case 'Google':
      return <Globe className={`text-blue-400 ${className}`} size={size} />;
    case 'Play Store':
      return <Gamepad2 className={`text-emerald-400 ${className}`} size={size} />;
    case 'TikTok':
      return <Play className={`text-cyan-400 ${className}`} size={size} />;
    case 'Spotify':
      return <Music className={`text-emerald-400 ${className}`} size={size} />;
    case 'X / Twitter':
      return <MessageCircle className={`text-sky-400 ${className}`} size={size} />;
    default:
      return <Bookmark className={`text-indigo-400 ${className}`} size={size} />;
  }
};

interface FormatIconProps {
  format: FormatType;
  className?: string;
  size?: number;
}

export const FormatIcon: React.FC<FormatIconProps> = ({
  format,
  className = '',
  size = 16,
}) => {
  switch (format) {
    case 'Reel':
      return <Play className={`text-slate-300 ${className}`} size={size} />;
    case 'Audio':
      return <Music className={`text-slate-300 ${className}`} size={size} />;
    case 'Video':
      return <Play className={`text-slate-300 ${className}`} size={size} />;
    case 'Article':
      return <FileText className={`text-slate-300 ${className}`} size={size} />;
    case 'Profile':
      return <User className={`text-slate-300 ${className}`} size={size} />;
    case 'Comment':
      return <MessageSquare className={`text-slate-300 ${className}`} size={size} />;
    case 'Song':
      return <Music className={`text-slate-300 ${className}`} size={size} />;
    case 'Playlist':
      return <ListMusic className={`text-slate-300 ${className}`} size={size} />;
    case 'Artist':
      return <User className={`text-slate-300 ${className}`} size={size} />;
    case 'App':
      return <Gamepad2 className={`text-slate-300 ${className}`} size={size} />;
    case 'Book':
      return <BookOpen className={`text-slate-300 ${className}`} size={size} />;
    case 'Thread':
      return <MessageCircle className={`text-slate-300 ${className}`} size={size} />;
    case 'Image':
      return <ImageIcon className={`text-slate-300 ${className}`} size={size} />;
    case 'Post':
      return <FileText className={`text-slate-300 ${className}`} size={size} />;
    case 'Note':
      return <FileText className={`text-slate-300 ${className}`} size={size} />;
    case 'Website':
      return <Globe className={`text-slate-300 ${className}`} size={size} />;
    default:
      return <HelpCircle className={`text-slate-300 ${className}`} size={size} />;
  }
};

export function getPlatformBadgeColor(platform: PlatformType): string {
  switch (platform) {
    case 'YouTube':
      return 'bg-rose-950/40 text-rose-300 border border-rose-500/20';
    case 'Music':
      return 'bg-red-950/40 text-red-300 border border-red-500/20';
    case 'Instagram':
      return 'bg-pink-950/40 text-pink-300 border border-pink-500/20';
    case 'Threads':
      return 'bg-slate-900/40 text-slate-200 border border-slate-700/20';
    case 'Pinterest':
      return 'bg-red-950/40 text-red-300 border border-red-600/20';
    case 'Google':
      return 'bg-blue-950/40 text-blue-300 border border-blue-500/20';
    case 'Play Store':
      return 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20';
    case 'TikTok':
      return 'bg-zinc-900/70 text-cyan-300 border border-cyan-500/20';
    case 'Spotify':
      return 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/20';
    case 'X / Twitter':
      return 'bg-sky-950/50 text-sky-300 border border-sky-500/20';
    default:
      return 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/20';
  }
}
