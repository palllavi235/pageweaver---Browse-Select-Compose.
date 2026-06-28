import { gzipSync } from 'node:zlib'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const assetsDir = join(process.cwd(), 'dist', 'assets')

const budgets = [
  { label: 'app shell', match: /^index-.*\.js$/, rawKb: 330, gzipKb: 105 },
  { label: 'React vendor', match: /^react-.*\.js$/, rawKb: 130, gzipKb: 42 },
  { label: 'Motion vendor', match: /^motion-.*\.js$/, rawKb: 155, gzipKb: 52 },
  { label: 'PDF route/vendor', match: /^pdf-.*\.js$/, rawKb: 530, gzipKb: 165 },
  { label: 'PDF.js worker', match: /^pdf\.worker\.min-.*\.mjs$/, rawKb: 1150, gzipKb: 360 },
  { label: 'PDF generation worker', match: /^pdf-generation\.worker-.*\.js$/, rawKb: 500, gzipKb: 185 },
  { label: 'Drag and drop vendor', match: /^dnd-.*\.js$/, rawKb: 70, gzipKb: 24 },
  { label: 'Query/state vendor', match: /^query-.*\.js$/, rawKb: 55, gzipKb: 18 },
  { label: 'Base CSS', match: /^index-.*\.css$/, rawKb: 45, gzipKb: 12 },
]

function bytesToKb(bytes) {
  return bytes / 1024
}

function formatKb(value) {
  return `${value.toFixed(1)} kB`
}

const files = readdirSync(assetsDir)
let failures = 0

for (const budget of budgets) {
  const filename = files
    .filter((file) => budget.match.test(file))
    .sort((a, b) => statSync(join(assetsDir, b)).size - statSync(join(assetsDir, a)).size)[0]
  if (!filename) {
    console.error(`Missing bundle for ${budget.label}`)
    failures += 1
    continue
  }

  const filepath = join(assetsDir, filename)
  const rawKb = bytesToKb(statSync(filepath).size)
  const gzipKb = bytesToKb(gzipSync(readFileSync(filepath)).length)
  const rawPass = rawKb <= budget.rawKb
  const gzipPass = gzipKb <= budget.gzipKb
  const status = rawPass && gzipPass ? 'ok' : 'over'

  console.log(
    `${status.padEnd(4)} ${budget.label.padEnd(22)} raw ${formatKb(rawKb).padStart(9)} / ${formatKb(budget.rawKb).padEnd(9)} gzip ${formatKb(gzipKb).padStart(8)} / ${formatKb(budget.gzipKb)}`,
  )

  if (!rawPass || !gzipPass) failures += 1
}

if (failures > 0) {
  console.error(`Bundle budget failed with ${failures} issue${failures === 1 ? '' : 's'}.`)
  process.exit(1)
}
