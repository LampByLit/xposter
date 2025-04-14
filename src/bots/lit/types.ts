export interface LitArticle {
  threadId: string;
  headline: string;
  article: string;
  delusionalStats: {
    analyzedComments: number;
    delusionalComments: number;
    percentage: number;
    examples: Array<{
      threadId: string;
      postId: number;
      content: string;
      timestamp: number;
    }>;
  };
  generatedAt: number;
}

export interface LitApiResponse {
  articles: LitArticle[];
} 