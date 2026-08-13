<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# OmniBox Content Aggregator

Universal local-first content aggregator, AI-assisted web scraper, and media visualizer.

> **AI Studio App**: [View in Google AI Studio](https://ai.studio/apps/b93ebcb0-4e1b-49a9-9e0b-32f826db1934)

## Overview

OmniBox is a high-performance local-first web application for capturing, organizing, playing, and previewing multimedia content across web platforms. It utilizes IndexedDB via Dexie.js for client-side persistence and an Express Node.js backend powered by Google's Gemini AI for metadata parsing and automatic content tagging.

## Capabilities & Features

- **Universal Content Aggregation**: Easily capture and categorize links, text snippets, social posts, audio tracks, and video URLs.
- **AI-Powered Metadata Extraction**: Leverages Google Gemini API (`@google/genai`) to parse title, summary, tag suggestions, and brand colors from links with OpenGraph fallback.
- **Audio Deck & Player**: Dedicated audio deck component with continuous play controls.
- **Moodboard Studio**: Visual workspace layout for grouping content cards dynamically.
- **Social Simulator**: Real-time preview simulator for social media platform outputs.
- **Immersive Reader**: Clean reader mode for distraction-free text consumption.
- **Command Palette (`Cmd+K`)**: Keyboard-driven quick switcher and action interface.
- **Local-First & Offline Ready**: IndexedDB storage via Dexie.js and Progressive Web App (PWA) offline capabilities with Workbox.

## Project Structure

```text
omnibox/
├── readme.md               # Project onboarding & documentation
├── changelog.md            # Version history and change log
├── package.json            # Project manifest and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build & PWA plugin settings
├── server.ts               # Express backend & AI metadata service
├── public/                 # Static web assets and icons
├── release/                # Production build outputs and deliverables
├── resources/              # Raw inputs, mockups, and reference assets
└── src/
    ├── App.tsx             # Main application orchestrator
    ├── db.ts               # Dexie IndexedDB schemas and operations
    ├── index.css           # Global Tailwind CSS directives and styles
    ├── main.tsx            # React application entry point
    ├── theme.ts            # Visual themes and design tokens
    ├── types.ts            # Shared TypeScript interfaces
    └── components/         # Modular UI components
        ├── AddMediaDialog.tsx
        ├── AudioDeckPlayer.tsx
        ├── BottomNavigation.tsx
        ├── BottomSheet.tsx
        ├── CommandPalette.tsx
        ├── ContextMenu.tsx
        ├── DetailSheet.tsx
        ├── Feed.tsx
        ├── ImmersiveReader.tsx
        ├── InspectorPanel.tsx
        ├── Logo.tsx
        ├── MoodboardStudio.tsx
        ├── PlatformIcon.tsx
        ├── SettingsSection.tsx
        ├── Sidebar.tsx
        ├── SocialSimulator.tsx
        ├── SwipeableItem.tsx
        └── TrashSection.tsx
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Lucide React
- **Backend / API**: Node.js, Express, `tsx` runner, `@google/genai` (Google Gemini 2.4 SDK)
- **Database & Storage**: Dexie.js (IndexedDB wrapper)
- **Build System**: Vite 6, `esbuild` (server bundler), Vite PWA plugin

## Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

## Setup & Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```bash
   GEMINI_API_KEY="your_google_gemini_api_key"
   PORT=3000
   ```

## Development Instructions

Start the backend and Vite dev server concurrently:
```bash
npm run dev
```

To run on a custom port:
```bash
PORT=3005 npm run dev
```

## Build Instructions

To build the frontend and bundle the server for production:
```bash
npm run build
```

Production artifacts will be generated in the `dist/` and `release/` directories.

## Run Instructions (Production)

Start the compiled production server:
```bash
npm run start
```

## Test Instructions

Run TypeScript static analysis and type checking:
```bash
npm run lint
```

## Environment Variables

| Variable | Description | Default | Required |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Google Gemini API key for intelligent metadata extraction | Optional (falls back to HTML scraping) | No |
| `PORT` | HTTP server listening port | `3000` | No |
| `APP_URL` | Application base URL | `http://localhost:3000` | No |

## Release Information

Production bundles are placed in `dist/` and distributable releases are saved in `release/`.

## Contribution & Development Conventions

- Use TypeScript strict mode and ensure `npm run lint` passes before committing.
- Maintain changelog entries in `changelog.md` following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and Semantic Versioning.
