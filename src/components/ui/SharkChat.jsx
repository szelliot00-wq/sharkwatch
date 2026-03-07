import React, { useState, useRef, useEffect, useCallback } from 'react'
import { getSharkChatResponse } from '../../utils/gemini'

const WELCOME =
  "Hi! I'm your shark expert. Ask me anything about sharks — biology, species, behaviour, conservation, or research. What would you like to know? 🦈"

export function SharkChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([{ role: 'model', text: WELCOME }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  // Escape key closes the panel
  useEffect(() => {
    if (!isOpen) return
    function handle(e) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [isOpen])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    const userMsg = { role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Build conversation history for Gemini — exclude the static welcome message
    const history = messages
      .filter(m => m.text !== WELCOME)
      .map(m => ({ role: m.role, text: m.text }))

    const response = await getSharkChatResponse(text, history)

    setMessages(prev => [
      ...prev,
      {
        role: 'model',
        text:
          response ||
          "Sorry, I couldn't reach the shark brain right now. Try again! 🦈",
      },
    ])
    setLoading(false)
  }, [input, loading, messages])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearChat() {
    setMessages([{ role: 'model', text: WELCOME }])
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="fixed z-[1000] flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
        style={{
          bottom: 20,
          right: 20,
          width: 52,
          height: 52,
          background: '#f97316',
          fontSize: 24,
        }}
        aria-label={isOpen ? 'Close shark chat' : 'Ask a shark question'}
        title="Ask a Shark Question"
      >
        {isOpen ? '×' : '🦈'}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed z-[999] flex flex-col rounded-xl shadow-2xl overflow-hidden"
          style={{
            bottom: 82,
            right: 20,
            width: 340,
            height: 480,
            background: '#0a1f35',
            border: '1px solid #1a4a7a',
          }}
          role="dialog"
          aria-label="Ask a Shark Question"
          aria-modal="false"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3 py-2 flex-shrink-0"
            style={{ background: '#050e1a', borderBottom: '1px solid #1a4a7a' }}
          >
            <span className="text-sm font-semibold text-white">
              🦈 Ask a Shark Question
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="text-[10px] text-slate-400 hover:text-white transition-colors px-1.5 py-0.5 rounded"
                style={{ background: '#1a4a7a' }}
                title="Clear conversation"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-lg leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>

          {/* Message history */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%] px-3 py-2 text-xs leading-relaxed"
                  style={{
                    background: msg.role === 'user' ? '#f97316' : '#0d2847',
                    color: msg.role === 'user' ? 'white' : '#e2e8f0',
                    borderRadius:
                      msg.role === 'user'
                        ? '12px 12px 2px 12px'
                        : '12px 12px 12px 2px',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="px-3 py-2 text-xs text-slate-400 italic"
                  style={{
                    background: '#0d2847',
                    borderRadius: '12px 12px 12px 2px',
                  }}
                >
                  🦈 thinking…
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input row */}
          <div
            className="flex items-center gap-2 p-2 flex-shrink-0"
            style={{ borderTop: '1px solid #1a4a7a', background: '#050e1a' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={200}
              placeholder="Ask about sharks…"
              className="flex-1 text-xs px-3 py-2 rounded-lg outline-none disabled:opacity-50"
              style={{
                background: '#0d2847',
                border: '1px solid #1a4a7a',
                color: 'white',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
              style={{ background: '#f97316', color: 'white' }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  )
}
