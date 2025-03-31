export interface DelusionalStats {
  analyzedComments: number;
  delusionalComments: number;
  percentage: number;
}

export interface XparaArticle {
  threadId: string;
  headline: string;
  article: string;
  delusionalStats: DelusionalStats;
  generatedAt: number;
}

export interface XparaApiResponse {
  articles: XparaArticle[];
} 