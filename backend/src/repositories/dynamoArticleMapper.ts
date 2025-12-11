import type {
  Article,
  ArticleSummary,
  Dialog,
  Keyword,
  Participant,
  Summary,
  Term,
  ArticleImageKind,
  MiddleSummary,
  SoftSummary,
} from "@shared/types/article";

export type DynamoArticleItem = {
  PK: string;
  SK: string;
  title: string;
  description: string;
  date: string;
  month: string;
  categories?: string[];
  keywords?: Keyword[] | string[];
  participants?: Participant[] | string[];
  imageKind?: ArticleImageKind | string;
  session?: number | string;
  nameOfHouse?: string;
  nameOfMeeting?: string;
  terms?: Term[] | string[];
  summary?: Summary | string;
  soft_summary?: SoftSummary | string;
  middle_summary?: MiddleSummary[];
  dialogs?: Dialog[];
};

export type DynamoIndexItem = {
  PK: string;
  SK: string;
  articleId: string;
  title: string;
  date: string;
  month: string;
  categories?: string[];
  keywords?: Keyword[] | string[];
  participants?: Participant[] | string[];
  imageKind?: ArticleImageKind | string;
  session?: number | string;
  nameOfHouse?: string;
  nameOfMeeting?: string;
};

export function mapArticleToSummary(item: Record<string, unknown>): ArticleSummary {
  const article = mapItemToArticle(item as DynamoArticleItem);
  return toSummary(article);
}

export function mapItemToArticle(item: DynamoArticleItem): Article {
  const id = item.PK.replace("A#", "");
  return {
    id,
    title: item.title ?? "",
    description: item.description ?? "",
    date: item.date ?? "",
    month: item.month ?? "",
    categories: item.categories ?? [],
    keywords: normalizeKeywords(item.keywords),
    participants: normalizeParticipants(item.participants),
    imageKind: normalizeImageKind(item.imageKind),
    session: typeof item.session === "number" ? item.session : Number(item.session) || 0,
    nameOfHouse: item.nameOfHouse ?? "",
    nameOfMeeting: item.nameOfMeeting ?? "",
    summary: normalizeSummary(item.summary),
    soft_summary: normalizeSummary(item.soft_summary),
    middle_summary: normalizeMiddleSummaries(item.middle_summary),
    dialogs: normalizeDialogs(item.dialogs),
    terms: normalizeTerms(item.terms),
  };
}

export function mapIndexToSummary(item: Record<string, unknown>): ArticleSummary | undefined {
  if (!item) return undefined;
  const record = item as DynamoIndexItem;

  return {
    id: record.articleId ?? record.PK?.split("#").pop() ?? "",
    title: record.title,
    description: "",
    date: record.date,
    month: record.month,
    categories: record.categories ?? [],
    keywords: normalizeKeywords(record.keywords),
    participants: normalizeParticipants(record.participants),
    imageKind: normalizeImageKind(record.imageKind),
    session: typeof record.session === "number" ? record.session : Number(record.session) || 0,
    nameOfHouse: record.nameOfHouse ?? "",
    nameOfMeeting: record.nameOfMeeting ?? "",
  };
}

export function toSummary(article: Article): ArticleSummary {
  const {
    id,
    title,
    description,
    date,
    month,
    categories,
    keywords,
    participants,
    imageKind,
    session,
    nameOfHouse,
    nameOfMeeting,
  } = article;

  return {
    id,
    title,
    description,
    date,
    month,
    categories,
    keywords,
    participants,
    imageKind,
    session,
    nameOfHouse,
    nameOfMeeting,
  };
}

export function normalizeSummary(source: unknown, fallback = ""): Summary {
  if (typeof source === "string") {
    return { based_on_orders: [], summary: source };
  }
  if (source && typeof source === "object") {
    const summary = (source as Partial<Summary>).summary;
    const basedOnOrders = (source as Partial<Summary>).based_on_orders;
    if (typeof summary === "string" && Array.isArray(basedOnOrders)) {
      return { based_on_orders: basedOnOrders, summary };
    }
  }
  return { based_on_orders: [], summary: fallback };
}

export function normalizeMiddleSummaries(source: unknown): MiddleSummary[] {
  if (!Array.isArray(source)) return [];
  return source
    .map((entry) => normalizeSummary(entry))
    .filter((entry) => entry.summary.length > 0 || entry.based_on_orders.length > 0);
}

export function normalizeKeywords(source: unknown): Keyword[] {
  if (!Array.isArray(source)) return [];
  return source
    .map((item) => {
      if (typeof item === "string") {
        return { keyword: item, priority: "medium" as Keyword["priority"] };
      }
      if (item && typeof item === "object") {
        const keyword = "keyword" in item ? (item as Keyword).keyword : "";
        if (!keyword) return null;
        const priority = "priority" in item ? (item as Keyword).priority : "medium";
        const normalizedPriority: Keyword["priority"] =
          priority === "high" || priority === "low" ? priority : "medium";
        return { keyword, priority: normalizedPriority };
      }
      return null;
    })
    .filter((item): item is Keyword => Boolean(item));
}

export function normalizeParticipants(source: unknown): Participant[] {
  if (!Array.isArray(source)) return [];
  return source
    .map((item) => {
      if (typeof item === "string") {
        return { name: item, summary: "" };
      }
      if (item && typeof item === "object") {
        const name = "name" in item ? String((item as Participant).name) : "";
        if (!name) return null;
        return {
          name,
          position: (item as Participant).position,
          summary: typeof (item as Participant).summary === "string" ? (item as Participant).summary : "",
          based_on_orders: (item as Participant).based_on_orders,
        };
      }
      return null;
    })
    .filter((item): item is Participant => Boolean(item));
}

export function normalizeTerms(source: unknown): Term[] {
  if (!Array.isArray(source)) return [];
  return source
    .map((item) => {
      if (typeof item === "string") {
        return { term: item, definition: item };
      }
      if (item && typeof item === "object" && "term" in item) {
        return {
          term: (item as Term).term,
          definition: (item as Term).definition ?? "",
        };
      }
      return null;
    })
    .filter((item): item is Term => Boolean(item));
}

export function normalizeDialogs(source: unknown): Dialog[] {
  if (!Array.isArray(source)) return [];
  return source
    .map((item): Dialog | null => {
      if (!item || typeof item !== "object") return null;
      const dialog = item as Partial<Dialog> & { order?: number };
      if (typeof dialog.order === "undefined" || typeof dialog.summary !== "string") {
        return null;
      }
      const order = Number(dialog.order);
      if (Number.isNaN(order)) {
        return null;
      }
      return {
        order,
        summary: dialog.summary,
        soft_language: typeof dialog.soft_language === "string" ? dialog.soft_language : "",
        reaction: (dialog.reaction as Dialog["reaction"]) ?? "中立",
        speaker: dialog.speaker,
        position: dialog.position,
      };
    })
    .filter((item): item is Dialog => Boolean(item));
}

export function normalizeImageKind(value: unknown): ArticleImageKind {
  const allowed: ArticleImageKind[] = ["会議録", "目次", "索引", "附録", "追録"];
  if (typeof value === "string" && allowed.includes(value as ArticleImageKind)) {
    return value as ArticleImageKind;
  }
  return "会議録";
}