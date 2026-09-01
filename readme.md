# OmniBox Content Aggregator

Universal local-first content aggregator, AI-assisted web scraper, and media visualizer.

## Overview

OmniBox is a high-performance, local-first progressive web application for capturing, organizing, playing, and previewing multimedia content across web platforms. It utilizes IndexedDB via Dexie.js for client-side persistence and an Express Node.js backend powered by Google's Gemini AI for metadata parsing and automatic content tagging.

## Features

- **Universal Content Aggregation**: Capture and categorize links, text snippets, social posts, audio tracks, and video URLs.
- **Instant Quick-Save Heuristic Parser**: Zero-latency heuristic URL parser (`src/utils/quickParse.ts`) for instant offline platform detection and preview generation (<5ms).
- **AI-Powered Metadata Extraction**: Leverages Google Gemini API (`@google/genai`) to parse title, summary, tag suggestions, and brand colors with OpenGraph fallback.
- **Audio Deck & Player**: Dedicated audio deck component with continuous play controls.
- **Moodboard Studio**: Visual workspace layout for grouping content cards dynamically.
- **Social Simulator**: Real-time preview simulator for social media platform outputs.
- **Immersive Reader**: Clean reader mode for distraction-free text consumption.
- **Command Palette (`Cmd+K`)**: Keyboard-driven quick switcher and action interface.
- **Local-First & Offline Ready**: IndexedDB storage via Dexie.js and Progressive Web App (PWA) offline capabilities with Workbox.
- **Toast Notifications**: Glassmorphic animated toast notification system with instant action triggers (`View`, `Undo`).

## Project Structure

```text
omnibox/
├── .github/                # CI/CD workflows and automated actions
├── public/                 # Static web assets, icons, and PWA manifest assets
├── release/                # Final distributable packages and build deliverables
├── resources/              # Persistent project inputs, icons, mockups, and reference assets
│   └── icons/              # Canonical application and PWA icon assets
├── src/                    # Application source code
│   ├── components/         # Modular React UI components
│   ├── utils/              # Client-side utility functions and quick-parse logic
│   ├── App.tsx             # Main application orchestrator
│   ├── db.ts               # Dexie IndexedDB schemas and operations
│   ├── index.css           # Global Tailwind CSS directives and styles
│   ├── main.tsx            # React application entry point
│   ├── theme.ts            # Visual themes and design tokens
│   └── types.ts            # Shared TypeScript interfaces
├── changelog.md            # Version history and change log
├── index.html              # HTML entry point template
├── metadata.json           # Application metadata descriptor
├── package.json            # Project manifest, dependencies, and scripts
├── readme.md               # Living project documentation
├── server.ts               # Express backend & AI metadata service
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build & PWA plugin settings
```

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Lucide React
- **Backend / API**: Node.js, Express, `tsx` runner, `@google/genai` (Google Gemini 2.4 SDK)
- **Database & Storage**: Dexie.js (IndexedDB wrapper)
- **Build System & Tooling**: Vite 6, `esbuild` (server bundler), Vite PWA plugin (Workbox)

## Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```bash
   GEMINI_API_KEY="your_google_gemini_api_key"
   PORT=3000
   ```

## Development

Start the backend and Vite dev server concurrently:
```bash
npm run dev
```

To run on a custom port:
```bash
PORT=3005 npm run dev
```

## Testing

Run TypeScript static analysis and type checking:
```bash
npm run lint
```

## Build

To build the frontend and bundle the server for production:
```bash
npm run build
```

Production artifacts will be generated in `dist/`.

## Configuration

| Variable | Description | Default | Required |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Google Gemini API key for intelligent metadata extraction | Optional (falls back to HTML scraping) | No |
| `PORT` | HTTP server listening port | `3000` | No |
| `APP_URL` | Application base URL | `http://localhost:3000` | No |

## Release

Production bundles are built with `npm run build` and distributable packages are archived in `release/`.

## Notes

- Uses local-first offline persistence; network connection is required only for live metadata enrichment via the Gemini AI endpoint or remote media stream playback.
