import { useState, useEffect } from 'react'

const STORAGE_KEY = 'sharkwatch_favourites'
const MAX_FAVOURITES = 5

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function save(names) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names))
  } catch {}
}

/**
 * Manages up to 5 favourite shark names, persisted to localStorage.
 * Favourited sharks are pinned at the top of the left panel.
 */
export function useFavourites() {
  const [favourites, setFavourites] = useState(load)

  useEffect(() => {
    save(favourites)
  }, [favourites])

  function toggleFavourite(sharkName) {
    setFavourites(prev => {
      if (prev.includes(sharkName)) {
        return prev.filter(n => n !== sharkName)
      }
      if (prev.length >= MAX_FAVOURITES) return prev // silently cap at 5
      return [...prev, sharkName]
    })
  }

  function clearFavourites() {
    setFavourites([])
  }

  return {
    favourites,             // string[] of shark names
    toggleFavourite,        // (name: string) => void
    clearFavourites,
    isFavourite: name => favourites.includes(name),
    isFull: favourites.length >= MAX_FAVOURITES,
  }
}
