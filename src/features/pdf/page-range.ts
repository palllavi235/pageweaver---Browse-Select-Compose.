export type PageRangeResult =
  | { valid: true; pages: number[] }
  | { valid: false; pages: []; message: string }

export function parsePageRange(input: string, pageCount: number): PageRangeResult {
  if (!input.trim()) return { valid: true, pages: [] }
  const pages = new Set<number>()
  const tokens = input.split(',').map((token) => token.trim()).filter(Boolean)

  for (const token of tokens) {
    const match = token.match(/^(\d+)(?:\s*-\s*(\d+))?$/)
    if (!match) return { valid: false, pages: [], message: `“${token}” is not a valid page or range.` }
    const first = Number(match[1])
    const second = match[2] ? Number(match[2]) : first
    if (first < 1 || second < 1 || first > pageCount || second > pageCount) {
      return { valid: false, pages: [], message: `Pages must be between 1 and ${pageCount}.` }
    }
    const start = Math.min(first, second)
    const end = Math.max(first, second)
    for (let page = start; page <= end; page += 1) pages.add(page)
  }

  return { valid: true, pages: [...pages].sort((a, b) => a - b) }
}

export function formatPageRange(pages: number[]) {
  if (!pages.length) return ''
  const sorted = [...new Set(pages)].sort((a, b) => a - b)
  const ranges: string[] = []
  let start = sorted[0]
  let previous = start

  for (let index = 1; index <= sorted.length; index += 1) {
    const current = sorted[index]
    if (current === previous + 1) {
      previous = current
      continue
    }
    ranges.push(start === previous ? `${start}` : `${start}-${previous}`)
    start = current
    previous = current
  }
  return ranges.join(', ')
}
