import React, { useMemo } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"
import type { Term } from "@shared/types/article"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type MarkdownProps = {
  content: string
  className?: string
  terms?: Term[]
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function highlightTerms(text: string, terms: Term[]) {
  if (!text || terms.length === 0) return text

  // sort terms by length descending to match longest terms first
  const sortedTerms = [...terms].sort((a, b) => b.term.length - a.term.length)

  const pattern = new RegExp(
    `(${sortedTerms.map((t) => escapeRegExp(t.term)).join("|")})`,
    "gi"
  )

  const parts = text.split(pattern)

  if (parts.length === 1) return text

  return parts.map((part, index) => {
    const term = sortedTerms.find((t) => t.term.toLowerCase() === part.toLowerCase())
    if (term) {
      return (
        <TooltipProvider key={index}>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <span className="cursor-help underline decoration-dotted underline-offset-4 decoration-primary/50 hover:decoration-primary">
                {part}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[300px]">
              <p className="font-semibold mb-1">{term.term}</p>
              <p className="text-xs leading-relaxed">{term.definition}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    return part
  })
}

const processChildren = (
  children: React.ReactNode,
  terms: Term[]
): React.ReactNode => {
  if (typeof children === "string") {
    return highlightTerms(children, terms)
  }
  if (Array.isArray(children)) {
    return React.Children.map(children, (child) =>
      processChildren(child, terms)
    )
  }
  if (React.isValidElement(children)) {
    // Skip code blocks or other elements where replacement is undesirable
    if (children.type === "code" || children.type === "pre") return children

    const props = (children as any).props
    if (props && props.children) {
      return React.cloneElement(children, {
        ...props,
        children: processChildren(props.children, terms),
      } as any)
    }
    return children
  }
  return children
}

export function Markdown({ content, className, terms = [] }: MarkdownProps) {
  const components: Components = useMemo(
    () => ({
      a: ({ node: _node, ...props }) => (
        <a {...props} target="_blank" rel="noreferrer noopener">
          {props.children}
        </a>
      ),
      p: ({ node: _node, children, ...props }) => (
        <p {...props}>{processChildren(children, terms)}</p>
      ),
      li: ({ node: _node, children, ...props }) => (
        <li {...props}>{processChildren(children, terms)}</li>
      ),
      // Add other elements if needed, but p and li cover most narrative text
    }),
    [terms]
  )

  return (
    <div
      className={cn(
        "markdown-body text-sm leading-relaxed sm:text-base",
        className
      )}
    >
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm]}
        skipHtml
      >
        {content ?? ""}
      </ReactMarkdown>
    </div>
  )
}
