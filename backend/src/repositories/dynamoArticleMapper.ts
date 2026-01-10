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
  SoftLanguageSummary,
} from "@shared/types/article";

export type DynamoArticleItem = {
  PK: string;
  SK: string;
  title: string;
  description: string;
  date: string;
  month: string;
  categories?: string[];
  keywords?: Keyword[];
  participants?: Participant[];
  imageKind?: ArticleImageKind;
  session?: number;
  nameOfHouse?: string;
  nameOfMeeting?: string;
  terms?: Term[];
  summary?: Summary;
  soft_language_summary?: SoftLanguageSummary;
  middle_summary?: MiddleSummary[];
  dialogs?: Dialog[];
  asset_key?: string;
  asset_url?: string;
};

export type DynamoIndexItem = {
  PK: string;
  SK: string;
  articleId: string;
  title: string;
  description?: string;
  date: string;
  month: string;
  categories?: string[];
  keywords?: Keyword[];
  participants?: Participant[];
  imageKind?: ArticleImageKind;
  session?: number;
  nameOfHouse?: string;
  nameOfMeeting?: string;
  asset_key?: string;
  asset_url?: string;
};

export type ArticleAssetData = {
  summary?: Summary;
  soft_language_summary?: SoftLanguageSummary;
  middle_summary?: MiddleSummary[];
  dialogs?: Dialog[];
};

export function mapArticleToSummary(item: Record<string, unknown>, signedAssetUrl?: string | null): ArticleSummary {
  const article = mapItemToArticle(item as DynamoArticleItem, undefined, signedAssetUrl);
  return toSummary(article);
}

export function mapItemToArticle(
  item: DynamoArticleItem,
  asset?: ArticleAssetData,
  signedAssetUrl?: string | null,
): Article {
  assertArticleRecord(item);
  const id = item.PK.replace("A#", "");
  return {
    id,
    title: item.title ?? "",
    description: item.description ?? "",
    date: item.date ?? "",
    month: item.month ?? "",
    categories: item.categories ?? [],
    keywords: item.keywords ?? [],
    participants: item.participants ?? [],
    imageKind: item.imageKind ?? "会議録",
    session: item.session ?? 0,
    nameOfHouse: item.nameOfHouse ?? "",
    nameOfMeeting: item.nameOfMeeting ?? "",
    summary: asset?.summary ?? item.summary ?? { based_on_orders: [], summary: "" },
    soft_language_summary: asset?.soft_language_summary ?? item.soft_language_summary ?? {
      based_on_orders: [],
      summary: "",
    },
    middle_summary: asset?.middle_summary ?? item.middle_summary ?? [],
    dialogs: asset?.dialogs ?? item.dialogs ?? [],
    terms: item.terms ?? [],
    assetUrl: resolveAssetUrl(item, signedAssetUrl),
  };
}

export function mapIndexToSummary(item: Record<string, unknown>, signedAssetUrl?: string | null): ArticleSummary | undefined {
  if (!item) return undefined;
  const record = item as DynamoIndexItem;
  assertIndexRecord(record);

  return {
    id: record.articleId ?? record.PK?.split("#").pop() ?? "",
    title: record.title,
    description: record.description ?? "",
    date: record.date,
    month: record.month,
    categories: record.categories ?? [],
    keywords: record.keywords ?? [],
    participants: record.participants ?? [],
    imageKind: record.imageKind ?? "会議録",
    session: record.session ?? 0,
    nameOfHouse: record.nameOfHouse ?? "",
    nameOfMeeting: record.nameOfMeeting ?? "",
    assetUrl: resolveAssetUrl(record, signedAssetUrl),
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
    assetUrl,
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
    assetUrl,
  };
}

function resolveAssetUrl(
  item: Pick<DynamoArticleItem, "asset_url"> | Pick<DynamoIndexItem, "asset_url">,
  signedAssetUrl?: string | null,
): string {
  const url = (signedAssetUrl ?? item.asset_url ?? "").trim();
  if (!url) {
    const identifier = (item as DynamoArticleItem).PK ?? (item as DynamoIndexItem).articleId ?? "unknown";
    throw new Error(`Missing asset URL for article ${identifier}`);
  }
  return url;
}

function assertArticleRecord(item: DynamoArticleItem) {
  if (!item?.PK) throw new Error("Dynamo article item missing PK");
  if (!item.title) throw new Error(`Dynamo article item ${item.PK} missing title`);
  if (!item.description) throw new Error(`Dynamo article item ${item.PK} missing description`);
  if (!item.date) throw new Error(`Dynamo article item ${item.PK} missing date`);
  if (!item.month) throw new Error(`Dynamo article item ${item.PK} missing month`);
  if (!item.summary && (!item.soft_language_summary || !item.middle_summary || !item.dialogs)) {
    // At least one of the rich summary fields should be present
    throw new Error(`Dynamo article item ${item.PK} missing summary fields`);
  }
}

function assertIndexRecord(item: DynamoIndexItem) {
  if (!item?.PK) throw new Error("Dynamo index item missing PK");
  if (!item.title) throw new Error(`Dynamo index item ${item.PK} missing title`);
  if (!item.date) throw new Error(`Dynamo index item ${item.PK} missing date`);
  if (!item.month) throw new Error(`Dynamo index item ${item.PK} missing month`);
}
