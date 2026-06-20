import { Code2 } from 'lucide-react'
import { CodeBlock } from './CodeBlock'
import { Eyebrow } from './Eyebrow'

interface SourceProps {
  code: string
  lang?: 'tsx' | 'ts' | 'css' | 'bash'
}

/** A code block under a "SOURCE" eyebrow. */
export async function Source({ code, lang = 'tsx' }: SourceProps) {
  return (
    <div className="export-block">
      <Eyebrow icon={<Code2 size={12} strokeWidth={1.75} />}>SOURCE</Eyebrow>
      <CodeBlock code={code} lang={lang} />
    </div>
  )
}
