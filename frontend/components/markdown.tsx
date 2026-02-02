import React, { useMemo } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"
import type { Term } from "@shared/types/article"
import { OrderChip } from "@/components/order-chip"
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

function parseOrderSpec(spec: string): number[] {
  const cleaned = spec.replace(/\s+/g, "")
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

function renderTextWithOrders(
  text: string,
  terms: Term[],
  onOrderClick?: (orders: number[]) => void,
): React.ReactNode {
  if (!onOrderClick) {
    return highlightTerms(text, terms)
  }

  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  ORDER_TAG_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = ORDER_TAG_PATTERN.exec(text)) !== null) {
    const fullMatch = match[0]
    const spec = match[1]
    const before = text.slice(lastIndex, match.index)
    if (before) {
      nodes.push(
        <span key={`text-${lastIndex}`}>{highlightTerms(before, terms)}</span>,
      )
    }
    const orders = parseOrderSpec(spec)
    if (orders.length > 0) {
      nodes.push(
        <OrderChip
          key={`orders-${match.index}`}
          orders={orders}
          label={`#${spec.replace(/\s+/g, "")}`}
          onClick={onOrderClick}
        />,
      )
    } else {
      nodes.push(<span key={`orders-${match.index}`}>{fullMatch}</span>)
    }
    lastIndex = match.index + fullMatch.length
  }

  if (lastIndex < text.length) {
    nodes.push(
      <span key={`text-${lastIndex}`}>{highlightTerms(text.slice(lastIndex), terms)}</span>,
    )
  }

  return nodes.length === 1 ? nodes[0] : <>{nodes}</>
}

const processChildren = (
  children: React.ReactNode,
  terms: Term[],
  onOrderClick?: (orders: number[]) => void,
): React.ReactNode => {
  if (typeof children === "string") {
    return renderTextWithOrders(children, terms, onOrderClick)
  }
  if (Array.isArray(children)) {
    return React.Children.map(children, (child) =>
      processChildren(child, terms, onOrderClick)
    )
  }
  if (React.isValidElement(children)) {
    // Skip code blocks or other elements where replacement is undesirable
    if (children.type === "code" || children.type === "pre") return children

    const props = (children as any).props
    if (props && props.children) {
      return React.cloneElement(children, {
        ...props,
        children: processChildren(props.children, terms, onOrderClick),
      } as any)
    }
    return children
  }
  return children
}

export function Markdown({ content, className, terms = [], tone = "default", onOrderClick }: MarkdownProps) {
  const components: Components = useMemo(
    () => ({
      a: ({ node: _node, ...props }) => {
        const href = typeof props.href === "string" ? props.href : ""
        const isOrderLink = href.toLowerCase().startsWith("order:")
        if (isOrderLink) {
          const spec = href.slice("order:".length)
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
        <p {...props}>{processChildren(children, terms, onOrderClick)}</p>
      ),
      li: ({ node: _node, children, ...props }) => (
        <li {...props}>{processChildren(children, terms, onOrderClick)}</li>
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
        {content ?? ""}
      </ReactMarkdown>
    </div>
  )
}
