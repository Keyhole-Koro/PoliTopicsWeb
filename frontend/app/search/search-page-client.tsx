'use client'

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { SearchClient } from "./search-client"

export function SearchPageClient() {
  const searchParams = useSearchParams()
  const initialWords = useMemo(() => {
    const raw = searchParams?.get("words") ?? ""
    const decoded = decodeURIComponent(raw)
    return decoded ? decoded.split(",").filter(Boolean) : []
  }, [searchParams])

  return <SearchClient initialWords={initialWords} />
}
