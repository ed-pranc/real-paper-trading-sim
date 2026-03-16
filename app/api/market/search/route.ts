import { NextResponse } from 'next/server'
import { searchSymbol } from '@/lib/twelvedata/client'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 })

  try {
    const data = await searchSymbol(query)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
