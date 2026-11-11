import React, { useEffect, useState } from 'react';
import { Check, FolderOpen, RotateCcw, ArrowLeft, Layers, Zap } from 'lucide-react';
import { Folder, SavedItem } from '../types';
import { PlatformIcon, getPlatformBadgeColor } from './PlatformIcon';

interface QuickShareOverlayProps {
  item: SavedItem | null;
  folders: Folder[];
  autoCloseEnabled: boolean;
  onAssignFolder: (itemId: string, folderId: string) => Promise<void>;
  onUndo: (itemId: string) => Promise<void>;
  onOpenLibrary: () => void;
}

/**
 * Lightweight, zero-distraction quick-save confirmation view rendered for
 * Android/iOS Web Share Target launches and 1-click browser bookmarklet popups.
 */
export const QuickShareOverlay: React.FC<QuickShareOverlayProps> = ({
  item,
  folders,
  autoCloseEnabled,
  onAssignFolder,
  onUndo,
  onOpenLibrary,
}) => {
  const [countdownMs, setCountdownMs] = useState(150);
  const [isAutoClosePaused, setIsAutoClosePaused] = useState(!autoCloseEnabled);
  const [closeBlocked, setCloseBlocked] = useState(false);
  const [assignedFolderId, setAssignedFolderId] = useState<string | null>(item?.folderId ?? null);

  useEffect(() => {
    setAssignedFolderId(item?.folderId ?? null);
  }, [item?.id, item?.folderId]);

  const attemptReturnToSource = () => {
    try {
      window.close();
    } catch {
      // Ignored if browser disallows window.close()
    }

    // If window.close() didn't close the tab/popup within 150ms, show manual fallback hint
    setTimeout(() => {
      if (!window.closed) {
        setCloseBlocked(true);
      }
    }, 150);
  };

  useEffect(() => {
    if (!item || isAutoClosePaused) return;

    const timer = setTimeout(() => {
      setCountdownMs(0);
      attemptReturnToSource();
    }, 150);

    return () => clearTimeout(timer);
  }, [item, isAutoClosePaused]);

  const pauseAutoClose = () => {
    if (!isAutoClosePaused) {
      setIsAutoClosePaused(true);
    }
  };

  const handleFolderPick = async (folderId: string) => {
    if (!item) return;
    pauseAutoClose();
    setAssignedFolderId(folderId);
    await onAssignFolder(item.id, folderId);
  };

  return (
    <div
      className="min-h-screen w-full bg-theme-app text-theme-text flex items-center justify-center p-4 font-sans antialiased"
      onPointerDown={pauseAutoClose}
    >
      <div className="w-full max-w-md bg-theme-sidebar border border-theme-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="px-5 py-3.5 border-b border-theme-border flex items-center justify-between bg-theme-card/60">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              {item ? <Check size={15} className="stroke-[2.5px]" /> : <Zap size={15} className="animate-pulse" />}
            </div>
            <div>
              <span className="text-xs font-bold text-theme-text block leading-tight">
                {item ? 'Saved to OmniBox' : 'Saving Link...'}
              </span>
              <span className="text-[10px] text-theme-muted block">
                {closeBlocked
                  ? 'Saved! Switch back to your video or open library.'
                  : !isAutoClosePaused && item
                    ? `Returning to your video in ${(countdownMs / 1000).toFixed(1)}s... (tap card to stay)`
                    : 'Saved locally — fetching link preview silently'}
              </span>
            </div>
          </div>

          {item && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xl flex items-center space-x-1 ${getPlatformBadgeColor(
                item.platform
              )}`}
            >
              <PlatformIcon platform={item.platform} size={11} />
              <span>{item.format}</span>
            </span>
          )}
        </div>

        {/* Saved Item Preview */}
        {item ? (
          <div className="p-5 space-y-4">
            <div className="flex items-center space-x-3.5 bg-theme-card border border-theme-border rounded-xl p-3">
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.header}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 bg-black/10"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-theme-sidebar border border-theme-border flex items-center justify-center shrink-0">
                  <PlatformIcon platform={item.platform} size={22} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-theme-text truncate">{item.header}</h2>
                <p className="text-[11px] text-theme-muted truncate mt-0.5">{item.url}</p>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-lg bg-theme-sidebar border border-theme-border text-theme-muted"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Optional 1-Tap Folder Filing */}
            {folders.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center space-x-1">
                  <FolderOpen size={11} />
                  <span>Quick File to Folder (Optional)</span>
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {folders.map((folder) => {
                    const isSelected = assignedFolderId === folder.id;
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => handleFolderPick(folder.id)}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-theme-accent text-white border-theme-accent shadow-xs'
                            : 'bg-theme-card border-theme-border text-theme-text hover:border-theme-accent'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: isSelected ? '#ffffff' : folder.color }}
                        />
                        <span className="truncate max-w-[140px]">{folder.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-theme-border">
              <button
                type="button"
                onClick={async () => {
                  pauseAutoClose();
                  await onUndo(item.id);
                  onOpenLibrary();
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-theme-border bg-theme-card text-xs font-semibold text-theme-muted hover:text-rose-500 transition cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Undo</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    pauseAutoClose();
                    onOpenLibrary();
                  }}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-theme-border bg-theme-card hover:bg-theme-sidebar text-xs font-semibold text-theme-text transition cursor-pointer"
                >
                  <Layers size={13} />
                  <span>Open Library</span>
                </button>

                <button
                  type="button"
                  onClick={attemptReturnToSource}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-theme-accent hover:bg-theme-hover text-white text-xs font-semibold transition cursor-pointer shadow-md"
                >
                  <ArrowLeft size={13} />
                  <span>Back to Video</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-theme-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Progress indicator when auto-closing */}
        {!isAutoClosePaused && !closeBlocked && item && (
          <div className="h-1 w-full bg-theme-border/40">
            <div
              className="h-full bg-theme-accent transition-all duration-150 ease-linear"
              style={{ width: `${Math.max(0, (countdownMs / 150) * 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
