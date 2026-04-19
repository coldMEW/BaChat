// POST /api/dashboard/extract
// Body: { kind: 'csv' | 'pdf' | 'image', payload: string }
//   - csv: raw CSV text
//   - pdf: base64-encoded PDF bytes
//   - image: base64-encoded image (JPG/PNG/WEBP)
// Returns: ApiEnvelope<ExtractResult>

import { NextRequest, NextResponse } from 'next/server'
import { parseCSV, parsePDF } from '@/lib/dashboard/statement-parser'
import { ocrReceipt } from '@/lib/dashboard/receipt-ocr'
import { categorizeDescriptions } from '@/lib/dashboard/categorize'
import type { ApiEnvelope, ExtractKind, ExtractResult, ParsedTransactionPreview } from '@/types'

export const runtime = 'nodejs'   // pdfjs-dist needs Node APIs
export const maxDuration = 30     // OCR + parsing can take a bit

interface ExtractBody {
  kind: ExtractKind
  payload: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExtractBody
    if (!body?.kind || typeof body.payload !== 'string') {
      return NextResponse.json<ApiEnvelope<ExtractResult>>(
        { data: null, error: 'Missing "kind" or "payload"', cached: false, fetchedAt: Date.now() },
        { status: 400 },
      )
    }

    let transactions: ParsedTransactionPreview[] = []
    const warnings: string[] = []

    switch (body.kind) {
      case 'csv': {
        const out = await parseCSV(body.payload)
        transactions = out.transactions
        warnings.push(...out.warnings)
        break
      }
      case 'pdf': {
        // Accept both "data:application/pdf;base64,XXX" and raw base64
        const b64 = body.payload.replace(/^data:[^;]+;base64,/, '')
        const buffer = Buffer.from(b64, 'base64')
        const out = await parsePDF(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer)
        transactions = out.transactions
        warnings.push(...out.warnings)
        break
      }
      case 'image': {
        const b64 = body.payload.replace(/^data:[^;]+;base64,/, '')
        const outcome = await ocrReceipt(b64)
        if (!outcome.ok) {
          warnings.push(outcome.reason ?? 'OCR failed')
        } else if (outcome.transaction) {
          transactions = [outcome.transaction]
        }
        break
      }
      default:
        return NextResponse.json<ApiEnvelope<ExtractResult>>(
          { data: null, error: `Unknown kind: ${body.kind}`, cached: false, fetchedAt: Date.now() },
          { status: 400 },
        )
    }

    // Tier-1 categorization (deterministic; no Claude calls on this path).
    if (transactions.length > 0) {
      const cats = await categorizeDescriptions(transactions.map((t) => t.description), { useLLM: false })
      transactions = transactions.map((t, i) => ({
        ...t,
        merchant: cats[i]?.merchant ?? t.merchant,
      }))
    }

    const result: ExtractResult = {
      kind: body.kind,
      transactions,
      warnings,
    }
    return NextResponse.json<ApiEnvelope<ExtractResult>>({
      data: result,
      error: null,
      cached: false,
      fetchedAt: Date.now(),
    })
  } catch (err) {
    return NextResponse.json<ApiEnvelope<ExtractResult>>(
      { data: null, error: err instanceof Error ? err.message : String(err), cached: false, fetchedAt: Date.now() },
      { status: 502 },
    )
  }
}
