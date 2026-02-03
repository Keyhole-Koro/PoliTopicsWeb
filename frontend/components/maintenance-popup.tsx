"use client"

import { useEffect, useState } from "react"


export function MaintenancePopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const env = process.env.NEXT_PUBLIC_APP_ENV

    setVisible(false)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-red-200/60 bg-white p-8 shadow-2xl">
        <div className="space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">Maintenance</p>
          <h2 className="text-3xl font-semibold text-foreground">現在メンテナンス中です</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            ただいまシステムの更新作業を行っています。<br />
            本日午後6時に終わる予定です。
          </p>
          <button
            type="button"
            onClick={() => {
              setVisible(false)
            }}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-6 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
