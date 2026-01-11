import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

type MarkdownProps = {
  content: string
  className?: string
}

const components: Components = {
  a: ({ node: _node, ...props }) => (
    <a {...props} target="_blank" rel="noreferrer noopener">
      {props.children}
    </a>
  ),
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn("markdown-body text-sm leading-relaxed sm:text-base", className)}>
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]} skipHtml>
        {content ?? ""}
      </ReactMarkdown>
    </div>
  )
}
