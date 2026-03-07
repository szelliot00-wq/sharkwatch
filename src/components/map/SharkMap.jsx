import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet'
import OcearchMarker from './OcearchMarker'
import SightingMarker from './SightingMarker'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CARTO_DARK_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

const RESEARCH_INSTITUTIONS = [
  {
    name: 'Bimini Biological Field Station',
    lat: 25.73,
    lon: -79.30,
    country: 'Bahamas',
    flag: '\uD83C\uDDE7\uD83C\uDDF8',
    description: 'Pioneering elasmobranch research in the Bahamas since 1990.',
  },
  {
    name: 'University of Plymouth',
    lat: 50.37,
    lon: -4.14,
    country: 'United Kingdom',
    flag: '\uD83C\uDDEC\uD83C\uDDE7',
    description: 'Marine science and shark ecology research in European waters.',
  },
  {
    name: 'James Cook University',
    lat: -19.33,
    lon: 146.76,
    country: 'Australia',
    flag: '\uD83C\uDDE6\uD83C\uDDFA',
    description: 'Leading tropical marine biology and reef shark studies.',
  },
  {
    name: 'Flinders University',
    lat: -35.02,
    lon: 138.57,
    country: 'Australia',
    flag: '\uD83C\uDDE6\uD83C\uDDFA',
    description: 'Shark population dynamics and Southern Ocean research.',
  },
  {
    name: 'Nova Southeastern University',
    lat: 26.05,
    lon: -80.24,
    country: 'USA',
    flag: '\uD83C\uDDFA\uD83C\uDDF8',
    description: 'Guy Harvey Oceanographic Center — shark tagging and telemetry.',
  },
  {
    name: 'University of Miami',
    lat: 25.71,
    lon: -80.28,
    country: 'USA',
    flag: '\uD83C\uDDFA\uD83C\uDDF8',
    description: 'Rosenstiel School — pelagic shark movement and physiology.',
  },
  {
    name: 'Hawaii HIMB',
    lat: 21.43,
    lon: -157.79,
    country: 'USA',
    flag: '\uD83C\uDDFA\uD83C\uDDF8',
    description: "Hawaii Institute of Marine Biology — Pacific shark ecology.",
  },
  {
    name: 'Dalhousie University',
    lat: 44.63,
    lon: -63.59,
    country: 'Canada',
    flag: '\uD83C\uDDE8\uD83C\uDDE6',
    description: 'Ocean Tracking Network HQ — global shark acoustic telemetry.',
  },
  {
    name: 'SAIAB',
    lat: -33.31,
    lon: 26.52,
    country: 'South Africa',
    flag: '\uD83C\uDDFF\uD83C\uDDE6',
    description: 'South African Institute for Aquatic Biodiversity — shark conservation.',
  },
]

// ---------------------------------------------------------------------------
// Inner component: handles map side-effects that require the map instance
// ---------------------------------------------------------------------------

function MapController({ selectedShark, pings }) {
  const map = useMap()
  const prevSharkIdRef = useRef(null)

  useEffect(() => {
    if (!selectedShark) return

    const sharkPings = pings
      .filter((p) => p.animalId === selectedShark.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    if (sharkPings.length === 0) return

    const latest = sharkPings[0]

    // Only fly if the selected shark actually changed
    if (prevSharkIdRef.current !== selectedShark.id) {
      map.flyTo([latest.lat, latest.lon], 6, { duration: 1.4 })
      prevSharkIdRef.current = selectedShark.id
    }
  }, [selectedShark, pings, map])

  return null
}

// ---------------------------------------------------------------------------
// Main SharkMap component
// ---------------------------------------------------------------------------

export default function SharkMap({ pings = [], animals = [], sightings = [], selectedShark, onSharkSelect }) {
  // --- Derive most-recent ping per animal ---------------------------------
  const latestPingByAnimal = useMemo(() => {
    const map = new Map()
    for (const ping of pings) {
      const existing = map.get(ping.animalId)
      if (!existing || new Date(ping.date) > new Date(existing.date)) {
        map.set(ping.animalId, ping)
      }
    }
    return map
  }, [pings])

  // --- Derive track for selected shark (last 20 pings) --------------------
  const selectedSharkTrack = useMemo(() => {
    if (!selectedShark) return null

    const track = pings
      .filter((p) => p.animalId === selectedShark.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-20)
      .map((p) => [p.lat, p.lon])

    return track.length >= 2 ? track : null
  }, [selectedShark, pings])

  // --- Build animal lookup map -------------------------------------------
  const animalById = useMemo(() => {
    const m = new Map()
    for (const animal of animals) {
      m.set(animal.id, animal)
    }
    return m
  }, [animals])

  return (
    <div
      style={{ height: '100%', width: '100%', background: '#050e1a' }}
      className="relative"
    >
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%', background: '#050e1a' }}
        zoomControl
        attributionControl
      >
        {/* Dark basemap */}
        <TileLayer
          url={CARTO_DARK_URL}
          attribution={CARTO_ATTRIBUTION}
          crossOrigin=""
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Map controller — handles flyTo on shark selection */}
        <MapController selectedShark={selectedShark} pings={pings} />

        {/* Selected shark track polyline */}
        {selectedSharkTrack && (
          <Polyline
            positions={selectedSharkTrack}
            pathOptions={{ color: '#f97316', opacity: 0.6, weight: 2 }}
          />
        )}

        {/* OCEARCH orange markers — one per animal, most recent ping only */}
        {Array.from(latestPingByAnimal.entries()).map(([animalId, ping]) => {
          const animal = animalById.get(animalId)
          if (!animal) return null
          return (
            <OcearchMarker
              key={animalId}
              ping={ping}
              animal={animal}
              onSelect={onSharkSelect}
            />
          )
        })}

        {/* iNaturalist blue sighting markers */}
        {sightings.map((sighting) => (
          <SightingMarker key={sighting.id} sighting={sighting} />
        ))}

        {/* Research institution green markers */}
        {RESEARCH_INSTITUTIONS.map((institution) => (
          <CircleMarker
            key={institution.name}
            center={[institution.lat, institution.lon]}
            radius={7}
            pathOptions={{
              fillColor: '#4ade80',
              color: '#16a34a',
              fillOpacity: 0.9,
              weight: 1.5,
            }}
          >
            <Popup>
              <div style={{ minWidth: '180px' }}>
                <p style={{ fontWeight: 700, marginBottom: '2px', fontSize: '13px' }}>
                  {institution.flag} {institution.name}
                </p>
                <p style={{ color: '#6b7280', fontSize: '11px', marginBottom: '4px' }}>
                  {institution.country}
                </p>
                <p style={{ fontSize: '12px', color: '#374151' }}>{institution.description}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
