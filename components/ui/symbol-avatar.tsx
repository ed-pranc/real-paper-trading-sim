'use client'

import { useState, useEffect } from 'react'

interface SymbolAvatarProps {
  symbol: string
  size?: number   // px, default 36
  className?: string
}

/** In-module cache: symbol → resolved logo URL (or '' if all sources failed) */
const logoCache = new Map<string, string>()

/** Deterministic fallback color per symbol */
function symbolColor(s: string) {
  const palette = [
    'bg-blue-600', 'bg-violet-600', 'bg-amber-600',
    'bg-emerald-600', 'bg-rose-600', 'bg-cyan-600', 'bg-orange-600',
  ]
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

/**
 * Resolves logo URL using Parqet CDN (free, no API key, good ETF + stock coverage).
 * Falls back to '' if the image fails to load, which triggers the colored-initials fallback.
 */
async function resolveLogoUrl(symbol: string): Promise<string> {
  const url = `https://assets.parqet.com/logos/symbol/${symbol}`
  const ok = await new Promise<boolean>(resolve => {
    const img = new window.Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
  return ok ? url : ''
}

export function SymbolAvatar({ symbol, size = 36, className = '' }: SymbolAvatarProps) {
  const cached = logoCache.get(symbol)
  const [logoUrl, setLogoUrl] = useState<string>(cached ?? '')
  const [resolved, setResolved] = useState(cached !== undefined)

  useEffect(() => {
    if (logoCache.has(symbol)) {
      setLogoUrl(logoCache.get(symbol)!)
      setResolved(true)
      return
    }
    let cancelled = false
    resolveLogoUrl(symbol).then(url => {
      logoCache.set(symbol, url)
      if (!cancelled) {
        setLogoUrl(url)
        setResolved(true)
      }
    })
    return () => { cancelled = true }
  }, [symbol])

  const px = size

  if (resolved && logoUrl) {
    return (
      <div
        className={`rounded-full overflow-hidden bg-white shrink-0 flex items-center justify-center border border-border ${className}`}
        style={{ width: px, height: px }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={symbol}
          width={px}
          height={px}
          className="object-contain w-full h-full"
          onError={() => {
            logoCache.set(symbol, '')
            setLogoUrl('')
          }}
        />
      </div>
    )
  }

  // Fallback: colored circle with initials
  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center text-white font-bold ${symbolColor(symbol)} ${className}`}
      style={{ width: px, height: px, fontSize: Math.round(px * 0.33) }}
    >
      {symbol.slice(0, 2)}
    </div>
  )
}
