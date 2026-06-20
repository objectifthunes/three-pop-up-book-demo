import { highlight } from '@/lib/highlight'
import { CopyButton } from './CopyButton'

interface CodeBlockProps {
  code: string
  lang?: 'tsx' | 'ts' | 'css' | 'bash'
}

export async function CodeBlock({ code, lang = 'tsx' }: CodeBlockProps) {
  const html = await highlight(code, lang)
  return (
    <div className="code-block">
      <CopyButton text={code.trim()} />
      <div className="code-block__shiki" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
