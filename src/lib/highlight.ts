import { createHighlighter, type Highlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: ['tsx', 'ts', 'css', 'bash'],
    })
  }
  return highlighterPromise
}

export async function highlight(code: string, lang: 'tsx' | 'ts' | 'css' | 'bash' = 'tsx'): Promise<string> {
  const hl = await getHighlighter()
  return hl.codeToHtml(code.trim(), {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
  })
}
