import { z } from "zod";

// Shared schemas mirroring shared/types/article.d.ts

export const ParticipantSchema = z.object({
  name: z.string(),
  position: z.string().optional(),
  summary: z.string(),
  based_on_orders: z.array(z.number()).optional(),
});

export const KeywordPrioritySchema = z.enum(["high", "medium", "low"]);

export const KeywordSchema = z.object({
  keyword: z.string(),
  priority: KeywordPrioritySchema,
});

export const ArticleImageKindSchema = z.enum(["会議録", "目次", "索引", "附録", "追録"]);

export const ArticleSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  date: z.string(),
  month: z.string(),
  categories: z.array(z.string()),
  participants: z.array(ParticipantSchema),
  keywords: z.array(KeywordSchema),
  imageKind: ArticleImageKindSchema,
  session: z.number(),
  nameOfHouse: z.string(),
  nameOfMeeting: z.string(),
});

export const BaseSummarySchema = z.object({
  based_on_orders: z.array(z.number()),
  summary: z.string(),
});

export const ReactionSchema = z.enum(["賛成", "反対", "質問", "回答", "中立"]);

export const DialogSchema = z.object({
  order: z.number(),
  summary: z.string(),
  soft_language: z.string(),
  reaction: ReactionSchema,
  original_text: z.string(),
  speaker: z.string().optional(),
  position: z.string().optional(),
});

export const TermSchema = z.object({
  term: z.string(),
  definition: z.string(),
});

export const ArticleSchema = ArticleSummarySchema.extend({
  summary: BaseSummarySchema,
  soft_language_summary: BaseSummarySchema,
  middle_summary: z.array(BaseSummarySchema),
  dialogs: z.array(DialogSchema),
  terms: z.array(TermSchema),
});

// Request/Response Schemas for Routes

export const HeadlinesQuerySchema = z.object({
  limit: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
});

export const HeadlinesResponseSchema = z.object({
  items: z.array(ArticleSummarySchema),
  limit: z.number(),
  start: z.number(),
  end: z.number(),
  hasMore: z.boolean(),
});

export const SearchQuerySchema = z.object({
  words: z.string().optional(),
  categories: z.string().optional(),
  houses: z.string().optional(),
  meetings: z.string().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  sort: z.enum(["date_desc", "date_asc"]).optional(),
  limit: z.string().optional(),
});

export const SearchResponseSchema = z.object({
  query: z.object({
    words: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    houses: z.array(z.string()).optional(),
    meetings: z.array(z.string()).optional(),
    dateStart: z.string().optional(),
    dateEnd: z.string().optional(),
    sort: z.enum(["date_desc", "date_asc"]).optional(),
    limit: z.number().optional(),
  }),
  items: z.array(ArticleSummarySchema),
  total: z.number(),
});

export const SuggestQuerySchema = z.object({
  input: z.string().optional(),
  limit: z.string().optional(),
  categories: z.string().optional(),
  houses: z.string().optional(),
  meetings: z.string().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
});

export const SuggestResponseSchema = z.object({
  input: z.string(),
  suggestions: z.array(z.string()),
});

export const ArticleParamsSchema = z.object({
  id: z.string(),
});

export const ArticleResponseSchema = z.union([
  z.object({ article: ArticleSchema }),
  z.object({ message: z.string() }),
]);
