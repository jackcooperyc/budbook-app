/** Curated Learn CMS article (education & harm-reduction). */
export type LearnArticle = {
  slug: string;
  title: string;
  summary: string;
  /** Free-form category label, e.g. "Harm reduction", "Lab literacy". */
  category: string;
  tags: string[];
  /** Markdown body (headings, paragraphs, lists, links, emphasis). */
  body: string;
  published_at: string;
  updated_at: string;
};

export type LearnArticleSummary = Omit<LearnArticle, 'body'>;
