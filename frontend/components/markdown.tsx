import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

type MarkdownProps = {
  content: string
  className?: string
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={cn("markdown-body text-sm leading-relaxed sm:text-base", className)}
      linkTarget="_blank"
      skipHtml
    >
      {content ?? ""}
    </ReactMarkdown>
  )
}
