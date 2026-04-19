import Link from 'next/link'
import { DirectionScore } from '@/components/invest/DirectionScore'
import { PriceChart } from '@/components/invest/PriceChart'
import { NewsTimeline } from '@/components/invest/NewsTimeline'
import { AnalystPanel } from '@/components/invest/AnalystPanel'
import { PeerStrip } from '@/components/invest/PeerStrip'

export default async function SymbolResearchPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params
  const decoded = decodeURIComponent(symbol)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-6">
          <Link href="/invest" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)]">
            ← Back to Invest
          </Link>
          <h1 className="font-lora text-4xl font-semibold tracking-tight mt-2">{decoded}</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Research deep-dive · price, prediction, news, analyst consensus, peers
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] gap-5">
          <div className="space-y-5 min-w-0">
            <PriceChart symbol={decoded} />
            <DirectionScore symbol={decoded} />
            <AnalystPanel symbol={decoded} />
          </div>
          <div className="space-y-5">
            <PeerStrip symbol={decoded} />
            <NewsTimeline symbol={decoded} />
          </div>
        </div>
      </div>
    </div>
  )
}
