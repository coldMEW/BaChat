// Finnhub company news + Claude sentiment classification.
// Cache: 2h disk-backed fs-cache.

import { NextRequest, NextResponse } from 'next/server'
import { fetchCompanyNews } from '@/lib/invest/finnhub'
import { attachSentiment, classifyHeadlines } from '@/lib/invest/sentiment'
import { CACHE_TTL, cacheGet, cacheSet } from '@/lib/invest/fs-cache'
import type { ApiEnvelope, NewsArticle } from '@/types'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const url = new URL(req.url)
  const days = parseInt(url.searchParams.get('days') ?? '14', 10)
  const withSentiment = url.searchParams.get('sentiment') !== 'false'
  const key = `${symbol}:${days}:${withSentiment ? '1' : '0'}`

  const cached = await cacheGet<NewsArticle[]>('news', key)
  if (cached) {
    return NextResponse.json<ApiEnvelope<NewsArticle[]>>({
      data: cached.data,
      error: null,
      cached: true,
      fetchedAt: cached.fetchedAt,
    })
  }

  try {
    const toDate = new Date().toISOString().slice(0, 10)
    const fromDate = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString().slice(0, 10)
    const raw = await fetchCompanyNews(symbol, fromDate, toDate)
    const capped = raw.slice(0, 80)

    let articles: NewsArticle[] = capped
    if (withSentiment && capped.length > 0) {
      const classificationResult = await classifyHeadlines(capped, symbol)
      articles = attachSentiment(capped, classificationResult.classified)
    }

    await cacheSet('news', key, articles, CACHE_TTL.news)
    return NextResponse.json<ApiEnvelope<NewsArticle[]>>({
      data: articles,
      error: null,
      cached: false,
      fetchedAt: Date.now(),
    })
  } catch (err) {
    return NextResponse.json<ApiEnvelope<NewsArticle[]>>(
      { data: null, error: err instanceof Error ? err.message : String(err), cached: false, fetchedAt: Date.now() },
      { status: 502 },
    )
  }
}
