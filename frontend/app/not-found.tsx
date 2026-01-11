import { Button } from "@/components/ui/button"
import { MessageSquare, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-3xl font-bold font-serif text-foreground mb-4">Article Not Found</h1>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          The PoliTopics article you're looking for doesn't exist or may have been moved. Please check the article ID or
          return to the main page.
        </p>

        <Button asChild>
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to PoliTopics
          </Link>
        </Button>
      </div>
    </div>
  )
}
