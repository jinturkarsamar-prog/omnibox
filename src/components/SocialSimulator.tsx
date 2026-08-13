import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Share2, CheckCircle2, CornerDownRight, MoreHorizontal } from 'lucide-react';
import { SavedItem } from '../types';

interface SocialSimulatorProps {
  item: SavedItem;
}

interface MockComment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  likes: number;
  time: string;
  isVerified?: boolean;
}

const INITIAL_COMMENTS: MockComment[] = [
  { id: 'c1', user: 'creative_curator', avatar: 'CC', text: 'This looks so incredibly detailed. Adding this reference to my current moodboard instantly!', likes: 12, time: '2h ago', isVerified: true },
  { id: 'c2', user: 'dev_pioneer', avatar: 'DP', text: 'Stunning layout! The color coordination is on point. Local LM Studio API works wonders.', likes: 4, time: '5h ago' },
  { id: 'c3', user: 'design_architect', avatar: 'DA', text: 'Cleanest design bookmarking tool I’ve encountered so far. Pure elegance.', likes: 18, time: '1d ago', isVerified: true },
];

export const SocialSimulator: React.FC<SocialSimulatorProps> = ({ item }) => {
  const [likesCount, setLikesCount] = useState(() => Math.floor(Math.random() * 120) + 45);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasBookmarked, setHasBookmarked] = useState(false);
  const [comments, setComments] = useState<MockComment[]>(INITIAL_COMMENTS);
  const [newCommentText, setNewCommentText] = useState('');
  const [showShareNotification, setShowShareNotification] = useState(false);

  const handleLike = () => {
    if (hasLiked) {
      setLikesCount((prev) => prev - 1);
      setHasLiked(false);
    } else {
      setLikesCount((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  const handleShare = () => {
    setShowShareNotification(true);
    setTimeout(() => {
      setShowShareNotification(false);
    }, 2000);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newCommentText.trim();
    if (!text) return;

    const fresh: MockComment = {
      id: `comment-${Date.now()}`,
      user: 'you_curator',
      avatar: 'U',
      text,
      likes: 0,
      time: 'Just now',
    };

    setComments((prev) => [...prev, fresh]);
    setNewCommentText('');
  };

  const handleLikeComment = (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c))
    );
  };

  const brandColor = item.brandColor || '#3b82f6';
  const username = item.platform.toLowerCase().replace(/\s+/g, '_') + '_official';

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl relative select-none font-sans">
      
      {/* Social Card Visual Stage */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/5">
        
        {/* Social Card Box */}
        <div className="border border-white/10 bg-black/40 rounded-xl overflow-hidden p-4 space-y-3.5">
          
          {/* Card Header Profile */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2.5">
              <div
                className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-xs font-black text-white shrink-0 uppercase tracking-wider"
                style={{ backgroundColor: brandColor }}
              >
                {item.platform.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="text-[11px] font-bold text-zinc-200">@{username}</span>
                  <CheckCircle2 size={11} className="text-blue-400 fill-blue-400" />
                </div>
                <span className="text-[9px] text-zinc-500 font-medium">Verified Channel • Creator Hub</span>
              </div>
            </div>
            <button className="text-zinc-500 hover:text-zinc-300">
              <MoreHorizontal size={14} />
            </button>
          </div>

          {/* Card Media Preview image */}
          {(item.customPreviewUrl || item.previewUrl) && (
            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 bg-zinc-950">
              <img
                src={item.customPreviewUrl || item.previewUrl}
                alt={item.header}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Social Card Content description text */}
          <div className="space-y-1 text-left">
            <h3 className="text-xs font-bold text-zinc-200">{item.header}</h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-wrap">
              {item.quoteText || item.note || 'Sharing this beautiful inspiration. Check out the link!'}
            </p>
          </div>

          {/* Reaction Toolbar */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3 text-zinc-400">
            <div className="flex space-x-4">
              
              {/* Like action */}
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1.5 text-xs font-bold transition cursor-pointer hover:scale-105 active:scale-95 ${
                  hasLiked ? 'text-rose-500' : 'hover:text-rose-400'
                }`}
              >
                <Heart size={15} fill={hasLiked ? '#f43f5e' : 'none'} className={hasLiked ? 'animate-heart-pop' : ''} />
                <span>{likesCount}</span>
              </button>

              {/* Message Comments count */}
              <div className="flex items-center space-x-1.5 text-xs font-semibold">
                <MessageCircle size={15} />
                <span>{comments.length}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              
              {/* Share action */}
              <button onClick={handleShare} className="hover:text-white transition cursor-pointer" title="Copy share link">
                <Share2 size={15} />
              </button>

              {/* Bookmark save action */}
              <button
                onClick={() => setHasBookmarked(!hasBookmarked)}
                className={`transition cursor-pointer ${hasBookmarked ? 'text-amber-400' : 'hover:text-white'}`}
                title="Save to Vault"
              >
                <Bookmark size={15} fill={hasBookmarked ? '#fbbf24' : 'none'} />
              </button>
            </div>
          </div>
        </div>

        {/* Section: Comments replies list */}
        <div className="space-y-3.5 pt-1 text-left">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block">
            Replies ({comments.length})
          </span>
          <div className="space-y-3 pl-1">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-2.5 items-start text-[11px] leading-relaxed group/comment animate-fade-in">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white shrink-0"
                  style={{ backgroundColor: `${brandColor}aa` }}
                >
                  {comment.avatar}
                </div>
                <div className="flex-1 bg-black/20 border border-white/5 rounded-xl px-3 py-2 space-y-1 relative">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-zinc-200">@{comment.user}</span>
                      {comment.isVerified && (
                        <CheckCircle2 size={9} className="text-blue-400 fill-blue-400" />
                      )}
                    </div>
                    <span className="text-[8px] text-zinc-500 font-mono">{comment.time}</span>
                  </div>
                  <p className="text-zinc-400 leading-snug">{comment.text}</p>
                  
                  {/* Like inline comment */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className="text-[9px] text-zinc-500 hover:text-rose-400 flex items-center space-x-1 font-semibold transition cursor-pointer"
                    >
                      <Heart size={9} />
                      <span>{comment.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Quick Add Comment bar */}
      <form onSubmit={handlePostComment} className="border-t border-white/10 p-3 shrink-0 bg-black/40 flex space-x-2 items-center">
        <div className="w-5 h-5 rounded-full bg-theme-accent/30 text-[9px] font-extrabold text-zinc-300 flex items-center justify-center shrink-0 border border-theme-accent/20">
          U
        </div>
        <input
          type="text"
          placeholder="Write a community reply..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-theme-accent placeholder-zinc-500 transition"
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-theme-accent hover:bg-theme-hover text-white transition cursor-pointer"
          title="Send Reply"
        >
          <Send size={12} />
        </button>
      </form>

      {/* Share Toast */}
      {showShareNotification && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-theme-accent text-white text-[10px] font-bold uppercase tracking-wider py-1.5 px-4 rounded-xl border border-white/20 shadow-lg animate-bounce-short z-50">
          Link Shared to Clipboard!
        </div>
      )}

      {/* Extra micro-animations styles */}
      <style>{`
        @keyframes heart-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .animate-heart-pop {
          animation: heart-pop 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
