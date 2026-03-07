import React, { useState } from 'react'
import { useYouTube } from '../../hooks/useYouTube'

function VideoModal({ videoId, title, onClose }) {
  // Close on Escape key
  React.useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(5,14,26,0.95)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="aspect-video w-full rounded-lg overflow-hidden" style={{ background: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-2xl hover:text-[#f97316]"
          aria-label="Close video"
        >
          ×
        </button>
      </div>
    </div>
  )
}

function VideoCard({ item, onClick }) {
  const thumbnail = item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url
  const title = item.snippet?.title || 'Untitled'
  const channelName = item.snippet?.channelTitle || ''
  const publishedAt = item.snippet?.publishedAt?.slice(0, 10) || ''

  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-lg overflow-hidden hover:ring-2 transition-all text-left"
      style={{ background: '#0d2847', ringColor: '#f97316' }}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <span className="text-4xl">▶️</span>
        </div>
      </div>
      <div className="p-2">
        <p className="text-xs font-medium text-white leading-snug line-clamp-2">{title}</p>
        <p className="text-[10px] text-slate-400 mt-1">{channelName} · {publishedAt}</p>
      </div>
    </button>
  )
}

export function YouTubeTab() {
  const { videos, loading, error } = useYouTube()
  const [activeVideo, setActiveVideo] = useState(null)

  if (loading) {
    return (
      <div className="p-4 grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden" style={{ background: '#0d2847' }}>
            <div className="aspect-video bg-[#1a4a7a] animate-pulse" />
            <div className="p-2 space-y-2">
              <div className="h-3 bg-[#1a4a7a] animate-pulse rounded" />
              <div className="h-2 bg-[#1a4a7a] animate-pulse rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-slate-500 text-sm text-center px-4">{error}</p>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-slate-500 text-sm">No videos found — check back later</p>
      </div>
    )
  }

  return (
    <>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {videos.map(item => (
            <VideoCard
              key={item.id?.videoId}
              item={item}
              onClick={() => setActiveVideo(item)}
            />
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-3 text-center">
          Showing recent shark encounters · Filtered for positive content · {videos.length} videos
        </p>
      </div>

      {activeVideo && (
        <VideoModal
          videoId={activeVideo.id?.videoId}
          title={activeVideo.snippet?.title}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </>
  )
}
