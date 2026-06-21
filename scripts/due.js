#!/usr/bin/env node
// 打印今天该复习的概念清单。
// 用法: node scripts/due.js [--date YYYY-MM-DD]
// 日期默认取系统今天；可被 --date 覆盖（用于测试调度）。

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const CONCEPTS = path.join(ROOT, 'concepts')

const argv = process.argv.slice(2)
let today = null
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--date') { today = argv[++i]; continue }
}
today = today || todayStr()

const concepts = fs.readdirSync(CONCEPTS).filter(d =>
  fs.statSync(path.join(CONCEPTS, d)).isDirectory()
)

const due = []
const upcoming = []
const untouched = []

for (const concept of concepts) {
  const reviewFile = path.join(CONCEPTS, concept, 'REVIEW.md')
  if (!fs.existsSync(reviewFile)) { untouched.push(concept); continue }

  const rows = parseRows(fs.readFileSync(reviewFile, 'utf8'))
  if (!rows.length) { untouched.push(concept); continue }

  const last = rows[rows.length - 1]
  const nextN = last.n + 1
  const interval = intervalForN(last.n)        // 用「上次的 n」算这次该隔多久
  const dueDate = addDays(last.date, interval)
  const daysLeft = diffDays(today, dueDate)

  if (daysLeft <= 0) {
    due.push({ concept, last: last.date, nextN, daysLate: -daysLeft })
  } else {
    upcoming.push({ concept, last: last.date, dueDate, daysLeft })
  }
}

// ── 输出 ──────────────────────────────────────────────────
console.log(`今天 ${today} 的复习清单\n`)

if (due.length) {
  console.log('🔴 今天该刷（已到期）:')
  for (const d of due) {
    const lag = d.daysLate > 0 ? `（逾期 ${d.daysLate} 天）` : ''
    console.log(`  ${d.concept.padEnd(12)} 上次 ${d.last} → 第 ${d.nextN} 次 ${lag}`)
  }
} else {
  console.log('✅ 今天没有到期的概念')
}

if (untouched.length) {
  console.log('\n⬜ 从未记录（首次学习后跑 log.js 记录）:')
  for (const c of untouched) console.log(`  ${c}`)
}

if (upcoming.length) {
  upcoming.sort((a, b) => a.daysLeft - b.daysLeft)
  console.log('\n📅 即将到期:')
  for (const u of upcoming) {
    console.log(`  ${u.concept.padEnd(12)} ${u.dueDate}（还有 ${u.daysLeft} 天）`)
  }
}

// ── helpers ───────────────────────────────────────────────
function parseRows(text) {
  const rows = []
  for (const line of text.split('\n')) {
    const m = line.match(/^\|\s*(\d+)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|/)
    if (m) rows.push({ n: Number(m[1]), date: m[2] })
  }
  return rows
}

function intervalForN(n) {
  if (n === 0) return 1
  if (n === 1) return 3
  if (n === 2) return 7
  if (n === 3) return 14
  return 30
}

function todayStr() {
  return execSync('date +%Y-%m-%d').toString().trim()
}

// 日期算术用「天数差」即可，避免 new Date()。
function toOrdinal(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  // Gregorian 序日（简化版，m/d 从 1 月起）
  const a = Math.floor((14 - m) / 12)
  const yy = y + 4800 - a
  const mm = m + 12 * a - 3
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045
}

function fromOrdinal(jdn) {
  const a = jdn + 32044
  const b = Math.floor((4 * a + 3) / 146097)
  const c = a - Math.floor((146097 * b) / 4)
  const dd = Math.floor((4 * c + 3) / 1461)
  const e = c - Math.floor((1461 * dd) / 4)
  const mm = Math.floor((5 * e + 2) / 153)
  const day = e - Math.floor((153 * mm + 2) / 5) + 1
  const month = mm + 3 - 12 * Math.floor(mm / 10)
  const year = 100 * b + dd - 4800 + Math.floor(mm / 10)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function addDays(ymd, days) { return fromOrdinal(toOrdinal(ymd) + days) }
function diffDays(a, b) { return toOrdinal(b) - toOrdinal(a) }
