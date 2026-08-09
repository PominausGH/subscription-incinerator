import { RawTransaction } from './types'
import { ERRORS } from './errors'

// ---------------------------------------------------------------------------
// Date parsing — handles AU/US/ISO formats
// ---------------------------------------------------------------------------
const MONTHS: Record<string, string> = {
  jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
  jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'
}

function expandYear(y: string): string {
  if (y.length === 4) return y
  const n = parseInt(y)
  return n >= 50 ? `19${y.padStart(2,'0')}` : `20${y.padStart(2,'0')}`
}

function parseDate(raw: string): string | null {
  const s = raw.trim().replace(/"/g, '')
  if (!s) return null

  // ISO: 2024-03-15
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // DD/MM/YYYY or DD-MM-YYYY or DD/MM/YY
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (m) {
    const [, d, mo, y] = m
    return `${expandYear(y)}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // DD MMM YYYY or DD-MMM-YYYY or DD MMM YY (e.g. 17 Jun 25)
  m = s.match(/^(\d{1,2})[\s\-]([A-Za-z]{3})[\s\-](\d{2,4})$/)
  if (m) {
    const mo = MONTHS[m[2].toLowerCase()]
    if (mo) return `${expandYear(m[3])}-${mo}-${m[1].padStart(2, '0')}`
  }

  // MMM DD, YYYY
  m = s.match(/^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{2,4})$/)
  if (m) {
    const mo = MONTHS[m[1].toLowerCase()]
    if (mo) return `${expandYear(m[3])}-${mo}-${m[2].padStart(2, '0')}`
  }

  return null
}

function parseAmount(raw: string): number | null {
  const s = raw.trim().replace(/"/g, '').replace(/,/g, '').replace(/\$/g, '').trim()
  if (!s) return null
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Delimiter detection + line splitter
// ---------------------------------------------------------------------------
function detectDelimiter(lines: string[]): string {
  const sample = lines.slice(0, 5).join('\n')
  const tabs = (sample.match(/\t/g) || []).length
  const commas = (sample.match(/,/g) || []).length
  const semis = (sample.match(/;/g) || []).length
  if (tabs > commas && tabs > semis) return '\t'
  if (semis > commas) return ';'
  return ','
}

function splitLine(line: string, delimiter: string): string[] {
  if (delimiter === '\t') {
    return line.split('\t').map(s => s.trim().replace(/^"|"$/g, ''))
  }
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''))
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''))
  return result
}

// ---------------------------------------------------------------------------
// Column detection heuristics
// ---------------------------------------------------------------------------
type ColMap = {
  date: number
  description: number
  amount: number | null
  debit: number | null
  credit: number | null
  balance: number | null
}

const DATE_HEADERS = ['date', 'transaction date', 'txn date', 'posted date', 'value date', 'effective date']
const DESC_HEADERS = ['description', 'narration', 'details', 'memo', 'reference', 'particulars', 'transaction details', 'payee', 'narrative', 'transaction description', 'merchant name', 'transaction']
const AMOUNT_HEADERS = ['amount', 'transaction amount', 'net amount', 'value']
const DEBIT_HEADERS = ['debit', 'debit amount', 'withdrawals', 'withdrawal', 'dr']
const CREDIT_HEADERS = ['credit', 'credit amount', 'deposits', 'deposit', 'cr']
const BALANCE_HEADERS = ['balance', 'closing balance', 'running balance', 'available balance']

function detectColumns(headers: string[]): ColMap | null {
  const h = headers.map(h => h.toLowerCase().trim())

  const find = (names: string[]) => {
    for (const name of names) {
      const i = h.indexOf(name)
      if (i !== -1) return i
    }
    for (const name of names) {
      const i = h.findIndex(col => col.includes(name))
      if (i !== -1) return i
    }
    return -1
  }

  const dateCol = find(DATE_HEADERS)
  const descCol = find(DESC_HEADERS)
  const amountCol = find(AMOUNT_HEADERS)
  const debitCol = find(DEBIT_HEADERS)
  const creditCol = find(CREDIT_HEADERS)
  const balanceCol = find(BALANCE_HEADERS)

  if (dateCol === -1 || descCol === -1) return null
  if (amountCol === -1 && debitCol === -1 && creditCol === -1) return null

  return {
    date: dateCol,
    description: descCol,
    amount: amountCol !== -1 ? amountCol : null,
    debit: debitCol !== -1 ? debitCol : null,
    credit: creditCol !== -1 ? creditCol : null,
    balance: balanceCol !== -1 ? balanceCol : null,
  }
}

// Fallback: guess columns positionally for headerless CSVs (CommBank style)
function guessColumnsFromData(rows: string[][]): ColMap | null {
  const sample = rows.slice(0, 10).filter(r => r.length >= 3)
  if (sample.length === 0) return null

  let dateCol = -1
  for (let c = 0; c < Math.min(sample[0].length, 5); c++) {
    const hits = sample.filter(r => parseDate(r[c]) !== null).length
    if (hits >= sample.length * 0.6) { dateCol = c; break }
  }
  if (dateCol === -1) return null

  let amountCol = -1
  for (let c = 0; c < sample[0].length; c++) {
    if (c === dateCol) continue
    const vals = sample.map(r => r[c] ? parseAmount(r[c]) : null).filter(v => v !== null)
    if (vals.length >= sample.length * 0.6) { amountCol = c; break }
  }
  if (amountCol === -1) return null

  let descCol = -1
  for (let c = 0; c < sample[0].length; c++) {
    if (c === dateCol || c === amountCol) continue
    const vals = sample.map(r => r[c] || '').filter(v => v.length > 2 && parseAmount(v) === null)
    if (vals.length >= sample.length * 0.5) { descCol = c; break }
  }
  if (descCol === -1) return null

  let balanceCol: number | null = null
  for (let c = sample[0].length - 1; c >= 0; c--) {
    if (c === dateCol || c === amountCol || c === descCol) continue
    const vals = sample.map(r => r[c] ? parseAmount(r[c]) : null).filter(v => v !== null)
    if (vals.length >= sample.length * 0.5) { balanceCol = c; break }
  }

  return { date: dateCol, description: descCol, amount: amountCol, debit: null, credit: null, balance: balanceCol }
}

// ---------------------------------------------------------------------------
// Main parser (no AI required)
// ---------------------------------------------------------------------------
export async function parseCSVWithAI(content: string): Promise<RawTransaction[]> {
  if (!content || content.trim().length === 0) throw ERRORS.EMPTY_FILE

  const lines = content
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)

  if (lines.length < 2) throw ERRORS.NO_TRANSACTIONS

  const delimiter = detectDelimiter(lines)
  const allRows = lines.map(l => splitLine(l, delimiter))

  let colMap: ColMap | null = null
  let dataStartIdx = 0

  for (let i = 0; i < Math.min(10, allRows.length); i++) {
    colMap = detectColumns(allRows[i])
    if (colMap) { dataStartIdx = i + 1; break }
  }

  if (!colMap) {
    colMap = guessColumnsFromData(allRows)
    dataStartIdx = 0
  }

  if (!colMap) throw ERRORS.AI_PARSE_FAILED

  const transactions: RawTransaction[] = []

  for (let i = dataStartIdx; i < allRows.length; i++) {
    const row = allRows[i]
    if (row.length < 2) continue

    const dateStr = parseDate(row[colMap.date] || '')
    if (!dateStr) continue

    const description = (row[colMap.description] || '').trim()
    if (!description) continue

    let amount: number | null = null

    if (colMap.amount !== null) {
      amount = parseAmount(row[colMap.amount] || '')
    } else if (colMap.debit !== null || colMap.credit !== null) {
      const debit = colMap.debit !== null ? parseAmount(row[colMap.debit] || '') : null
      const credit = colMap.credit !== null ? parseAmount(row[colMap.credit] || '') : null
      if (debit !== null && debit !== 0) amount = -Math.abs(debit)
      else if (credit !== null && credit !== 0) amount = Math.abs(credit)
    }

    if (amount === null) continue

    const balance = colMap.balance !== null ? parseAmount(row[colMap.balance] || '') ?? undefined : undefined

    transactions.push({ date: dateStr, description, amount, balance })
  }

  return transactions
}
