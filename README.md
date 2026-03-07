# SharkWatch 🦈

A global shark intelligence dashboard — built as a therapeutic tool for a teenager whose special interest is sharks.

Live at **`http://192.168.1.40:5174`** (hosted on MacBook Pro via pm2 + serve).

---

## What it does

| Panel | Content |
|---|---|
| **Left** | 459 tracked marine animals from OCEARCH/Mapotic — favourited sharks pinned at top, status dots, last ping age |
| **Centre** | Interactive Leaflet map — current positions, migration path on click, iNaturalist sightings, research institution markers |
| **Right** | Shark of the Day (Gemini narrative), interleaved iNaturalist sightings + RSS news feed |
| **Bottom** | Research Hub (Semantic Scholar papers), YouTube encounters, UK streaming titles, aquarium live cams |
| **Floating** | Ask a Shark — Gemini-powered chat widget scoped to sharks only |

### Additional features
- **Photo of Day** — Unsplash/iNaturalist hero banner with drama scoring, daily rotation
- **Moon phase** — client-side lunar calculation with shark behaviour notes
- **Shark detail** — species Wikipedia summary, Gemini fun facts, ping timeline, migration path mini-map, total distance tracked
- **Favourites** — star up to 5 sharks, pinned at top, persisted in localStorage
- **Mobile layout** — tabbed bottom nav (Sharks / Map / Feed / Research)

---

## Tech stack

- **React 18 + Vite** — client-side SPA, no backend
- **Tailwind CSS** — dark ocean theme
- **Leaflet / react-leaflet** — interactive map, CartoDB dark tiles
- **@google/generative-ai** — Gemini 2.0-flash for AI features
- **No proxy** — all APIs have native CORS (mapotic, iNaturalist, Wikipedia, Semantic Scholar, Unsplash, YouTube)

---

## APIs used

| API | Purpose | Auth |
|---|---|---|
| Mapotic (`mapotic.com/api/v1/maps/3413`) | OCEARCH shark positions | None — public endpoint |
| iNaturalist | Sightings, lemon shark photos | None |
| Wikipedia REST | Species summaries | None |
| Semantic Scholar | Research papers (3 tabs) | None (rate limited — cached in sessionStorage) |
| Unsplash | Photo of Day | `VITE_UNSPLASH_ACCESS_KEY` |
| YouTube Data v3 | Shark encounter videos | `VITE_YOUTUBE_API_KEY` |
| Google Gemini | AI narratives, facts, chat | `VITE_GEMINI_API_KEY` |

---

## Setup

### Prerequisites
- Node.js 18+
- API keys (see below)

### Install
```bash
npm install
```

### Environment variables
Create `.env` in the project root:
```
VITE_GEMINI_API_KEY=your_gemini_key
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_key
VITE_YOUTUBE_API_KEY=your_youtube_key
```

### Dev server
```bash
npm run dev
# → http://localhost:5174
```

### Production build
```bash
npm run build
# output: dist/
```

---

## Deployment (MacBook Pro)

```bash
# On dev machine — build and transfer
npm run build
scp -i ~/.ssh/macbook_pro -r dist/ steveelliott@192.168.1.40:~/sharkwatch-dist

# On MacBook Pro — first time setup
npm install -g serve pm2
pm2 start serve --name sharkwatch -- -s ~/sharkwatch-dist -l 5174
pm2 save

# On MacBook Pro — updates
# (after transferring new dist/)
pm2 restart sharkwatch
```

Auto-start on boot is configured via launchd (`~/Library/LaunchAgents/pm2.steveelliott.plist`).

---

## Project structure

```
src/
├── App.jsx                  # Layout orchestrator, state management
├── hooks/
│   ├── useSharkData.js      # Mapotic/OCEARCH animals + positions
│   ├── usePhotoOfDay.js     # Unsplash drama scoring + iNat fallback
│   ├── useINaturalist.js    # Sightings feed (30min refresh)
│   ├── useNewsFeeds.js      # RSS feeds via corsproxy.io
│   ├── useResearch.js       # Semantic Scholar (sessionStorage cached)
│   ├── useYouTube.js        # YouTube (session cached, quota-safe)
│   └── useFavourites.js     # localStorage, max 5 sharks
├── components/
│   ├── layout/              # Header, LeftPanel, RightPanel, BottomStrip
│   ├── map/                 # SharkMap, MiniMap, markers
│   ├── sharks/              # SharkCard, SharkDetailDrawer, SharkTimeline
│   ├── research/            # ResearchHub, PaperCard, tab components
│   ├── media/               # PhotoOfDay, YouTubeTab, StreamingTab, AquariumCamsTab
│   └── ui/                  # SharkChat, SharkSpotlight, LoadingSkeleton, ErrorBanner, MoonPhase
├── utils/
│   ├── gemini.js            # Gemini wrapper (session cached)
│   ├── cors.js              # corsproxy.io helper
│   ├── moonPhase.js         # Client-side lunar calculation
│   ├── dramaScore.js        # Unsplash photo quality scoring
│   └── rssParser.js         # Native DOMParser RSS/Atom parser
└── data/
    ├── sharkFacts.js        # 75 daily shark facts
    ├── streamingContent.js  # UK streaming titles
    └── aquariumCams.js      # 11 aquarium live cams with timezones
```

---

## Known limitations

- **Semantic Scholar** rate limits unauthenticated requests (1 req/s). Research tabs cache results in sessionStorage for 2 hours to minimise API calls.
- **OCEARCH data** — species, weight, and length are not available from the public Mapotic endpoint. Ping history is fetched lazily on shark selection.
- **RSS feeds** route via corsproxy.io (free tier) — occasional failures show as stale data badge.
