// ================================================================
// Bank-statement parsing — CSV + text-based PDF
// ================================================================
// Run server-side only. pdfjs-dist is dynamically imported to keep it
// out of the client bundle (1.5 MB).
//
// Output rows are paired 1:1 with original source rows so the UI can
// preview + let the user edit low-confidence entries.

import type { ParsedTransactionPreview } from '@/types'

const DATE_FORMATS = [
  /^(\d{4})-(\d{2})-(\d{2})$/,              // ISO
  /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/,       // US mm/dd/yyyy
  /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/,         // mm-dd-yyyy
  /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/,       // dd.mm.yyyy
]

export interface ParseOutcome {
  transactions: ParsedTransactionPreview[]
  warnings: string[]
}

function normalizeYear(y: string): number {
  const n = parseInt(y, 10)
  if (n < 100) return n < 70 ? 2000 + n : 1900 + n
  return n
}

/** Try each format; return ISO date or null. Probes for impossible months
 *  (>12) to disambiguate MM/DD vs DD/MM. */
function tryParseDate(raw: string): { iso: string; confidence: number } | null {
  const s = raw.trim()
  if (!s) return null
  const iso = s.match(DATE_FORMATS[0])
  if (iso) return { iso: `${iso[1]}-${iso[2]}-${iso[3]}`, confidence: 0.98 }

  for (let i = 1; i < DATE_FORMATS.length; i++) {
    const m = s.match(DATE_FORMATS[i])
    if (!m) continue
    const a = parseInt(m[1], 10)
    const b = parseInt(m[2], 10)
    const y = normalizeYear(m[3])
    let month: number, day: number, confidence = 0.85
    if (a > 12 && b <= 12) {
      day = a; month = b; confidence = 0.92 // unambiguously DD/MM
    } else if (b > 12 && a <= 12) {
      month = a; day = b; confidence = 0.92
    } else {
      // Both plausible — assume MM/DD (US default)
      month = a; day = b; confidence = 0.75
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) return null
    const mm = String(month).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    return { iso: `${y}-${mm}-${dd}`, confidence }
  }

  // JS Date fallback for natural-language dates like "Mar 12, 2026"
  const d = new Date(s)
  if (!isNaN(d.getTime())) {
    return { iso: d.toISOString().slice(0, 10), confidence: 0.7 }
  }
  return null
}

function parseAmount(raw: string): { value: number; confidence: number } | null {
  if (!raw) return null
  const cleaned = raw.replace(/[,$\s]/g, '').replace(/[()]/g, (m) => m === '(' ? '-' : '')
  const n = parseFloat(cleaned)
  if (isNaN(n)) return null
  return { value: n, confidence: 0.95 }
}

// ---------------- CSV ----------------

function detectColumns(rows: string[][]): {
  dateIdx: number
  amountIdx: number
  descIdx: number
  headerIdx: number
} | null {
  // Scan the first 8 rows for a header that contains "date" + "amount"/"debit"
  for (let hIdx = 0; hIdx < Math.min(8, rows.length); hIdx++) {
    const header = rows[hIdx].map((c) => c.trim().toLowerCase())
    const dateIdx = header.findIndex((h) =>
      h === 'date' || h === 'transaction date' || h === 'posting date' || h === 'posted date',
    )
    const amountIdx = header.findIndex((h) =>
      h === 'amount' || h === 'debit' || h === 'amount (usd)' || h === 'transaction amount',
    )
    const descIdx = header.findIndex((h) =>
      h === 'description' || h === 'merchant' || h === 'details' || h === 'memo' || h === 'name',
    )
    if (dateIdx >= 0 && amountIdx >= 0 && descIdx >= 0) {
      return { dateIdx, amountIdx, descIdx, headerIdx: hIdx }
    }
  }
  return null
}

export async function parseCSV(text: string): Promise<ParseOutcome> {
  // Defer the import — papaparse needs no setup but keeps bundle clean.
  const Papa = (await import('papaparse')).default
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true })
  const rows = parsed.data as string[][]
  const warnings: string[] = []
  if (!rows.length) return { transactions: [], warnings: ['CSV appears empty'] }

  const cols = detectColumns(rows)
  if (!cols) {
    warnings.push('Could not detect date/amount/description columns. Expected headers like "Date", "Amount", "Description".')
    return { transactions: [], warnings }
  }

  const out: ParsedTransactionPreview[] = []
  for (let i = cols.headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    const rawDate = row[cols.dateIdx] ?? ''
    const rawAmount = row[cols.amountIdx] ?? ''
    const rawDesc = row[cols.descIdx] ?? ''
    if (!rawDate && !rawAmount && !rawDesc) continue

    const date = tryParseDate(rawDate)
    const amount = parseAmount(rawAmount)
    if (!date || !amount) {
      warnings.push(`Skipped row ${i + 1}: unable to parse date or amount (date="${rawDate}", amount="${rawAmount}")`)
      continue
    }

    // CSV convention: positive = debit (spending). Some exporters use negative
    // for debits. We treat the UPLOADED tx as user's outflow when amount > 0.
    // If everything is negative, the UI can flip sign on preview.
    const absAmount = Math.abs(amount.value)

    // Downward-confidence if the value looks suspicious (zero, >$1e5, etc.)
    let confidence = Math.min(date.confidence, amount.confidence)
    if (absAmount === 0 || absAmount > 100000) confidence *= 0.6

    out.push({
      date: date.iso,
      amount: absAmount,
      merchant: rawDesc.trim(),
      description: rawDesc.trim(),
      confidence,
      needsReview: confidence < 0.8,
    })
  }

  if (out.length === 0 && warnings.length === 0) {
    warnings.push('Parsed 0 transactions. Check date/amount column headers.')
  }
  return { transactions: out, warnings }
}

// ---------------- PDF (text-based) ----------------

/** Regex for lines like "03/15/2026   STARBUCKS STORE #123  $4.85"
 *  Dollar signs, en/em dashes, and spaces are all tolerated.
 *  Group 1 = date, 2 = description, 3 = amount. */
const PDF_ROW_REGEX =
  /^(\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4})\s+(.*?)\s+\$?(-?[\d,]+\.\d{2})\s*$/

export async function parsePDF(
  buffer: ArrayBuffer,
): Promise<ParseOutcome> {
  const warnings: string[] = []
  // Dynamic import keeps pdfjs out of the edge / client bundle.
  const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as typeof import('pdfjs-dist')
  // Server-side: point the worker at the real filesystem path as a file:// URL.
  // Client-side (if ever used): '/pdf-worker.mjs' would be correct — not needed here.
  const path = await import('node:path')
  const url = await import('node:url')
  const workerPath = path.join(process.cwd(), 'public', 'pdf-worker.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = url.pathToFileURL(workerPath).href

  let doc
  try {
    doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise
  } catch (err) {
    warnings.push(`Failed to open PDF: ${err instanceof Error ? err.message : String(err)}`)
    return { transactions: [], warnings }
  }

  const lines: string[] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((it: unknown) => {
        // TextItem has a 'str' field; TextMarkedContent does not.
        if (it && typeof it === 'object' && 'str' in it) {
          const s = (it as { str?: unknown }).str
          return typeof s === 'string' ? s : ''
        }
        return ''
      })
      .join(' ')
    lines.push(...pageText.split(/\n|\s{4,}/))
  }

  const out: ParsedTransactionPreview[] = []
  for (const ln of lines) {
    const m = ln.match(PDF_ROW_REGEX)
    if (!m) continue
    const date = tryParseDate(m[1])
    const amount = parseAmount(m[3])
    if (!date || !amount) continue
    const absAmount = Math.abs(amount.value)
    if (absAmount === 0) continue
    const conf = Math.min(date.confidence, amount.confidence, 0.85) // PDF baseline is a bit lower
    out.push({
      date: date.iso,
      amount: absAmount,
      merchant: m[2].trim(),
      description: m[2].trim(),
      confidence: conf,
      needsReview: conf < 0.8,
    })
  }

  if (out.length === 0) {
    warnings.push('Parsed 0 transaction rows from this PDF. If it\'s a scanned image, use CSV or upload receipts individually.')
  }
  return { transactions: out, warnings }
}
