import type {
  ArticleImageKind,
  Dialog,
  Keyword,
  MiddleSummary,
  Participant,
  SoftLanguageSummary,
  Summary,
  Term,
} from "../../types/article";

export type DynamoArticleItem = {
  PK: string;
  SK: string;
  title: string;
  description: string;
  date: string;
  month: string;
  prompt_version?: string;
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
  key_points?: string[];
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
  prompt_version?: string;
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
  key_points?: string[];
  summary?: Summary;
  soft_language_summary?: SoftLanguageSummary;
  middle_summary?: MiddleSummary[];
  dialogs?: Dialog[];
};
