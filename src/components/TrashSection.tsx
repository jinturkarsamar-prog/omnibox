import React from 'react';
import { Grid, List, Trash2, AlertTriangle, RotateCcw, ShieldAlert, Sparkles, Check, Flame } from 'lucide-react';
import { SavedItem } from '../types';
import { Feed } from './Feed';
import { PlatformIcon } from './PlatformIcon';

interface TrashSectionProps {
  trashItems: SavedItem[];
  onRestoreItem: (id: string) => void;
  onPermanentDeleteItem: (id: string) => void;
  onEmptyTrash: () => void;
  onContextMenu?: (e: React.MouseEvent, item: SavedItem) => void;  layout: "gallery" | "list";
  setLayout: (l: "gallery" | "list") => void;
  gallerySize?: 'comfortable' | 'standard' | 'compact';
  listDensity?: 'comfortable' | 'compact';
  showNotesInFeed?: boolean;
  showYouTubeViewer?: boolean;
}

export const TrashSection: React.FC<TrashSectionProps> = ({
  trashItems,
  onRestoreItem,
  onPermanentDeleteItem,
  onEmptyTrash,
  onContextMenu,
  onTagClick,  layout,
  setLayout,
  gallerySize = 'standard',
  listDensity = 'comfortable',
  showNotesInFeed = true,
  showYouTubeViewer = true,
}) => {
  // Calculate remaining simulated days (mocked based on when they were deleted, default is 30 days remaining)
  const getSimulatedDaysRemaining = (deletedAtStr: string | null): number => {
    if (!deletedAtStr) return 30;
    const deletedTime = new Date(deletedAtStr).getTime();
    const now = new Date().getTime();
    const diffMs = now - deletedTime;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const remaining = 30 - diffDays;
    return remaining <= 0 ? 1 : remaining;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Alert Header Banner */}
      <div className="p-6 rounded-xl border border-red-200 dark:border-red-950/60 bg-red-50 dark:bg-red-950/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/20 flex items-center justify-center border border-red-200 dark:border-red-900/20 text-red-500 shrink-0">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-theme-text tracking-wide">
              Trash Bin Vault
            </h2>
            <p className="text-xs text-theme-muted mt-1 max-w-xl leading-relaxed">
              Deleted folders and items are temporarily archived here. They will stay in the Trash Bin for{' '}
              <strong className="text-theme-text font-medium">30 days</strong>, after which they are permanently and irreversibly purged.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-end flex-1">
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-theme-card border border-theme-border rounded-xl p-0.5 text-theme-muted">
              <button
                onClick={() => setLayout('gallery')}
                title="Gallery View"
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  layout === 'gallery' ? 'bg-theme-sidebar text-theme-text' : 'hover:text-theme-text'
                }`}
              >
                <Grid size={15} />
              </button>
              <button
                onClick={() => setLayout('list')}
                title="List View"
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  layout === 'list' ? 'bg-theme-sidebar text-theme-text' : 'hover:text-theme-text'
                }`}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        {trashItems.length > 0 && (
          <button
            onClick={() => {
              if (
                confirm(
                  'Are you absolutely sure you want to empty the Trash Bin? All contents will be permanently deleted and cannot be recovered.',
                )
              ) {
                onEmptyTrash();
              }
            }}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-theme-card border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/20 text-red-500 font-medium rounded-xl text-xs transition shrink-0 cursor-pointer"
          >
            <Flame size={14} />
            <span>Empty Trash Bin ({trashItems.length})</span>
          </button>
        )}
        </div>
      </div>

      {/* Vault Grid */}
      
      {trashItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-theme-border bg-theme-sidebar/30">
          <Trash2 className="text-theme-muted mb-3" size={36} />
          <h3 className="text-sm font-semibold text-theme-text">Your Vault is Securely Empty</h3>
          <p className="text-xs text-theme-muted max-w-xs mt-1">
            When you delete folders or links from your dashboard, they will be archived here.
          </p>
        </div>
      ) : (
        <Feed
            onTagClick={onTagClick}
            showYouTubeViewer={showYouTubeViewer}
            items={trashItems}
            folders={[]}
            tags={[]}
            layout={layout}
            selectedItemIds={[]}
            onSelectItem={() => {}}
            onToggleSelectItem={() => {}}
            onDeleteItem={() => {}}
            onContextMenu={onContextMenu || (() => {})}
            isTrashView={true}
            onRestoreItem={onRestoreItem}
            onPermanentDeleteItem={onPermanentDeleteItem}
        />
      )}
    </div>
  );
};
