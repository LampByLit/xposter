export interface Article {
  threadId: number;
  headline: string;
  article: string;
  antisemiticStats: {
    analyzedComments: number;
    antisemiticComments: number;
    percentage: number;
  };
  metadata: {
    totalPosts: number;
    analyzedPosts: number;
    generatedAt: number;
  };
}

export interface ArticlesResponse {
  articles: Article[];
  batchStats: {
    totalThreads: number;
    totalAnalyzedPosts: number;
    averageAntisemiticPercentage: number;
    generatedAt: number;
  };
  timestamp: number;
} 