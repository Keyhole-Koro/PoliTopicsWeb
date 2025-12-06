import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar, Users, MessageSquare, ArrowLeft, Clock, Building, Hash, Quote, BookOpen, Tag } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DialogViewer } from "@/components/dialog-viewer"

// Extended mock data with full Article interface structure
const mockArticleData = {
  "1": {
    id: "1",
    title: "予算委員会における医療費配分の審議",
    date: "2024-01-15",
    imageKind: "committee",
    session: 211,
    nameOfHouse: "衆議院",
    nameOfMeeting: "予算委員会",
    category: "医療",
    description:
      "来年度の医療予算配分について集中的な議論が行われ、特に地方病院への資金援助と医療機器の近代化に焦点が当てられました。",
    summary: {
      id: 1,
      summary:
        "予算委員会では医療資金の優先順位について包括的な議論が行われ、特に地方の医療インフラの格差解消と公立病院全体の医療機器近代化に重点が置かれました。主要な関係者が予算配分の詳細な提案を発表し、サービスが不十分な地方地域での資金増加の緊急性を強調しました。",
      figure:
        "**主要な予算配分:**\n\n- 地方病院資金: 4,500億円（15%増）\n- 医療機器近代化: 2,300億円\n- 救急医療インフラ: 1,800億円\n- 遠隔医療イニシアチブ: 950億円",
    },
    soft_summary: {
      id: 1,
      summary:
        "医療予算の議論は地方病院と医療機器に焦点を当て、サービスが不十分な地域への大幅な資金増加が提案されました。",
    },
    middle_summary: [
      {
        order: 1,
        summary:
          "開会の挨拶では地方医療インフラの危機的状況が強調され、複数の委員が病院閉鎖と機器不足の具体例を挙げました。",
        figure:
          "**地方医療の危機:**\n\n- 過去5年間で127の地方病院が閉鎖\n- 医療機器の平均年数: 12.3年\n- 地方地域の23%が救急医療アクセス不足",
      },
      {
        order: 2,
        summary: "詳細な予算提案が発表され、地方医療資金の増加と近代化イニシアチブに対する超党派の支持が示されました。",
        figure: "**提案予算の内訳:**\n\n- インフラ: 45%\n- 機器: 30%\n- 人員: 15%\n- 技術: 10%",
      },
    ],
    dialogs: [
      {
        order: 1,
        speaker: "田中博",
        speaker_group: "自由民主党",
        speaker_position: "委員長",
        speaker_role: "議長",
        summary:
          "医療インフラ投資の重要な必要性、特に病院閉鎖によってコミュニティが適切な医療ケアを受けられなくなった地方地域について概説し、セッションを開始しました。",
        soft_summary: "委員長が地方医療投資の緊急性を強調しました。",
        response_to: [],
      },
      {
        order: 2,
        speaker: "佐藤由紀",
        speaker_group: "立憲民主党",
        speaker_position: "医療政策担当",
        speaker_role: "野党議員",
        summary:
          "地方病院閉鎖に関する詳細な統計を発表し、救急医療アクセスと遠隔医療インフラを優先する包括的な資金パッケージを提案しました。",
        soft_summary: "野党議員が包括的な地方医療資金パッケージを提案しました。",
        response_to: [{ dialog_id: 1, reaction: "AGREE" as const }],
      },
      {
        order: 3,
        speaker: "山本健二",
        speaker_group: "自由民主党",
        speaker_position: "予算小委員会委員",
        speaker_role: "与党議員",
        summary:
          "医療資金の増加への支持を表明する一方で、財政責任と提案された投資からの測定可能な成果の必要性について懸念を提起しました。",
        soft_summary: "与党議員が資金を支持しつつ財政責任を強調しました。",
        response_to: [{ dialog_id: 2, reaction: "NEUTRAL" as const }],
      },
    ],
    participants: [
      {
        name: "田中博",
        summary:
          "医療政策で15年の経験を持つ委員長。地方医療課題に対する超党派解決策に焦点を当ててセッションを主導しました。",
      },
      {
        name: "佐藤由紀",
        summary:
          "地方医療アクセスの擁護で知られる野党医療政策担当。医療インフラの格差に関する包括的なデータを発表しました。",
      },
      {
        name: "山本健二",
        summary: "財政政策を専門とする予算委員会委員。資金増加を支持しながら医療支出の説明責任の必要性を強調しました。",
      },
    ],
    keywords: [
      { keyword: "医療資金", priority: "high" as const },
      { keyword: "地方病院", priority: "high" as const },
      { keyword: "医療機器", priority: "medium" as const },
      { keyword: "遠隔医療", priority: "medium" as const },
      { keyword: "救急医療", priority: "medium" as const },
      { keyword: "予算配分", priority: "low" as const },
    ],
    terms: [
      {
        term: "地方病院閉鎖",
        definition:
          "財政的制約、人員不足、または運営を維持するのに十分な患者数の不足により、地方地域の医療施設が恒久的に閉鎖されること。",
      },
      {
        term: "遠隔医療インフラ",
        definition: "遠隔医療相談と診断を可能にする技術システム。特に地方の患者と都市部の医療専門家を結ぶために重要。",
      },
      {
        term: "救急医療アクセス",
        definition:
          "合理的な距離と時間枠内での即座の医療治療の利用可能性。通常、緊急事態発生から30分以内のアクセスとして測定される。",
      },
    ],
  },
}

function getReactionIcon(reaction: string) {
  switch (reaction) {
    case "AGREE":
      return "✓"
    case "DISAGREE":
      return "✗"
    case "NEUTRAL":
      return "○"
    case "QUESTION":
      return "?"
    case "ANSWER":
      return "!"
    default:
      return "○"
  }
}

function getReactionColor(reaction: string) {
  switch (reaction) {
    case "AGREE":
      return "text-green-600"
    case "DISAGREE":
      return "text-red-600"
    case "NEUTRAL":
      return "text-gray-500"
    case "QUESTION":
      return "text-blue-600"
    case "ANSWER":
      return "text-purple-600"
    default:
      return "text-gray-500"
  }
}

export default function ArticlePage({ params }: { params: { id: string } }) {
  const article = mockArticleData[params.id as keyof typeof mockArticleData]

  if (!article) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                ニュース一覧に戻る
              </Link>
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold font-serif text-foreground">国会議事録ニュース</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Article Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className="bg-primary/10 text-primary">{article.category}</Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {new Date(article.date).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Hash className="w-4 h-4" />第{article.session}回国会
            </div>
          </div>

          <h1 className="text-4xl font-bold font-serif text-foreground mb-4 leading-tight">{article.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <Building className="w-4 h-4" />
              {article.nameOfHouse}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {article.nameOfMeeting}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {article.imageKind === "committee" ? "委員会" : "本会議"}
            </div>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed">{article.description}</p>
        </div>

        {/* AI Summary Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <Quote className="w-5 h-5 text-primary" />
              AI要約
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">詳細要約</h4>
              <p className="text-muted-foreground leading-relaxed">{article.summary.summary}</p>
            </div>

            {article.summary.figure && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="prose prose-sm max-w-none">
                  {article.summary.figure.split("\n").map((line, index) => (
                    <div
                      key={index}
                      className={line.startsWith("**") ? "font-semibold text-foreground" : "text-muted-foreground"}
                    >
                      {line.replace(/\*\*/g, "")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">簡潔要約</h4>
              <p className="text-sm text-muted-foreground italic">{article.soft_summary.summary}</p>
            </div>
          </CardContent>
        </Card>

        {/* Middle Summaries */}
        {article.middle_summary.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold font-serif text-foreground mb-6">主要な議論のポイント</h2>
            <div className="space-y-6">
              {article.middle_summary.map((summary) => (
                <Card key={summary.order}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-sm font-semibold text-primary">{summary.order}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-muted-foreground leading-relaxed mb-4">{summary.summary}</p>
                        {summary.figure && (
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <div className="prose prose-sm max-w-none">
                              {summary.figure.split("\n").map((line, index) => (
                                <div
                                  key={index}
                                  className={
                                    line.startsWith("**") ? "font-semibold text-foreground" : "text-muted-foreground"
                                  }
                                >
                                  {line.replace(/\*\*/g, "")}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Dialogs Section */}
        <DialogViewer dialogs={article.dialogs} terms={article.terms} title="会議の議事録" className="mb-8" />

        {/* Participants Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <Users className="w-5 h-5 text-primary" />
              主要な参加者
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {article.participants.map((participant, index) => (
                <div key={index} className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">{participant.name}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{participant.summary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Keywords and Terms */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif">
                <Tag className="w-5 h-5 text-primary" />
                主要なトピック
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {article.keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant={keyword.priority === "high" ? "default" : "secondary"}
                    className={keyword.priority === "high" ? "bg-primary text-primary-foreground" : ""}
                  >
                    {keyword.keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif">
                <BookOpen className="w-5 h-5 text-primary" />
                重要な用語
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {article.terms.map((term, index) => (
                  <div key={index}>
                    <h5 className="font-semibold text-sm text-foreground">{term.term}</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">{term.definition}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
