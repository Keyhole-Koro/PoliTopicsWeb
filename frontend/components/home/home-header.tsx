import { Info, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  showAbout: boolean
  onToggleAbout: () => void
}

export function HomeHeader({ showAbout, onToggleAbout }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Users className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">国会議事録ニュース</p>
            <p className="text-xs text-muted-foreground">公平で透明な政治情報をお届け</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onToggleAbout} className="gap-2">
          <Info className="h-4 w-4" />
          {showAbout ? "閉じる" : "このサイトについて"}
        </Button>
      </div>
    </header>
  )
}
