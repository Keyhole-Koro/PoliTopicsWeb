import type {
  Article,
  ArticleSummary,
  Participant,
  SearchFilters,
} from "../../types/article";
import type { ArticleAssetData, DynamoArticleItem, DynamoIndexItem } from "./types";

export function mapArticleToSummary(item: DynamoArticleItem): ArticleSummary {
  const article = mapItemToArticle(item, undefined);
  return toSummary(article);
}

export function mapIndexToSummary(item: DynamoIndexItem): ArticleSummary | undefined {
  if (!item) return undefined;

  return {
    id: item.articleId ?? item.PK?.split("#").pop() ?? "",
    title: item.title ?? "",
    description: item.description ?? "",
    date: item.date ?? "",
    month: item.month ?? "",
    prompt_version: item.prompt_version,
    categories: item.categories ?? [],
    keywords: item.keywords ?? [],
    participants: normalizeParticipants(item.participants),
    imageKind: item.imageKind ?? "会議録",
    session: item.session ?? 0,
    nameOfHouse: item.nameOfHouse ?? "",
    nameOfMeeting: item.nameOfMeeting ?? "",
    assetUrl: item.asset_url ?? "",
  };
}

export function mapItemToArticle(item: DynamoArticleItem, asset?: ArticleAssetData): Article {
  const rawId = typeof item.PK === "string" ? item.PK : "";
  const id = rawId ? rawId.replace("A#", "") : "";
  return {
    id,
    title: item.title ?? "",
    description: item.description ?? "",
    date: item.date ?? "",
    month: item.month ?? "",
    prompt_version: item.prompt_version,
    keywords: item.keywords ?? [],
    participants: normalizeParticipants(item.participants),
    imageKind: item.imageKind ?? "会議録",
    session: item.session ?? 0,
    nameOfHouse: item.nameOfHouse ?? "",
    nameOfMeeting: item.nameOfMeeting ?? "",
    // Asset fields - populated by frontend from assetUrl
    summary: asset?.summary ?? item.summary,
    soft_language_summary: asset?.soft_language_summary ?? item.soft_language_summary,
    middle_summary: asset?.middle_summary ?? item.middle_summary,
    key_points: asset?.key_points ?? (item as { key_points?: string[] }).key_points ?? [],
    dialogs: asset?.dialogs ?? item.dialogs,
    categories: item.categories ?? [],
    terms: item.terms,
    assetUrl: item.asset_url ?? "",
  };
}

export function toSummary(article: Article): ArticleSummary {
  return {
    id: article.id,
    title: article.title,
    description: article.description,
    date: article.date,
    month: article.month,
    prompt_version: article.prompt_version,
    categories: article.categories,
    keywords: article.keywords,
    participants: article.participants,
    imageKind: article.imageKind,
    session: article.session,
    nameOfHouse: article.nameOfHouse,
    nameOfMeeting: article.nameOfMeeting,
    assetUrl: article.assetUrl,
  };
}

export function normalizeParticipants(participants?: Participant[]): Participant[] {
  if (!participants) return [];
  return participants.map((participant) => ({
    ...participant,
    name: participant.name ?? "",
    summary: participant.summary ?? "",
    position: participant.position ?? undefined,
    based_on_orders: participant.based_on_orders ?? [],
  }));
}

export function filterArticles(
  articles: ArticleSummary[],
  filters: Pick<SearchFilters, "categories" | "houses" | "meetings" | "dateStart" | "dateEnd">
): ArticleSummary[] {
  const categories = (filters.categories ?? []).map((category) => category.toLowerCase());
  const houses = filters.houses ?? [];
  const meetings = filters.meetings ?? [];
  const startTime = normalizeBoundary(filters.dateStart, "start");
  const endTime = normalizeBoundary(filters.dateEnd, "end");

  return articles.filter((article) => {
    if (
      categories.length > 0 &&
      !article.categories.some((category) => categories.includes(category.toLowerCase()))
    ) {
      return false;
    }
    if (houses.length > 0 && !houses.includes(article.nameOfHouse)) {
      return false;
    }
    if (meetings.length > 0 && !meetings.includes(article.nameOfMeeting)) {
      return false;
    }

    if (!startTime && !endTime) {
      return true;
    }

    const articleDate = Number(new Date(article.date));
    if (Number.isNaN(articleDate)) {
      return false;
    }

    if (startTime && articleDate < startTime) {
      return false;
    }

    if (endTime && articleDate > endTime) {
      return false;
    }

    return true;
  });
}

function normalizeBoundary(value: string | undefined, type: "start" | "end"): number | undefined {
  if (!value) return undefined;
  const timestamp = Number(new Date(value));
  if (Number.isNaN(timestamp)) return undefined;

  const date = new Date(timestamp);
  if (type === "start") {
    date.setHours(0, 0, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }
  return date.getTime();
}
