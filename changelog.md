# Changelog

All notable changes to the OmniBox project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-08-13 16:23 IST

### Added
- Instant Quick-Save pipeline (`quickParseUrl`) for shared URLs (Instagram Reels, YouTube Shorts, TikTok, Pinterest, X/Twitter, Spotify).
- Client-side zero-latency heuristic URL parser (`src/utils/quickParse.ts`) for instant offline platform detection and preview generation (<5ms).
- Non-blocking background AI metadata enrichment pipeline (`enrichItemInBackground`) that updates items silently without blocking user workflows.
- Glassmorphic animated toast notification system (`src/components/ToastNotification.tsx`) with instant action triggers (`View`, `Undo`).
- Automated GitHub Actions deployment workflow (`.github/workflows/deploy.yml`) configured for Node.js 24 and GitHub Pages PWA hosting.

### Changed
- Web Share Target on app mount now instantly saves items to IndexedDB in <5ms without blocking modal prompts.
- Expanded `PlatformType` and `FormatType` in `src/types.ts` to support `TikTok`, `Spotify`, `X / Twitter`, `Reel`, and `Audio`.

### Removed
- None.

### Fixed
- Eliminated blocking network spinners on share link submissions.

## [1.0.0] — 2026-08-13 16:18 IST

### Added
- Initial project structure with local-first IndexedDB storage via Dexie.js.
- Express backend integration with Google Gemini AI metadata extraction and OpenGraph fallback web scraping.
- Full UI components including Feed, AudioDeckPlayer, CommandPalette, MoodboardStudio, SocialSimulator, ImmersiveReader, and SettingsSection.
- Mandatory `release/` and `resources/` directories for deliverable separation and raw input asset storage.

### Changed
- Configured dynamic server `PORT` selection via `process.env.PORT` in `server.ts` to support flexible hosting.
- Updated package metadata to `omnibox` version `1.0.0`.

### Removed
- None.

### Fixed
- Verified TypeScript type definitions and production build compilation (`tsc --noEmit` and `npm run build`).
