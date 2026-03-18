'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLinkIcon } from 'lucide-react'

interface NewsArticle {
  title: string
  url: string
  source: string
  published_at: string
  snippet: string
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function StockNews({ symbol, simulationDate }: { symbol: string; simulationDate: string | null }) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ symbol })
        if (simulationDate) params.set('date', simulationDate)
        const res = await fetch(`/api/market/news?${params}`)
        const data = await res.json()
        if (!cancelled) setArticles(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setArticles([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [symbol, simulationDate])

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-4">Latest News</p>
      {loading ? (
        <div className="px-4 space-y-3 py-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <p className="px-4 text-sm text-muted-foreground py-2">No recent news found.</p>
      ) : (
        <ScrollArea className="max-h-64">
          {articles.map((a, i) => (
            <div key={i}>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">{a.source}</Badge>
                    <span className="text-[11px] text-muted-foreground shrink-0">{relativeTime(a.published_at)}</span>
                  </div>
                  <p className="text-sm leading-snug text-foreground group-hover:text-primary line-clamp-2">{a.title}</p>
                </div>
                <ExternalLinkIcon className="size-3.5 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              {i < articles.length - 1 && <Separator className="mx-4" />}
            </div>
          ))}
        </ScrollArea>
      )}
    </div>
  )
}
