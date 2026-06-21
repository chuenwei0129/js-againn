#!/usr/bin/env node
// 记录一次复习：把一行追加到 concepts/<concept>/REVIEW.md
// 用法: node scripts/log.js <concept> [错题号...] [--date YYYY-MM-DD]
// 日期默认取系统今天；可被 --date 覆盖（用于补记或测试）。

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const CONCEPTS = path.join(ROOT, 'concepts')

// ── 解析参数 ──────────────────────────────────────────────
const argv = process.argv.slice(2)
let dateOverride = null
const positional = []
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--date') { dateOverride = argv[++i]; continue }
  positional.push(argv[i])
}
const [concept, ...wrong] = positional

if (!concept) {
  console.error('用法: node scripts/log.js <concept> [错题号...] [--date YYYY-MM-DD]')
  console.error('可用概念: ' + listConcepts().join(', '))
  process.exit(1)
}

const reviewFile = path.join(CONCEPTS, concept, 'REVIEW.md')
if (!fs.existsSync(reviewFile)) {
  console.error(`找不到 ${path.relative(ROOT, reviewFile)}。可用概念: ${listConcepts().join(', ')}`)
  process.exit(1)
}

const today = dateOverride || todayStr()

// ── 读现有记录，算下一次 n ────────────────────────────────
const content = fs.readFileSync(reviewFile, 'utf8')
const rows = parseRows(content)
const nextN = rows.length ? rows[rows.length - 1].n + 1 : 0

// ── 追加新行 ──────────────────────────────────────────────
const wrongCell = wrong.length ? wrong.join(' ') : ''
const noteCell = nextN === 0 ? '首次学习' : ''
const newRow = `| ${nextN} | ${today} | ${wrongCell} | ${noteCell} |`

const updated = content.endsWith('\n') ? content + newRow + '\n' : content + '\n' + newRow + '\n'
fs.writeFileSync(reviewFile, updated)

const interval = intervalForN(nextN)
console.log(`✓ ${concept} 记录第 ${nextN} 次复习（${today}）`)
console.log(`  下次该刷: ${today} + ${interval} 天（n=${nextN} → n=${nextN + 1}）`)
if (wrong.length) console.log(`  错题: ${wrong.join(', ')}`)

// ── helpers ───────────────────────────────────────────────
function listConcepts() {
  return fs.readdirSync(CONCEPTS).filter(d =>
    fs.statSync(path.join(CONCEPTS, d)).isDirectory()
  )
}

function parseRows(text) {
  const lines = text.split('\n')
  const rows = []
  for (const line of lines) {
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
