import React, { useEffect, useState } from 'react';
import { bumpChapterInTitle, extractChapterInfo, setChapterInTitle } from '../utils/quickParse';

interface ChapterProgressStepperProps {
  title: string;
  onChangeTitle: (nextTitle: string) => void;
  compact?: boolean;
}

/**
 * Inline chapter/episode progress control for titles containing a chapter or episode number.
 */
export const ChapterProgressStepper: React.FC<ChapterProgressStepperProps> = ({
  title,
  onChangeTitle,
  compact = false,
}) => {
  const chapter = extractChapterInfo(title);
  const [draft, setDraft] = useState(chapter ? String(chapter.number) : '');

  useEffect(() => {
    setDraft(chapter ? String(chapter.number) : '');
  }, [chapter?.number, title]);

  if (!chapter) return null;

  const commitDraft = () => {
    const parsed = Number.parseInt(draft.trim(), 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(chapter.number));
      return;
    }
    const nextTitle = setChapterInTitle(title, parsed);
    if (nextTitle && nextTitle !== title) {
      onChangeTitle(nextTitle);
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-xl bg-theme-card border border-theme-border ${
        compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className="text-theme-muted font-medium">{chapter.label}</span>
      <input
        type="number"
        min={0}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitDraft();
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        aria-label={`${chapter.label} number`}
        className="w-14 bg-theme-sidebar border border-theme-border rounded-lg px-1.5 py-0.5 text-center font-semibold text-theme-text focus:outline-none focus:border-theme-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => {
          const next = bumpChapterInTitle(title, -1);
          if (next) onChangeTitle(next);
        }}
        className="px-1.5 py-0.5 rounded-lg bg-theme-sidebar border border-theme-border hover:border-theme-accent text-theme-text font-semibold cursor-pointer"
        title="Previous chapter"
      >
        -1
      </button>
      <button
        type="button"
        onClick={() => {
          const next = bumpChapterInTitle(title, 1);
          if (next) onChangeTitle(next);
        }}
        className="px-1.5 py-0.5 rounded-lg bg-theme-accent/20 border border-theme-accent/40 hover:bg-theme-accent/30 text-theme-accent font-semibold cursor-pointer"
        title="Next chapter"
      >
        +1
      </button>
    </div>
  );
};
