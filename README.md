# SharkWatch 🦈

A global shark intelligence dashboard — built as a therapeutic tool for a teenager whose special interest is sharks.

Live at **`http://192.168.1.40:5174`** (hosted on MacBook Pro via pm2 + serve).

---

## What it does

| Panel | Content |
|---|---|
| **Left** | OCEARCH tracked sharks — favourited pinned at top, status dots, last ping age |
| **Centre** | Interactive Leaflet map — current positions, migration path on click, iNaturalist sightings |
| **Right** | Daily Ocean Digest (AI), interleaved iNaturalist sightings + RSS news feed |
| **Bottom** | Research Hub, YouTube, TikTok, Streaming, Socials, Aquarium Cams, Species, Flashcards, History |
| **Floating** | Ask a Shark — Gemini-powered chat widget scoped to sharks only |

### Bottom strip tabs

| Tab | Content |
|---|---|
| 🦈 Research | Semantic Scholar papers — lemon shark, Plymouth Marine Lab, global labs |
| 🎥 YouTube | Recent positive shark encounter videos (content-filtered, session-cached) |
| 🎵 TikTok | 42 curated verified shark videos — OCEARCH, Ocean Ramsey, Georgia Aquarium, Shark Angels, 4ocean, Juan Sharks, One Ocean Diving |
| 📺 Streaming | UK streaming titles featuring sharks |
| 🐦 Socials | Live Bluesky posts from shark scientists and conservation orgs |
| 🏛️ Cams | 11 live aquarium webcams worldwide with local time clocks |
| 📖 Species | Shark species encyclopaedia |
| 🃏 Flashcards | Daily True/False shark myth-vs-fact mini-game (5 questions, daily score tracking) |
| 📅 History | "This week in shark history" — 4 AI-generated on-this-day events spanning 1930–2020 |

### Additional features
- **Photo of Day** — Unsplash/iNaturalist hero banner with drama scoring, daily rotation, full-screen gallery mode
- **Moon phase** — client-side lunar calculation with shark behaviour notes
- **Daily Ocean Digest** — Gemini paragraph weaving moon phase + top shark + latest headline
- **Shark detail** — species Wikipedia summary, Gemini fun facts, ping timeline, migration mini-map
- **Favourites** — star up to 5 sharks, pinned at top, persisted in localStorage
- **Mobile layout** — tabbed bottom nav (Sharks / Map / Feed / Research)

---

## Tech stack

- **React 18 + Vite** — client-side SPA, no backend
- **Tailwind CSS** — dark ocean theme (`#050e1a` base)
- **Leaflet / react-leaflet** — interactive map, CartoDB dark tiles
- **@google/generative-ai** — Gemini 2.5-flash for AI features
- **corsproxy.io** — CORS proxy for OCEARCH + RSS feeds
- **Bluesky AT Protocol** — public API, no auth required

---

## APIs used

| API | Purpose | Auth |
|---|---|---|
| OCEARCH / Mapotic | Shark positions + pings | None — public endpoint |
| iNaturalist | Sightings, lemon shark photos | None |
| Wikipedia REST | Species summaries | None |
| Semantic Scholar | Research papers (3 tabs) | None (rate-limited — sessionStorage cached) |
| Unsplash | Photo of Day | `VITE_UNSPLASH_ACCESS_KEY` |
| YouTube Data v3 | Shark encounter videos | Key in `YouTubeTab.jsx` |
| Google Gemini | AI narratives, facts, chat, flashcards, history | `VITE_GEMINI_API_KEY` |
| Bluesky (`public.api.bsky.app`) | Social feed | None |
| TikTok embed (`tiktok.com/embed/v2`) | Video playback | None (curated IDs only) |

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
```

### Dev server
```bash
npm run dev
# → http://localhost:5174
```

### Production build + deploy
```bash
npm run deploy
# Builds, rsyncs to MacBook Pro (preserving daily/ folder), restarts pm2
```

---

## Deployment (MacBook Pro)

**Remote:** `steveelliott@192.168.1.40` · SSH key: `~/.ssh/macbook_pro`
**Served from:** `~/sharkwatch-dist/` · **pm2 process:** `sharkwatch` · **Port:** `5174`

```bash
# First-time setup on MacBook Pro
npm install -g serve pm2
pm2 start serve --name sharkwatch -- -s ~/sharkwatch-dist -l 5174
pm2 save
```

Auto-start on boot configured via launchd (`~/Library/LaunchAgents/pm2.steveelliott.plist`).

---

## Daily pre-generation (2am cron)

Flashcard questions and history events are pre-generated nightly so they load instantly without waiting for the Gemini API.

**Scheduler:** launchd on MacBook Pro (`~/Library/LaunchAgents/com.sharkwatch.daily.plist`)
**Script:** `~/sharks-cron/generate-daily.js`
**Output:** `~/sharkwatch-dist/daily/flashcards-YYYY-MM-DD.json` and `history-MM-DD.json`
**Log:** `~/sharks-cron/daily.log`

The browser checks `/daily/{type}-{date}.json` first and only falls back to live Gemini if the file isn't there. The `daily/` folder is excluded from rsync so deployments never wipe pre-generated content.

To update the script after changes:
```bash
scp -i ~/.ssh/macbook_pro scripts/generate-daily.js steveelliott@192.168.1.40:~/sharks-cron/generate-daily.js
```

To run manually:
```bash
ssh -i ~/.ssh/macbook_pro steveelliott@192.168.1.40 'source ~/.nvm/nvm.sh && node ~/sharks-cron/generate-daily.js'
```

---

## Project structure

```
src/
├── App.jsx                       Layout orchestrator, state management, gallery state
├── hooks/
│   ├── useSharkData.js           OCEARCH animals + pings
│   ├── usePhotoOfDay.js          Unsplash drama scoring + iNat fallback, photo pool
│   ├── useINaturalist.js         Sightings feed (30min refresh)
│   ├── useNewsFeeds.js           RSS feeds via corsproxy.io
│   ├── useResearch.js            Semantic Scholar (sessionStorage cached)
│   ├── useFavourites.js          localStorage, max 5 sharks
│   └── useSharkSocialFeed.js     Bluesky AT Protocol public API
├── components/
│   ├── layout/
│   │   ├── Header.jsx            Nav tabs, moon phase, refresh
│   │   ├── LeftPanel.jsx         Shark list with favourites
│   │   ├── RightPanel.jsx        News + sightings feed
│   │   ├── BottomStrip.jsx       Lazy-loaded research/media tab panel
│   │   └── DailyDigest.jsx       AI ocean summary card (top of feed)
│   ├── map/
│   │   ├── SharkMap.jsx          Leaflet map
│   │   ├── OcearchMarker.jsx     Tagged shark markers
│   │   └── SightingMarker.jsx    iNaturalist sighting markers
│   ├── sharks/
│   │   ├── SharkCard.jsx         Shark list item
│   │   ├── SharkDetailDrawer.jsx Detail panel with AI content
│   │   └── SharkTimeline.jsx     SVG ping history bar chart
│   ├── research/
│   │   ├── ResearchHub.jsx       Paper tabs container
│   │   ├── PaperCard.jsx         Paper with AI plain-English summary
│   │   ├── SharkFlashcards.jsx   Daily True/False mini-game
│   │   └── SharkHistoryTab.jsx   On-this-day shark history
│   ├── media/
│   │   ├── PhotoOfDay.jsx        Hero banner with gallery trigger
│   │   ├── PhotoGallery.jsx      Full-screen photo gallery overlay
│   │   ├── YouTubeTab.jsx        Video grid with modal player
│   │   ├── TikTokTab.jsx         Curated TikTok iframe embeds
│   │   ├── StreamingTab.jsx      UK streaming titles
│   │   ├── SocialsTab.jsx        Bluesky posts feed
│   │   └── AquariumCamsTab.jsx   Live webcam links with local clocks
│   └── ui/
│       ├── SharkChat.jsx         Floating AI chat widget
│       ├── SharkSpotlight.jsx    AI shark narrative card
│       ├── MoonPhase.jsx         Lunar phase display
│       ├── StatusDot.jsx         Ping age indicator
│       └── LoadingSkeleton.jsx   Skeleton loaders
├── utils/
│   ├── gemini.js                 Gemini wrapper (session cache + static file fallback)
│   ├── cors.js                   corsproxy.io helper
│   ├── moonPhase.js              Client-side lunar calculator
│   ├── dramaScore.js             Unsplash photo quality scoring
│   └── rssParser.js              Native DOMParser RSS/Atom parser
├── data/
│   ├── sharkTikToks.js           42 curated verified TikTok video IDs
│   ├── sharkFacts.js             Daily shark facts
│   ├── streamingContent.js       UK streaming titles
│   └── aquariumCams.js           11 aquarium cams with timezone data
└── scripts/
    └── generate-daily.js         Node.js cron script for pre-generating daily content
```

---

## Known limitations

- **OCEARCH data** — species, weight, and length are not available from the public Mapotic endpoint. Ping history is fetched lazily on shark selection.
- **Semantic Scholar** rate limits unauthenticated requests. Research tabs cache in sessionStorage for 2 hours.
- **RSS feeds** route via corsproxy.io (free tier) — occasional failures show as stale data badge.
- **Twitter/X** is blocked for third-party scrapers — social feed uses Bluesky instead.
- **TikTok** has no public API — uses 42 curated Google-verified video IDs with native iframe embeds.
- **Unsplash ToS** requires photographer credit link and a download-trigger API call on each photo view.
