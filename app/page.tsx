"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Search,
  Filter,
  X,
  CalendarIcon,
  Users,
  MessageSquare,
  Clock,
  Target,
  TrendingUp,
  Info,
  Github,
  Brain,
} from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import Link from "next/link"

// Mock data matching the Article interface structure
const mockArticles = [
  {
    id: "1",
    title: "予算委員会、医療費配分について集中審議",
    date: "2024-01-15",
    imageKind: "committee",
    session: 211,
    nameOfHouse: "衆議院",
    nameOfMeeting: "予算委員会",
    category: "医療",
    description:
      "来年度の医療予算配分について集中的な議論が行われ、地方病院への資金援助と医療機器の近代化に焦点が当てられました。",
    summary: {
      based_on_orders: [1, 3, 7, 12],
      summary:
        "予算委員会では医療資金の優先順位について包括的な議論が行われ、特に地方医療インフラの格差解消と公立病院の医療機器近代化に重点が置かれました。",
      figure: "**重要ポイント:** 地方病院資金15%増額、医療機器近代化予算23億円設定",
    },
    soft_summary: {
      based_on_orders: [1, 3, 7],
      summary: "医療予算について議論。地方病院への支援と医療機器の更新が主な議題.",
    },
    middle_summary: [
      {
        based_on_orders: [1, 3],
        summary: "地方医療格差の解消について集中的な議論が行われました。",
        figure: "**地方病院支援:** 15%の予算増額、医師不足対策も含む",
      },
      {
        based_on_orders: [7, 12],
        summary: "医療機器の近代化と技術導入について詳細な検討が行われました。",
        figure: "**近代化予算:** 23億円、AI診断システム導入も検討",
      },
    ],
    keywords: [
      { keyword: "医療", priority: "high" as const },
      { keyword: "予算", priority: "high" as const },
      { keyword: "地方病院", priority: "medium" as const },
    ],
    participants: [
      { name: "田中博", summary: "委員長、医療政策専門家" },
      { name: "佐藤雪", summary: "野党医療政策スポークスパーソン" },
      { name: "山本健二", summary: "予算委員会委員" },
    ],
  },
  {
    id: "2",
    title: "環境政策改革法案、第一読会を通過",
    date: "2024-01-14",
    imageKind: "plenary",
    session: 211,
    nameOfHouse: "参議院",
    nameOfMeeting: "本会議",
    category: "環境",
    description:
      "炭素排出削減目標と再生可能エネルギー促進に焦点を当てた画期的な環境法案が、初回の議会審査を無事通過しました。",
    summary: {
      based_on_orders: [2, 5, 9, 15],
      summary:
        "2030年までに50%の炭素削減と大幅な再生可能エネルギー促進を目標とする環境改革法案が、超党派の幅広い支持を得て第一読会を通過しました。",
      figure: "**目標:** 2030年までに炭素50%削減、再生可能エネルギー投資5兆円",
    },
    soft_summary: {
      based_on_orders: [2, 5, 9],
      summary: "環境法案が第一読会を通過。炭素削減と再生可能エネルギーが焦点.",
    },
    middle_summary: [
      {
        based_on_orders: [2, 5],
        summary: "炭素排出削減目標について超党派での合意が形成されました。",
        figure: "**削減目標:** 2030年までに50%削減、産業界との協力も重要",
      },
      {
        based_on_orders: [9, 15],
        summary: "再生可能エネルギー投資計画の詳細が議論されました。",
        figure: "**投資規模:** 5兆円、太陽光・風力発電を中心とした展開",
      },
    ],
    keywords: [
      { keyword: "環境", priority: "high" as const },
      { keyword: "炭素削減", priority: "high" as const },
      { keyword: "再生可能エネルギー", priority: "medium" as const },
    ],
    participants: [
      { name: "鈴木明", summary: "環境委員会委員長" },
      { name: "渡辺真理", summary: "気候政策専門家" },
    ],
  },
  {
    id: "3",
    title: "教育改革委員会、デジタル学習基準を審議",
    date: "2024-01-13",
    imageKind: "committee",
    session: 211,
    nameOfHouse: "衆議院",
    nameOfMeeting: "文部科学委員会",
    category: "教育",
    description:
      "公立学校におけるデジタル学習基準と技術統合について包括的な審議が行われ、デジタル格差と教員研修要件に対処しました。",
    summary: {
      based_on_orders: [4, 8, 11, 16],
      summary:
        "文部科学委員会では公立学校全体でのデジタル学習プラットフォーム標準化提案を検討し、デジタル格差の解消と技術統合のための適切な教員研修に重点を置きました。",
      figure: "**投資:** デジタルインフラに8000億円、5万人の教員が研修を受講予定",
    },
    soft_summary: {
      based_on_orders: [4, 8, 11],
      summary: "デジタル学習基準を審議。教員研修とデジタル格差解消が課題.",
    },
    middle_summary: [
      {
        based_on_orders: [4, 8],
        summary: "デジタル学習プラットフォームの標準化について議論されました。",
        figure: "**標準化:** 全国統一システム、クラウドベースの学習環境",
      },
      {
        based_on_orders: [11, 16],
        summary: "教員のデジタル研修プログラムの詳細が検討されました。",
        figure: "**研修規模:** 5万人の教員、段階的な実施計画",
      },
    ],
    keywords: [
      { keyword: "教育", priority: "high" as const },
      { keyword: "デジタル学習", priority: "high" as const },
      { keyword: "教員研修", priority: "medium" as const },
    ],
    participants: [
      { name: "小林太郎", summary: "文部科学委員会委員長" },
      { name: "中村雪", summary: "デジタル教育推進者" },
    ],
  },
  {
    id: "4",
    title: "防衛予算配分委員会会議",
    date: "2024-01-12",
    imageKind: "committee",
    session: 211,
    nameOfHouse: "衆議院",
    nameOfMeeting: "安全保障委員会",
    category: "防衛",
    description: "国家安全保障強化のための防衛費優先順位と軍事装備調達について戦略的議論が行われました。",
    summary: {
      based_on_orders: [6, 10, 14],
      summary: "安全保障委員会では軍事近代化と戦略的防衛イニシアチブの提案を審議しました。",
      figure: "**予算:** 防衛費配分6.8兆円",
    },
    soft_summary: {
      based_on_orders: [6, 10],
      summary: "防衛予算配分を審議。軍事近代化と装備調達が焦点.",
    },
    middle_summary: [
      {
        based_on_orders: [6, 10],
        summary: "防衛費の優先順位について戦略的な議論が行われました。",
        figure: "**配分:** 6.8兆円、装備近代化に重点配分",
      },
      {
        based_on_orders: [14],
        summary: "軍事装備の調達計画について詳細な検討が行われました。",
        figure: "**調達:** 次世代装備システム、国際協力も視野",
      },
    ],
    keywords: [
      { keyword: "防衛", priority: "high" as const },
      { keyword: "軍事", priority: "medium" as const },
      { keyword: "安全保障", priority: "high" as const },
    ],
    participants: [
      { name: "伊藤正樹", summary: "安全保障委員会委員長" },
      { name: "林玲", summary: "安全保障政策専門家" },
    ],
  },
  {
    id: "5",
    title: "経済対策特別委員会、中小企業支援策を検討",
    date: "2024-01-11",
    imageKind: "committee",
    session: 211,
    nameOfHouse: "参議院",
    nameOfMeeting: "経済産業委員会",
    category: "経済",
    description: "中小企業への金融支援と税制優遇措置について詳細な検討が行われ、地域経済活性化策も議論されました。",
    summary: {
      based_on_orders: [13, 17, 20],
      summary:
        "経済産業委員会では中小企業支援の包括的パッケージを検討し、金融支援と税制改革を中心とした議論が展開されました。",
      figure: "**支援額:** 中小企業支援に1.2兆円、税制優遇措置拡大",
    },
    soft_summary: {
      based_on_orders: [13, 17],
      summary: "中小企業支援策を検討。金融支援と税制優遇が主な内容.",
    },
    middle_summary: [
      {
        based_on_orders: [13, 17],
        summary: "中小企業への金融支援制度について詳細な議論が行われました。",
        figure: "**金融支援:** 1.2兆円規模、低利融資制度の拡充",
      },
      {
        based_on_orders: [20],
        summary: "税制優遇措置の拡大について検討されました。",
        figure: "**税制改革:** 法人税減税、研究開発税制の強化",
      },
    ],
    keywords: [
      { keyword: "経済", priority: "high" as const },
      { keyword: "中小企業", priority: "high" as const },
      { keyword: "税制", priority: "medium" as const },
    ],
    participants: [
      { name: "高橋直子", summary: "経済産業委員会委員長" },
      { name: "松本健", summary: "中小企業政策専門家" },
    ],
  },
  {
    id: "6",
    title: "社会保障制度改革に関する特別委員会",
    date: "2024-01-10",
    imageKind: "committee",
    session: 211,
    nameOfHouse: "衆議院",
    nameOfMeeting: "厚生労働委員会",
    category: "社会保障",
    description: "高齢化社会に対応した年金制度改革と医療保険制度の見直しについて集中的な審議が行われました。",
    summary: {
      based_on_orders: [18, 22, 25],
      summary:
        "厚生労働委員会では急速な高齢化に対応するための社会保障制度の抜本的改革について議論し、持続可能な制度設計を検討しました。",
      figure: "**改革規模:** 年金制度改革、医療保険制度見直し、総額3.5兆円規模",
    },
    soft_summary: {
      based_on_orders: [18, 22],
      summary: "社会保障制度改革を審議。年金と医療保険の見直しが焦点.",
    },
    middle_summary: [
      {
        based_on_orders: [18, 22],
        summary: "年金制度の抜本的改革について議論されました。",
        figure: "**年金改革:** 持続可能な制度設計、給付水準の見直し",
      },
      {
        based_on_orders: [25],
        summary: "医療保険制度の見直しについて詳細な検討が行われました。",
        figure: "**医療保険:** 3.5兆円規模の改革、高齢者医療の充実",
      },
    ],
    keywords: [
      { keyword: "社会保障", priority: "high" as const },
      { keyword: "年金", priority: "high" as const },
      { keyword: "高齢化", priority: "medium" as const },
    ],
    participants: [
      { name: "森田美香", summary: "厚生労働委員会委員長" },
      { name: "青木誠", summary: "社会保障制度専門家" },
    ],
  },
]

const mockPersonDetails = {
  田中博: {
    name: "田中博",
    position: "衆議院議員",
    party: "与党",
    committee: "予算委員会委員長",
    pastMeetings: [
      { date: "2024-01-15", meeting: "予算委員会", role: "委員長" },
      { date: "2024-01-10", meeting: "厚生労働委員会", role: "参考人" },
      { date: "2023-12-20", meeting: "予算委員会", role: "委員長" },
    ],
    statementTrends: [
      { topic: "医療政策", frequency: 85, stance: "積極推進" },
      { topic: "予算配分", frequency: 92, stance: "慎重検討" },
      { topic: "地方支援", frequency: 78, stance: "強力支持" },
    ],
    focusAreas: ["医療制度改革", "地方創生", "予算効率化", "高齢者支援"],
    recentActivity: "医療費配分の見直しと地方病院支援策を重点的に推進",
  },
  佐藤雪: {
    name: "佐藤雪",
    position: "衆議院議員",
    party: "野党",
    committee: "厚生労働委員会",
    pastMeetings: [
      { date: "2024-01-15", meeting: "予算委員会", role: "質疑者" },
      { date: "2024-01-08", meeting: "厚生労働委員会", role: "委員" },
      { date: "2023-12-15", meeting: "社会保障特別委員会", role: "委員" },
    ],
    statementTrends: [
      { topic: "医療政策", frequency: 95, stance: "改革要求" },
      { topic: "社会保障", frequency: 88, stance: "拡充支持" },
      { topic: "予算透明性", frequency: 76, stance: "強化要求" },
    ],
    focusAreas: ["医療アクセス改善", "社会保障拡充", "予算透明化", "患者権利保護"],
    recentActivity: "医療格差解消と患者負担軽減策の実現を強く主張",
  },
  鈴木明: {
    name: "鈴木明",
    position: "参議院議員",
    party: "与党",
    committee: "環境委員会委員長",
    pastMeetings: [
      { date: "2024-01-14", meeting: "本会議", role: "法案説明者" },
      { date: "2024-01-05", meeting: "環境委員会", role: "委員長" },
      { date: "2023-12-18", meeting: "エネルギー特別委員会", role: "委員" },
    ],
    statementTrends: [
      { topic: "環境政策", frequency: 98, stance: "積極推進" },
      { topic: "再生エネルギー", frequency: 89, stance: "強力支持" },
      { topic: "炭素削減", frequency: 94, stance: "目標達成重視" },
    ],
    focusAreas: ["脱炭素社会実現", "再生可能エネルギー", "環境技術革新", "国際協調"],
    recentActivity: "2030年炭素削減目標達成に向けた具体的施策を積極的に提案",
  },
}

const instruction = `以下の会話内容をもとに、次の形式で要約データを構成してください：

各セクションは、元の発言の意図やトーンを尊重しつつ、読者の知識レベルに応じて読みやすく調整してください。

---

1. **基本情報（Metadata）**  
　会議に関するメタデータを記載してください：タイトル、開催日、開催機関、カテゴリなど。

2. **全体の要約（Summary）**  
　会議全体の要点や結論を簡潔にまとめてください。発言者の言い回しや口調に近い文体で書いてください。

3. **やさしい要約（SoftSummary）**  
　政治や専門用語に馴染みのない読者向けに、背景や文脈も含めてわかりやすく丁寧に説明してください。  
　難解な表現や専門用語はできるだけ避け、必要に応じて補足をつけてください。

4. **中間要約（MiddleSummary）**  
　議論の重要な転換点や話題ごとのまとまりを要約してください。構成順に並べてください。

5. **発言ごとの要約（Dialogs）**  
　各発言について、以下の情報を含めて記述してください：

　- \`summary\`: その発言の主旨を簡潔に要約してください。  
　- \`soft_summary\`: 一般読者にも伝わるように、やさしく丁寧に言い換えてください。話者の意図や背景も補足すると親切です。  
　- \`order\`, \`speaker\`, \`speaker_group\`, \`speaker_position\`, \`speaker_role\`：それぞれの発言者情報を記載してください。  
　- \`response_to\`: この発言がどの発言に対する反応かを明示してください（例：質問、賛同、反論など）。

6. **参加者情報（Participants）**  
　主な話者ごとに、名前・役職・発言内容の要旨をまとめてください。

7. **用語の解説（Terms）**  
　専門的または一般にはわかりにくい用語について、簡潔で明確な定義を記述してください。文脈に即した説明が望ましいです。

8. **キーワード抽出（Keywords）**  
　議論の焦点となる用語やトピックを抽出し、重要度（high / medium / low）を分類してください。

`

const output_format = `### 出力フォーマット

以下の形式に従ってJSONデータを作成してください：

{
  "id": "文字列（議事録ID）",
  "title": "会議のタイトル",
  "date": "開催日 (YYYY-MM-DD)",
  "imageKind": "画像分類（例: graph, diagram, etc.）",
  "session": 数字（例: 208）,
  "nameOfHouse": "衆議院または参議院",
  "nameOfMeeting": "会議名（例: 国土交通委員会）",
  "category": "カテゴリ（例: 環境, 教育, etc.）",
  "description": "この会議についての説明",

  "summary": {
    "id": 1,
    "summary": "会話全体の要約をここに記載",
    "figure": "Markdown形式で図や補足を記載（任意）"
  },
  "soft_summary": {
    "id": 1,
    "summary": "政治に詳しくない人でも分かるように、丁寧でわかりやすく説明した要約"
  },
  "middle_summary": [
    {
      "order": 1,
      "summary": "中間要約1",
      "figure": "Markdown形式（任意）"
    }
  ],
  "dialogs": [
    {
      "order": 1,
      "speaker": "発言者名",
      "speaker_group": "所属",
      "speaker_position": "役職",
      "speaker_role": "役割",
      "summary": "発言内容の要約",
      "soft_summary": "発言の内容を、政治に詳しくない人でも理解できるように説明した文章",
      "response_to": [
        {
          "id": 発言ID,
          "reaction": "agree | disagree | neutral | question | answer"
        }
      ]
    }
  ],
  "participants": [
    {
      "name": "話者名",
      "summary": "この人の発言要旨"
    }
  ],
  "terms": [
    {
      "term": "専門用語",
      "definition": "その説明"
    }
  ],
  "keywords": [
    {
      "keyword": "キーワード",
      "priority": "high | medium | low"
    }
  ]
}
`

const compose_prompt = (content: string): string => {
  return `${instruction}\n${output_format}\n${content}`
}

const getAllParticipants = (articles: typeof mockArticles) => {
  const allParticipants = articles.flatMap((article) =>
    article.participants.map((p) => ({ ...p, articleId: article.id, articleTitle: article.title })),
  )
  return allParticipants.slice(0, 6) // Show top 6 participants
}

const getTrendingKeywords = (articles: typeof mockArticles) => {
  const keywordCount = new Map()
  articles.forEach((article) => {
    article.keywords.forEach((keyword) => {
      const current = keywordCount.get(keyword.keyword) || { count: 0, priority: keyword.priority }
      keywordCount.set(keyword.keyword, {
        count: current.count + 1,
        priority: keyword.priority === "high" ? "high" : current.priority,
      })
    })
  })

  return Array.from(keywordCount.entries())
    .sort((a, b) => {
      if (a[1].priority === "high" && b[1].priority !== "high") return -1
      if (b[1].priority === "high" && a[1].priority !== "high") return 1
      return b[1].count - a[1].count
    })
    .slice(0, 8)
    .map(([keyword, data]) => ({ keyword, ...data }))
}

export default function HomePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedHouse, setSelectedHouse] = useState("all")
  const [selectedMeeting, setSelectedMeeting] = useState("all")
  const [dateRange, setDateRange] = useState("all")
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [showAbout, setShowAbout] = useState(false)
  const searchBarRef = useRef<HTMLInputElement>(null)

  // Extract unique values for filters
  const categories = useMemo(() => {
    return Array.from(new Set(mockArticles.map((article) => article.category))).sort()
  }, [])

  const houses = useMemo(() => {
    return Array.from(new Set(mockArticles.map((article) => article.nameOfHouse))).sort()
  }, [])

  const meetings = useMemo(() => {
    return Array.from(new Set(mockArticles.map((article) => article.nameOfMeeting))).sort()
  }, [])

  useEffect(() => {
    const savedFilters = localStorage.getItem("parliamentary-filters")
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters)
        setSearchTerm(filters.searchTerm || "")
        setSelectedCategory(filters.selectedCategory || "all")
        setSelectedHouse(filters.selectedHouse || "all")
        setSelectedMeeting(filters.selectedMeeting || "all")
        setDateRange(filters.dateRange || "all")
        setSelectedPerson(filters.selectedPerson || null)
        if (filters.selectedDate) {
          setSelectedDate(new Date(filters.selectedDate))
        }
      } catch (error) {
        console.log("[v0] Failed to load saved filters:", error)
      }
    }
  }, [])

  useEffect(() => {
    const filters = {
      searchTerm,
      selectedCategory,
      selectedHouse,
      selectedMeeting,
      dateRange,
      selectedPerson,
      selectedDate: selectedDate?.toISOString(),
    }
    localStorage.setItem("parliamentary-filters", JSON.stringify(filters))
  }, [searchTerm, selectedCategory, selectedHouse, selectedMeeting, dateRange, selectedPerson, selectedDate])

  // Filter articles based on search and filters
  const filteredArticles = useMemo(() => {
    return mockArticles.filter((article) => {
      // Search filter
      const searchMatch =
        searchTerm === "" ||
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.participants.some((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        article.keywords.some((k) => k.keyword.toLowerCase().includes(searchTerm.toLowerCase()))

      // Category filter
      const categoryMatch = selectedCategory === "all" || article.category === selectedCategory

      // House filter
      const houseMatch = selectedHouse === "all" || article.nameOfHouse === selectedHouse

      // Meeting filter
      const meetingMatch = selectedMeeting === "all" || article.nameOfMeeting === selectedMeeting

      // Date range filter
      const articleDate = new Date(article.date)
      const now = new Date()
      let dateMatch = true

      if (dateRange === "1week") {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateMatch = articleDate >= oneWeekAgo
      } else if (dateRange === "1month") {
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateMatch = articleDate >= oneMonthAgo
      } else if (dateRange === "3months") {
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        dateMatch = articleDate >= threeMonthsAgo
      } else if (dateRange === "6months") {
        const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        dateMatch = articleDate >= sixMonthsAgo
      } else if (dateRange === "1year") {
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        dateMatch = articleDate >= oneYearAgo
      }

      if (selectedDate) {
        const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
        const articleDateStr = format(articleDate, "yyyy-MM-dd")
        dateMatch = dateMatch && articleDateStr === selectedDateStr
      }

      return searchMatch && categoryMatch && houseMatch && meetingMatch && dateMatch
    })
  }, [searchTerm, selectedCategory, selectedHouse, selectedMeeting, dateRange, selectedDate])

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("all")
    setSelectedHouse("all")
    setSelectedMeeting("all")
    setDateRange("all")
    setSelectedPerson(null)
    setSelectedDate(undefined)
    localStorage.removeItem("parliamentary-filters")

    const searchSection = document.getElementById("search-section")
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: "smooth", block: "start" })
      window.scrollBy(0, -80) // Add padding
    }
  }

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedCategory !== "all" ||
    selectedHouse !== "all" ||
    selectedMeeting !== "all" ||
    dateRange !== "all" ||
    selectedDate !== undefined

  const scrollToSearchBar = () => {
    if (searchBarRef.current) {
      const offset = 100 // padding from top
      const elementPosition = searchBarRef.current.offsetTop
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  const handleCategoryClick = (category: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedCategory(category)
    setTimeout(() => {
      const searchSection = document.getElementById("search-section")
      if (searchSection) {
        searchSection.scrollIntoView({ behavior: "smooth", block: "start" })
        window.scrollBy(0, -80)
      }
    }, 100)
  }

  const handleHouseClick = (house: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedHouse(house)
    setTimeout(() => {
      const searchSection = document.getElementById("search-section")
      if (searchSection) {
        searchSection.scrollIntoView({ behavior: "smooth", block: "start" })
        window.scrollBy(0, -80)
      }
    }, 100)
  }

  const handleMeetingClick = (meeting: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedMeeting(meeting)
    setTimeout(() => {
      const searchSection = document.getElementById("search-section")
      if (searchSection) {
        searchSection.scrollIntoView({ behavior: "smooth", block: "start" })
        window.scrollBy(0, -80)
      }
    }, 100)
  }

  const handleParticipantClick = (participant: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSelectedPerson(participant)
    setSearchTerm(participant)
    setTimeout(() => {
      const searchSection = document.getElementById("search-section")
      if (searchSection) {
        searchSection.scrollIntoView({ behavior: "smooth", block: "start" })
        window.scrollBy(0, -80)
      }
    }, 100)
  }

  const handleKeywordClick = (keyword: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSearchTerm(keyword)
    setTimeout(() => {
      const searchSection = document.getElementById("search-section")
      if (searchSection) {
        searchSection.scrollIntoView({ behavior: "smooth", block: "start" })
        window.scrollBy(0, -80)
      }
    }, 100)
  }

  const handleCardClick = (articleId: string) => {
    router.push(`/article/${articleId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-serif text-foreground">国会議事録ニュース</h1>
                <p className="text-xs text-muted-foreground">公平で透明な政治情報をお届け</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAbout(!showAbout)}
              className="flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              このサイトについて
            </Button>
          </div>
        </div>
      </header>

      {showAbout && (
        <section className="bg-primary/5 border-b">
          <div className="container mx-auto px-4 py-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif">
                  <Info className="w-5 h-5 text-primary" />
                  このサイトについて
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">目的</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    このサイトは、政治の出来事をわかりやすく届けることを目的としています。 国会議事録を AI
                    が要約し、人為的なバイアスを排した中立的な情報を提供することで、
                    より多くの方々の民主主義への参加をサポートします。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI 要約について
                  </h4>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">使用プロンプト:</p>
                    <code className="text-xs bg-background p-2 rounded block whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {compose_prompt("")}
                    </code>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    オープンソース
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    このプロジェクトはオープンソースです。透明性を保つため、 ソースコードを公開しています。
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://github.com/example/parliamentary-news" target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub で見る
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground mb-4">国会の動きを、わかりやすく</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI が国会議事録を要約し、政治の出来事を一般の方にもわかりやすくお届けします
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section id="search-section" className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="議員名、キーワード、議題で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg border-2 focus:border-primary"
                ref={searchBarRef}
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  フィルター
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                      {
                        [
                          searchTerm !== "",
                          selectedCategory !== "all",
                          selectedHouse !== "all",
                          selectedMeeting !== "all",
                          dateRange !== "all",
                          selectedDate !== undefined,
                        ].filter(Boolean).length
                      }
                    </Badge>
                  )}
                </Button>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-2">
                    <X className="w-4 h-4" />
                    クリア
                  </Button>
                )}
              </div>
            </div>

            {showFilters && (
              <Card className="w-full max-w-4xl mx-auto">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-2">カテゴリー</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="すべてのカテゴリー" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべてのカテゴリー</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-2">院</label>
                      <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="すべての院" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべての院</SelectItem>
                          {houses.map((house) => (
                            <SelectItem key={house} value={house}>
                              {house}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-2">会議</label>
                      <Select value={selectedMeeting} onValueChange={setSelectedMeeting}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="すべての会議" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべての会議</SelectItem>
                          {meetings.map((meeting) => (
                            <SelectItem key={meeting} value={meeting}>
                              {meeting}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-2">期間</label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="期間" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべての期間</SelectItem>
                          <SelectItem value="1week">過去1週間</SelectItem>
                          <SelectItem value="1month">過去1ヶ月</SelectItem>
                          <SelectItem value="3months">過去3ヶ月</SelectItem>
                          <SelectItem value="6months">過去6ヶ月</SelectItem>
                          <SelectItem value="1year">過去1年</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-2">日付</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-transparent"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "yyyy/MM/dd", { locale: ja }) : "日付を選択"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            locale={ja}
                            initialFocus
                          />
                          {selectedDate && (
                            <div className="p-3 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedDate(undefined)}
                                className="w-full"
                              >
                                日付をクリア
                              </Button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {searchTerm && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{filteredArticles.length} 件の議事録が見つかりました</p>
              </div>
            )}
          </div>
        </div>

        {searchTerm &&
          selectedPerson &&
          mockPersonDetails[selectedPerson] &&
          searchTerm.toLowerCase().includes(selectedPerson.toLowerCase()) && (
            <section className="mb-8">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-serif">
                    <Users className="w-5 h-5 text-primary" />
                    {mockPersonDetails[selectedPerson].name} の詳細情報
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Basic Info */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        基本情報
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">役職:</span>
                          <span className="ml-2 font-medium">{mockPersonDetails[selectedPerson].position}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">所属:</span>
                          <span className="ml-2 font-medium">{mockPersonDetails[selectedPerson].party}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">委員会:</span>
                          <span className="ml-2 font-medium">{mockPersonDetails[selectedPerson].committee}</span>
                        </div>
                        <div className="mt-3">
                          <span className="text-muted-foreground">最近の活動:</span>
                          <p className="mt-1 text-sm leading-relaxed">
                            {mockPersonDetails[selectedPerson].recentActivity}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Past Meetings */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        最近の参加会議
                      </h4>
                      <div className="space-y-2">
                        {mockPersonDetails[selectedPerson].pastMeetings.map((meeting, index) => (
                          <div key={index} className="text-sm border-l-2 border-primary/20 pl-3">
                            <div className="font-medium">{meeting.meeting}</div>
                            <div className="text-muted-foreground text-xs">
                              {new Date(meeting.date).toLocaleDateString("ja-JP")} - {meeting.role}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Focus Areas & Trends */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        注目分野・発言傾向
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <h5 className="text-sm font-medium text-foreground mb-2">重点分野</h5>
                          <div className="flex flex-wrap gap-1">
                            {mockPersonDetails[selectedPerson].focusAreas.map((area, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-foreground mb-2">発言傾向</h5>
                          <div className="space-y-1">
                            {mockPersonDetails[selectedPerson].statementTrends.map((trend, index) => (
                              <div key={index} className="flex items-center justify-between text-xs">
                                <span>{trend.topic}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-12 bg-muted rounded-full h-1">
                                    <div
                                      className="bg-primary h-1 rounded-full"
                                      style={{ width: `${trend.frequency}%` }}
                                    />
                                  </div>
                                  <span className="text-muted-foreground w-16">{trend.stance}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {hasActiveFilters && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {mockArticles.length}件中{filteredArticles.length}件を表示
                {searchTerm && ` 「${searchTerm}」の検索結果`}
              </p>
              {filteredArticles.length === 0 && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  フィルターをクリア
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Featured Article */}
        {!hasActiveFilters && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-accent rounded-full"></div>
              <h3 className="text-2xl font-bold font-serif text-foreground">注目の審議</h3>
            </div>

            <Card
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCardClick(mockArticles[0].id)}
            >
              <div className="md:flex">
                <div className="md:w-1/3">
                  <div className="h-48 md:h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">委員会審議</p>
                    </div>
                  </div>
                </div>
                <div className="md:w-2/3 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={(e) => handleCategoryClick(mockArticles[0].category, e)}
                    >
                      {mockArticles[0].category}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CalendarIcon className="w-4 h-4" />
                      {new Date(mockArticles[0].date).toLocaleDateString("ja-JP")}
                    </div>
                  </div>

                  <h4 className="text-2xl font-bold font-serif text-foreground mb-3">{mockArticles[0].title}</h4>

                  <p className="text-muted-foreground mb-4 leading-relaxed">{mockArticles[0].description}</p>

                  <div className="space-y-3 mb-4">
                    <div>
                      <h5 className="text-sm font-semibold text-foreground mb-2">主要発言者</h5>
                      <div className="flex flex-wrap gap-2">
                        {mockArticles[0].participants.slice(0, 3).map((participant, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-muted transition-colors"
                            onClick={(e) => handleParticipantClick(participant.name, e)}
                          >
                            {participant.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-semibold text-foreground mb-2">主要議題</h5>
                      <div className="flex flex-wrap gap-2">
                        {mockArticles[0].keywords
                          .filter((k) => k.priority === "high")
                          .map((keyword, index) => (
                            <Badge
                              key={index}
                              className="bg-accent/10 text-accent text-xs cursor-pointer hover:bg-accent/20 transition-colors"
                              onClick={(e) => handleKeywordClick(keyword.keyword, e)}
                            >
                              {keyword.keyword}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div
                        className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                        onClick={(e) => handleHouseClick(mockArticles[0].nameOfHouse, e)}
                      >
                        <Users className="w-4 h-4" />
                        {mockArticles[0].nameOfHouse}
                      </div>
                      <div>第{mockArticles[0].session}回国会</div>
                    </div>

                    <Button asChild onClick={(e) => e.stopPropagation()}>
                      <Link href={`/article/${mockArticles[0].id}`}>詳細を読む</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Latest Proceedings Section */}
        {!hasActiveFilters && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h3 className="text-2xl font-bold font-serif text-foreground">最新の審議</h3>
            </div>

            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 w-max">
                {mockArticles.slice(1, 5).map((article) => (
                  <Card
                    key={article.id}
                    className="w-80 flex-shrink-0 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleCardClick(article.id)}
                  >
                    <div className="h-32 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="w-6 h-6 text-primary mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">
                          {article.imageKind === "committee" ? "委員会" : "本会議"}
                        </p>
                      </div>
                    </div>

                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-muted transition-colors"
                          onClick={(e) => handleCategoryClick(article.category, e)}
                        >
                          {article.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarIcon className="w-3 h-3" />
                          {new Date(article.date).toLocaleDateString("ja-JP")}
                        </div>
                      </div>

                      <CardTitle className="text-base font-serif leading-tight line-clamp-2">{article.title}</CardTitle>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-2">
                        {article.description}
                      </p>

                      <div className="space-y-2 mb-3">
                        <div>
                          <div className="flex flex-wrap gap-1">
                            {article.participants.slice(0, 2).map((participant, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs px-2 py-0 cursor-pointer hover:bg-muted transition-colors"
                                onClick={(e) => handleParticipantClick(participant.name, e)}
                              >
                                {participant.name}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex flex-wrap gap-1">
                            {article.keywords
                              .filter((k) => k.priority === "high")
                              .slice(0, 2)
                              .map((keyword, index) => (
                                <Badge
                                  key={index}
                                  className="bg-accent/10 text-accent text-xs px-2 py-0 cursor-pointer hover:bg-accent/20 transition-colors"
                                  onClick={(e) => handleKeywordClick(keyword.keyword, e)}
                                >
                                  {keyword.keyword}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div
                          className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={(e) => handleMeetingClick(article.nameOfMeeting, e)}
                        >
                          {article.nameOfMeeting}
                        </div>

                        <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                          <Link href={`/article/${article.id}`}>詳細</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {!searchTerm && !hasActiveFilters && (
          <>
            {/* Trending Topics Section */}
            <section className="py-12">
              <div className="container mx-auto px-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-serif">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      注目の議題
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {getTrendingKeywords(filteredArticles).map((item, index) => (
                        <Badge
                          key={index}
                          variant={item.priority === "high" ? "default" : "secondary"}
                          className={`cursor-pointer transition-colors ${
                            item.priority === "high"
                              ? "bg-primary text-primary-foreground hover:bg-primary/80"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-foreground"
                          }`}
                          onClick={() => handleKeywordClick(item.keyword)}
                        >
                          {item.keyword}
                          <span className="ml-1 text-xs opacity-70">({item.count})</span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Key Speakers Section */}
            <section className="py-12 bg-background">
              <div className="container mx-auto px-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-serif">
                      <Users className="w-5 h-5 text-primary" />
                      主要な発言者
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getAllParticipants(filteredArticles).map((participant, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <h5
                              className="font-semibold text-sm text-foreground cursor-pointer hover:text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors"
                              onClick={() => handleParticipantClick(participant.name)}
                            >
                              {participant.name}
                            </h5>
                            <p className="text-xs text-muted-foreground px-2">{participant.summary}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {participant.name === "田中博"
                              ? "予算委員長"
                              : participant.name === "佐藤雪"
                                ? "野党議員"
                                : participant.name === "鈴木健"
                                  ? "厚労委員"
                                  : participant.name === "高橋美"
                                    ? "文科委員"
                                    : "議員"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        )}

        {/* Articles Grid */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="text-2xl font-bold font-serif text-foreground">
              {hasActiveFilters ? "検索結果" : "すべての審議"}
            </h3>
          </div>

          {filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-foreground mb-2">該当する記事が見つかりません</h4>
                <p className="text-muted-foreground mb-4">検索条件やフィルターを調整して、再度お試しください。</p>
                <Button variant="outline" onClick={clearFilters}>
                  すべてのフィルターをクリア
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(hasActiveFilters ? filteredArticles : filteredArticles.slice(4)).map((article) => (
                <Card
                  key={article.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleCardClick(article.id)}
                >
                  {/* ... existing card content with updated hover effects ... */}
                  <div className="h-40 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {article.imageKind === "committee" ? "委員会" : "本会議"}
                      </p>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-gray-700 hover:text-white transition-colors"
                        onClick={(e) => handleCategoryClick(article.category, e)}
                      >
                        {article.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(article.date).toLocaleDateString("ja-JP")}
                      </div>
                    </div>

                    <CardTitle className="text-lg font-serif leading-tight">{article.title}</CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {article.description.substring(0, 120)}...
                    </p>

                    <div className="space-y-3 mb-4">
                      <div>
                        <h6 className="text-xs font-semibold text-foreground mb-1">発言者</h6>
                        <div className="flex flex-wrap gap-1">
                          {article.participants.slice(0, 2).map((participant, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs px-2 py-0 cursor-pointer hover:bg-gray-700 hover:text-white transition-colors"
                              onClick={(e) => handleParticipantClick(participant.name, e)}
                            >
                              {participant.name}
                            </Badge>
                          ))}
                          {article.participants.length > 2 && (
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              +{article.participants.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <h6 className="text-xs font-semibold text-foreground mb-1">議題</h6>
                        <div className="flex flex-wrap gap-1">
                          {article.keywords
                            .filter((k) => k.priority === "high")
                            .slice(0, 2)
                            .map((keyword, index) => (
                              <Badge
                                key={index}
                                className="bg-accent/10 text-accent text-xs px-2 py-0 cursor-pointer hover:bg-gray-700 hover:text-white transition-colors"
                                onClick={(e) => handleKeywordClick(keyword.keyword, e)}
                              >
                                {keyword.keyword}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div
                        className="text-xs text-muted-foreground cursor-pointer hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                        onClick={(e) => handleMeetingClick(article.nameOfMeeting, e)}
                      >
                        {article.nameOfMeeting}
                      </div>

                      <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                        <Link href={`/article/${article.id}`}>詳細</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card/50 border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold font-serif text-foreground">国会議事録ニュース</span>
            </div>
            <p className="text-sm text-muted-foreground">すべての市民に民主主義を身近に</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
