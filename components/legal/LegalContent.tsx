import { Fragment } from 'react'

/**
 * Renders admin-authored legal_documents.content (spec §22/§28) as plain
 * React elements — no HTML parsing/dangerouslySetInnerHTML at all, so there
 * is no injection surface even though this content comes from the database.
 * Supports a tiny markdown subset: # / ## headings, numbered/bulleted
 * lines, **bold**, blank-line paragraph breaks.
 */
export function LegalContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []
  let paragraph: string[] = []
  let key = 0

  function flushParagraph() {
    if (paragraph.length === 0) return
    blocks.push(
      <p key={key++} className="mb-4 text-brand-dark">
        {renderInline(paragraph.join(' '))}
      </p>
    )
    paragraph = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line === '') {
      flushParagraph()
      continue
    }
    if (line.startsWith('## ')) {
      flushParagraph()
      blocks.push(<h2 key={key++} className="mb-3 mt-8 text-xl font-semibold text-brand-dark">{line.slice(3)}</h2>)
      continue
    }
    if (line.startsWith('# ')) {
      flushParagraph()
      blocks.push(<h1 key={key++} className="mb-4 text-2xl font-semibold text-brand-dark">{line.slice(2)}</h1>)
      continue
    }
    if (/^\d+\.\s/.test(line) || line.startsWith('- ')) {
      flushParagraph()
      blocks.push(
        <li key={key++} className="ml-5 mb-1.5 list-disc text-brand-dark">
          {renderInline(line.replace(/^\d+\.\s/, '').replace(/^-\s/, ''))}
        </li>
      )
      continue
    }
    paragraph.push(line)
  }
  flushParagraph()

  return <div>{blocks}</div>
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}
