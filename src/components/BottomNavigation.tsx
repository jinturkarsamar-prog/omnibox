import React, { useState } from 'react';
import {
  Layers,
  Inbox,
  Plus,
  FolderOpen,
  MoreHorizontal,
  Folder,
  Trash2,
  Settings,
  X,
  Play
} from 'lucide-react';
import { Folder as FolderType } from '../types';
import { BottomSheet } from './BottomSheet';

interface BottomNavigationProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onAddClick: () => void;
  folders: FolderType[];
  itemsCount: {
    all: number;
    inbox: number;
    trash: number;
  };
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeSection,
  onNavigate,
  onAddClick,
  folders,
  itemsCount,
}) => {
  const [isFoldersOpen, setIsFoldersOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleFolderSelect = (folderId: string | null) => {
    if (folderId) {
      onNavigate(`folder-${folderId}`);
    } else {
      onNavigate('all');
    }
    setIsFoldersOpen(false);
  };

  const handleMoreSelect = (section: string) => {
    onNavigate(section);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Sticky Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-theme-sidebar/95 backdrop-blur-md border-t border-theme-border h-[50px] px-4 flex items-center justify-between lg:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.06)] transition-colors duration-200">
        
        {/* Tab 1: Library (All) */}
        <button
          onClick={() => onNavigate('all')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition cursor-pointer ${
            activeSection === 'all' || activeSection.startsWith('folder-')
              ? 'text-theme-accent scale-105'
              : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          <Layers size={20} className={activeSection === 'all' ? 'stroke-[2.5px]' : 'stroke-2'} />
          <span className="text-[10px] font-bold mt-1 tracking-wide">Library</span>
        </button>

        {/* Tab 2: Inbox */}
        <button
          onClick={() => onNavigate('inbox')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition cursor-pointer relative ${
            activeSection === 'inbox'
              ? 'text-theme-accent scale-105'
              : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          <Inbox size={20} className={activeSection === 'inbox' ? 'stroke-[2.5px]' : 'stroke-2'} />
          <span className="text-[10px] font-bold mt-1 tracking-wide">Inbox</span>
          {itemsCount.inbox > 0 && (
            <span className="absolute top-1 right-5 bg-theme-accent text-white font-bold text-[9px] w-4 h-4 rounded-xl flex items-center justify-center shadow-sm">
              {itemsCount.inbox}
            </span>
          )}
        </button>

        {/* Tab 3: Centered floating "Quick Add" button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onAddClick}
            className="w-12 h-12 rounded-xl bg-theme-accent text-white hover:opacity-90 shadow-xl border border-theme-accent/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer ring-4 ring-theme-app"
            title="Quick Add Item"
          >
            <Plus size={24} className="stroke-[3px]" />
          </button>
        </div>

        {/* Tab 4: Folders Sheet Trigger */}
        <button
          onClick={() => setIsFoldersOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition cursor-pointer ${
            isFoldersOpen || activeSection.startsWith('folder-')
              ? 'text-theme-accent scale-105'
              : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          <FolderOpen size={20} className={isFoldersOpen ? 'stroke-[2.5px]' : 'stroke-2'} />
          <span className="text-[10px] font-bold mt-1 tracking-wide">Folders</span>
        </button>

        {/* Tab 5: More Actions Trigger */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition cursor-pointer ${
            isMoreOpen || activeSection === 'settings' || activeSection === 'trash'
              ? 'text-theme-accent scale-105'
              : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          <MoreHorizontal size={20} className="stroke-2" />
          <span className="text-[10px] font-bold mt-1 tracking-wide">More</span>
        </button>
      </div>

      {/* Folders Bottom Sheet Selector */}
      <BottomSheet
        isOpen={isFoldersOpen}
        onClose={() => setIsFoldersOpen(false)}
        title="Browse Folders"
      >
        <div className="space-y-2.5">
          {/* General Pool */}
          <button
            onClick={() => handleFolderSelect(null)}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition cursor-pointer ${
              activeSection === 'all'
                ? 'bg-theme-accent/10 border-theme-accent/40 text-theme-accent'
                : 'bg-theme-card border-theme-border text-theme-text hover:bg-theme-hover'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Layers size={16} />
              <span>All Media Library</span>
            </div>
            <span className="text-xs bg-theme-sidebar px-2 py-0.5 rounded-xl border border-theme-border text-theme-muted">
              {itemsCount.all}
            </span>
          </button>

          {/* Folder Listings */}
          <div className="border-t border-theme-border/60 my-3 pt-2">
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block px-1.5 mb-2">
              My Collections
            </span>
            {folders.length === 0 ? (
              <div className="text-center py-6 text-xs text-theme-muted">
                No folders created yet. Add a folder via the desktop sidebar!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {folders.map((folder) => {
                  const isSelected = activeSection === `folder-${folder.id}`;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => handleFolderSelect(folder.id)}
                      className={`w-full flex items-center space-x-3.5 p-3 rounded-xl border text-left text-sm font-semibold transition cursor-pointer ${
                        isSelected
                          ? 'bg-theme-accent/10 border-theme-accent/40 text-theme-accent'
                          : 'bg-theme-card border-theme-border text-theme-text hover:bg-theme-hover'
                      }`}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-xl flex-shrink-0"
                        style={{ backgroundColor: folder.color }}
                      />
                      <span className="truncate flex-1">{folder.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* "More" Bottom Sheet Options Panel */}
      <BottomSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        title="More Workspace Actions"
      >
        <div className="grid grid-cols-2 gap-3.5">
          {/* Option: Settings */}
          <button
            onClick={() => handleMoreSelect('settings')}
            className={`flex flex-col items-center justify-center p-5 rounded-xl border text-center transition cursor-pointer ${
              activeSection === 'settings'
                ? 'bg-theme-accent/15 border-theme-accent/40 text-theme-accent'
                : 'bg-theme-card border-theme-border text-theme-text hover:bg-theme-hover'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-theme-sidebar flex items-center justify-center border border-theme-border text-theme-text mb-2.5 shadow-sm">
              <Settings size={20} />
            </div>
            <span className="text-xs font-bold">Preferences</span>
            <span className="text-[10px] text-theme-muted mt-0.5">Themes & Engine</span>
          </button>

          {/* Option: Trash Recovery */}
          <button
            onClick={() => handleMoreSelect('trash')}
            className={`flex flex-col items-center justify-center p-5 rounded-xl border text-center transition cursor-pointer relative ${
              activeSection === 'trash'
                ? 'bg-theme-accent/15 border-theme-accent/40 text-theme-accent'
                : 'bg-theme-card border-theme-border text-theme-text hover:bg-theme-hover'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-theme-sidebar flex items-center justify-center border border-theme-border text-theme-text mb-2.5 shadow-sm">
              <Trash2 size={20} />
            </div>
            <span className="text-xs font-bold">Trash Vault</span>
            <span className="text-[10px] text-theme-muted mt-0.5">Recovery archive</span>

            {itemsCount.trash > 0 && (
              <span className="absolute top-3 right-3 bg-rose-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-xl">
                {itemsCount.trash}
              </span>
            )}
          </button>
        </div>
      </BottomSheet>
    </>
  );
};
