import { useState, useEffect, useRef } from 'react'

const CATEGORIES = {
  research:     { label: 'Research',     color: '#38bdf8' },
  conservation: { label: 'Conservation', color: '#4ade80' },
  scientist:    { label: 'Scientist',    color: '#a78bfa' },
  aquarium:     { label: 'Aquarium',     color: '#f97316' },
  society:      { label: 'Society',      color: '#fb923c' },
}

const ACCOUNTS = [
  // Research labs
  { handle: 'OCEARCH',        name: 'OCEARCH',                          category: 'research',     desc: 'Real-time shark tracking & expeditions — daily pings during field season', embed: true },
  { handle: 'BiminiSharkLab', name: 'Bimini Biological Field Station',  category: 'research',     desc: "World's longest-running shark research station, Bahamas" },
  { handle: 'MoteMarineLab',  name: 'Mote Marine Laboratory',           category: 'research',     desc: "Founded by 'Shark Lady' Eugenie Clark, Florida" },
  { handle: 'MA_Sharks',      name: 'MA Division of Marine Fisheries',  category: 'research',     desc: '500+ individual white sharks identified at Cape Cod' },

  // Conservation orgs
  { handle: 'SharkTrustUK',   name: 'The Shark Trust',                  category: 'conservation', desc: 'UK conservation & policy, Great Eggcase Hunt citizen science' },
  { handle: 'SharkRayFund',   name: 'Shark Conservation Fund',          category: 'conservation', desc: 'Global shark & ray policy wins and funded research' },
  { handle: 'beneaththewaves', name: 'Beneath The Waves',               category: 'conservation', desc: 'Dr. Austin Gallagher — cutting-edge shark & ocean conservation science' },
  { handle: 'A_WhiteShark',   name: 'Atlantic White Shark Conservancy', category: 'conservation', desc: 'Cape Cod white shark sightings, tagging & community safety' },
  { handle: 'sharkangels',    name: 'Shark Angels',                     category: 'conservation', desc: 'Daily shark education, 500+ posts/year, myth-busting content' },
  { handle: 'Shark_Guardian', name: 'Shark Guardian',                   category: 'conservation', desc: 'UK registered charity, active 2024 tuna industry campaigns' },
  { handle: 'Sharks4Kids',    name: 'Sharks4Kids',                      category: 'conservation', desc: 'Education-first: virtual classrooms, VR experiences, citizen science', embed: true },
  { handle: 'saveourseas',    name: 'Save Our Seas Foundation',         category: 'conservation', desc: 'Supports threatened elasmobranch research worldwide' },
  { handle: 'oceana',         name: 'Oceana',                           category: 'conservation', desc: '3M+ followers, daily ocean content with regular shark campaigns' },

  // Scientists
  { handle: 'whysharksmatter', name: 'Dr. David Shiffman',             category: 'scientist',    desc: 'Best shark science communicator on social media — posts daily, corrects misinformation', embed: true },
  { handle: 'Elasmo_Gal',     name: 'Dr. Jasmin Graham',               category: 'scientist',    desc: 'Founder of MISS, PBS "Sharks Unknown", 2025 Schmidt Award winner' },
  { handle: 'AlisonTowner1',  name: 'Alison Towner',                   category: 'scientist',    desc: 'Lead white shark biologist, pioneering orca-shark predation research in SA' },
  { handle: 'UrbanEdgeSharks', name: 'Dr. Alison Kock',                category: 'scientist',    desc: 'Cape Town white shark specialist, science-public bridge builder' },
  { handle: 'DrNeilHammer',   name: 'Dr. Neil Hammerschlag',            category: 'scientist',    desc: 'University of Miami Shark Research & Conservation Programme' },
  { handle: 'dr_catmac',      name: 'Dr. Catherine Macdonald',         category: 'scientist',    desc: 'U Miami, Field School, inclusive marine science education' },
  { handle: 'CristinaZenato', name: 'Cristina Zenato',                  category: 'scientist',    desc: 'Cave explorer, shark behaviourist & underwater photographer, Bahamas' },

  // Aquariums
  { handle: 'GeorgiaAquarium', name: 'Georgia Aquarium',               category: 'aquarium',     desc: 'Only aquarium outside Asia housing whale sharks' },
  { handle: 'NEAQ',            name: 'New England Aquarium',            category: 'aquarium',     desc: 'Hatched 100+ epaulette sharks, active shark research programme' },
  { handle: 'TNAquarium',      name: 'Tennessee Aquarium',              category: 'aquarium',     desc: 'Secret Reef exhibit: sand tigers, bonnetheads & more' },

  // Societies
  { handle: 'ElasmoSociety',   name: 'American Elasmobranch Society',  category: 'society',      desc: 'Professional scientific society for all shark & ray researchers' },
  { handle: 'GuyHarveyOcean',  name: 'Guy Harvey',                     category: 'society',      desc: 'Marine wildlife artist, conservationist & NSU research institute' },
]

const EMBED_ACCOUNTS = ACCOUNTS.filter(a => a.embed)

export function SocialsTab() {
  const [activeEmbed, setActiveEmbed] = useState('OCEARCH')
  const [filterCat, setFilterCat]     = useState(null)
  const embedContainerRef = useRef(null)

  // Load Twitter widget script and (re-)render embed whenever activeEmbed changes
  useEffect(() => {
    const container = embedContainerRef.current
    if (!container) return

    // Inject a fresh anchor — the widget script converts it to an iframe
    container.innerHTML = `<a
      class="twitter-timeline"
      data-theme="dark"
      data-height="300"
      data-tweet-limit="5"
      data-chrome="noheader nofooter noborders transparent"
      href="https://twitter.com/${activeEmbed}"
    >Loading @${activeEmbed}…</a>`

    function processWidget() {
      window.twttr?.widgets.load(container)
    }

    if (window.twttr) {
      processWidget()
      return
    }

    // Script not yet loaded
    const existing = document.querySelector('script[src*="platform.twitter.com"]')
    if (existing) {
      // Script is already in the DOM (loading or loaded) — poll until ready
      const poll = setInterval(() => {
        if (window.twttr) { processWidget(); clearInterval(poll) }
      }, 100)
      setTimeout(() => clearInterval(poll), 15_000)
    } else {
      const s = document.createElement('script')
      s.src = 'https://platform.twitter.com/widgets.js'
      s.async = true
      s.charset = 'utf-8'
      s.onload = processWidget
      document.head.appendChild(s)
    }
  }, [activeEmbed])

  const displayed = filterCat ? ACCOUNTS.filter(a => a.category === filterCat) : ACCOUNTS

  return (
    <div className="p-3 space-y-5" style={{ minHeight: 300, color: '#e2e8f0' }}>

      {/* ── LIVE FEED ───────────────────────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Live Feed
        </h3>

        {/* Account selector */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {EMBED_ACCOUNTS.map(a => {
            const active = activeEmbed === a.handle
            return (
              <button
                key={a.handle}
                onClick={() => setActiveEmbed(a.handle)}
                type="button"
                className="text-[11px] px-2.5 py-1 rounded-full transition-colors"
                style={{
                  background: active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
                  color:      active ? '#38bdf8' : '#94a3b8',
                  border:     `1px solid ${active ? '#38bdf8' : '#1e3a5a'}`,
                }}
              >
                @{a.handle}
              </button>
            )
          })}
        </div>

        {/* Embed container — innerHTML is managed by the useEffect above */}
        <div
          ref={embedContainerRef}
          className="rounded-lg overflow-hidden"
          style={{ background: '#050e1a', border: '1px solid #1a4a7a', minHeight: 120 }}
        />

        <p className="text-[10px] text-slate-600 mt-1.5 text-right">
          Powered by Twitter/X · Opens in new tab
        </p>
      </section>

      {/* ── ACCOUNT DIRECTORY ───────────────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Account Directory
          <span className="ml-2 text-slate-600 font-normal normal-case">
            {displayed.length} accounts
          </span>
        </h3>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            onClick={() => setFilterCat(null)}
            type="button"
            className="text-[10px] px-2.5 py-0.5 rounded-full font-medium transition-colors"
            style={{
              background: !filterCat ? '#38bdf8' : 'rgba(255,255,255,0.05)',
              color:      !filterCat ? '#050e1a' : '#94a3b8',
            }}
          >
            All
          </button>
          {Object.entries(CATEGORIES).map(([id, cat]) => (
            <button
              key={id}
              onClick={() => setFilterCat(filterCat === id ? null : id)}
              type="button"
              className="text-[10px] px-2.5 py-0.5 rounded-full font-medium transition-colors"
              style={{
                background: filterCat === id ? cat.color : 'rgba(255,255,255,0.05)',
                color:      filterCat === id ? '#050e1a' : '#94a3b8',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}
        >
          {displayed.map(account => {
            const cat = CATEGORIES[account.category]
            return (
              <a
                key={account.handle}
                href={`https://twitter.com/${account.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2.5 rounded-lg transition-all group"
                style={{
                  background:  '#070f1c',
                  border:      '1px solid #1a4a7a',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = cat.color + '66')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a4a7a')}
              >
                {/* Category badge */}
                <span
                  className="inline-block text-[9px] px-1.5 py-0.5 rounded-full font-semibold mb-1.5"
                  style={{ background: cat.color + '22', color: cat.color }}
                >
                  {cat.label}
                </span>

                {/* Handle */}
                <p
                  className="text-xs font-bold leading-tight group-hover:text-[#38bdf8] transition-colors"
                  style={{ color: '#e2e8f0' }}
                >
                  @{account.handle}
                </p>

                {/* Full name */}
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  {account.name}
                </p>

                {/* Description */}
                <p
                  className="text-[10px] text-slate-500 mt-1 leading-snug"
                  style={{
                    display:            '-webkit-box',
                    WebkitLineClamp:    2,
                    WebkitBoxOrient:    'vertical',
                    overflow:           'hidden',
                  }}
                >
                  {account.desc}
                </p>
              </a>
            )
          })}
        </div>
      </section>
    </div>
  )
}
