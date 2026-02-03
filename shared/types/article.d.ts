export type BaseSummary = {
    based_on_orders: number[];
    summary: string;
};
export type Summary = BaseSummary;
export type SoftLanguageSummary = BaseSummary;
export type MiddleSummary = BaseSummary;
export type DialogSectionTitle = "主張" | "説明" | "質問" | "回答" | "根拠" | "影響" | "次の対応" | "決定";
export type DialogSection = {
    title: DialogSectionTitle;
    bullets: string[];
};
export type Reaction = "賛成" | "反対" | "質問" | "回答" | "中立";
export type Dialog = {
    order: number;
    summary_sections: DialogSection[];
    soft_language_sections: DialogSection[];
    reaction: Reaction;
    qa?: {
        ask: {
            question: string;
            who: string;
            orders: number[];
        };
        answer: string;
        answer_orders: number[];
    } | {
        ask: {
            question: string;
            who: string;
            orders: number[];
        };
        answer: string;
        answer_orders: number[];
    }[];
    original_text: string;
    speaker?: string;
    position?: string;
};
export type Participant = {
    name: string;
    position?: string;
    summary: string;
    based_on_orders?: number[];
};
export type KeywordPriority = "high" | "medium" | "low";
export type Keyword = {
    keyword: string;
    priority: KeywordPriority;
};
export type Term = {
    term: string;
    definition: string;
};
export type ArticleImageKind = "会議録" | "目次" | "索引" | "附録" | "追録";
export type ArticleSummary = {
    id: string;
    title: string;
    description: string;
    date: string;
    month: string;
    prompt_version?: string;
    categories: string[];
    participants: Participant[];
    keywords: Keyword[];
    imageKind: ArticleImageKind;
    session: number;
    nameOfHouse: string;
    nameOfMeeting: string;
    assetUrl: string;
};

/**
 * Asset data loaded from R2 via assetUrl
 */
export type ArticleAssetData = {
    key_points: string[];
    summary: Summary;
    soft_language_summary: SoftLanguageSummary;
    middle_summary: MiddleSummary[];
    dialogs: Dialog[];
};

export default interface Article extends ArticleSummary {
    summary?: Summary;
    soft_language_summary?: SoftLanguageSummary;
    middle_summary?: MiddleSummary[];
    key_points?: string[];
    dialogs?: Dialog[];
    participants: Participant[];
    keywords: Keyword[];
    terms?: Term[];
}
export type { Article };
export type SearchFilters = {
    words?: string[];
    categories?: string[];
    houses?: string[];
    meetings?: string[];
    dateStart?: string;
    dateEnd?: string;
    sort?: "date_desc" | "date_asc";
    limit?: number;
};
