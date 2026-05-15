import React, { useState, useRef } from 'react'

const GAME_URL = 'http://192.168.71.250:5175'

export function BiminiRunTab() {
  const [fullscreen, setFullscreen] = useState(false)
  const [offline, setOffline] = useState(false)
  const iframeRef = useRef(null)

  function handleLoad() {
    setOffline(false)
  }

  function handleError() {
    setOffline(true)
  }

  function toggleFullscreen() {
    const el = iframeRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.()
      setFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setFullscreen(false)
    }
  }

  return (
    <div className="relative flex flex-col" style={{ background: '#020b18', minHeight: 400 }}>
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-3 py-2 flex-shrink-0"
        style={{ background: '#05172e', borderBottom: '1px solid #0a2a4a' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🦈</span>
          <div>
            <div className="text-xs font-bold text-yellow-300" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9 }}>
              LEMON SHARK
            </div>
            <div className="text-xs text-cyan-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7 }}>
              BIMINI RUN
            </div>
          </div>
        </div>
        <button
          onClick={toggleFullscreen}
          className="text-slate-400 hover:text-white transition-colors text-sm px-2 py-1 rounded"
          style={{ background: '#0a2a4a', border: '1px solid #1a4a7a', fontSize: 11 }}
          title="Fullscreen"
        >
          ⛶ Fullscreen
        </button>
      </div>

      {/* Controls hint */}
      <div
        className="flex items-center justify-center gap-6 px-3 py-1.5 flex-shrink-0 flex-wrap"
        style={{ background: '#05172e', borderBottom: '1px solid #0a2a4a', fontSize: 9, fontFamily: '"Press Start 2P", monospace' }}
      >
        <span className="text-cyan-600">⬆ W &nbsp;move up</span>
        <span className="text-cyan-600">⬇ S &nbsp;move down</span>
        <span className="text-slate-500">SPACE &nbsp;pause</span>
        <span className="text-slate-500">📱 tap top/bottom half</span>
      </div>

      {/* Game iframe or offline message */}
      <div className="relative flex-1" style={{ minHeight: 360 }}>
        {offline ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{ background: '#020b18' }}
          >
            <div className="text-4xl animate-bounce">🦈</div>
            <p
              className="text-center text-cyan-400 px-6"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, lineHeight: 2 }}
            >
              Start the Bimini Run server<br />on your MacBook to play
            </p>
            <p className="text-slate-500 text-xs text-center">
              Run: <code className="text-cyan-600">npm run dev</code> in the sharkgame folder
            </p>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={GAME_URL}
            title="Lemon Shark: Bimini Run"
            width="100%"
            height="600"
            frameBorder="0"
            allow="fullscreen"
            style={{ display: 'block', background: '#020b18' }}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    </div>
  )
}
