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
  tone?: "default" | "muted"
  onOrderClick?: (orders: number[]) => void
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

const ORDER_TAG_PATTERN = /\[\[orders:([0-9,\s-]+)\]\]/gi

function normalizeOrderSpec(spec: string): string {
  return spec.replace(/\s+/g, "")
}

function injectOrderLinks(content: string, enableLinks: boolean): string {
  if (!content) return ""
  return content.replace(ORDER_TAG_PATTERN, (_match, spec) => {
    const cleaned = normalizeOrderSpec(spec)
    if (!cleaned) return ""
    if (enableLinks) {
      return `[↳発言${cleaned}](order:${cleaned})`
    }
    return `（発言${cleaned}）`
  })
}

function parseOrderSpec(spec: string): number[] {
  const cleaned = normalizeOrderSpec(spec)
  if (!cleaned) return []
  const orders: number[] = []
  for (const token of cleaned.split(",")) {
    if (!token) continue
    if (token.includes("-")) {
      const [startRaw, endRaw] = token.split("-")
      const start = Number(startRaw)
      const end = Number(endRaw)
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue
      const step = start <= end ? 1 : -1
      for (let value = start; value !== end + step; value += step) {
        orders.push(value)
      }
      continue
    }
    const value = Number(token)
    if (!Number.isFinite(value)) continue
    orders.push(value)
  }
  return Array.from(new Set(orders))
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

export function Markdown({ content, className, terms = [], tone = "default", onOrderClick }: MarkdownProps) {
  const preparedContent = useMemo(
    () => injectOrderLinks(content ?? "", Boolean(onOrderClick)),
    [content, onOrderClick],
  )
  const components: Components = useMemo(
    () => ({
      a: ({ node: _node, ...props }) => {
        const href = typeof props.href === "string" ? props.href : ""
        if (href.startsWith("order:")) {
          const spec = href.replace("order:", "")
          const orders = parseOrderSpec(spec)
          if (orders.length && onOrderClick) {
            return (
              <button
                type="button"
                onClick={() => onOrderClick(orders)}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/10"
              >
                {props.children}
              </button>
            )
          }
          return <span className="text-xs text-muted-foreground">{props.children}</span>
        }
        return (
          <a {...props} target="_blank" rel="noreferrer noopener">
            {props.children}
          </a>
        )
      },
      p: ({ node: _node, children, ...props }) => (
        <p {...props}>{processChildren(children, terms)}</p>
      ),
      li: ({ node: _node, children, ...props }) => (
        <li {...props}>{processChildren(children, terms)}</li>
      ),
      // Add other elements if needed, but p and li cover most narrative text
    }),
    [terms, onOrderClick]
  )

  return (
    <div
      className={cn(
        "markdown-body text-sm leading-relaxed sm:text-base",
        className
      )}
      data-tone={tone}
    >
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm]}
        skipHtml
      >
        {preparedContent}
      </ReactMarkdown>
    </div>
  )
}
