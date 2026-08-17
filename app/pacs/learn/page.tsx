import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { listLearnArticles } from '@lib/repositories/learn';
import EmptyState from '@/components/EmptyState/EmptyState';
import Chip from '@/components/Chip/Chip';
import './learn.css';

/** Avoid build-time DB access when Neon schema is not yet migrated. */
export const dynamic = 'force-dynamic';

export default async function LearnPage() {
  let articles: Awaited<ReturnType<typeof listLearnArticles>> = [];

  try {
    articles = await listLearnArticles();
  } catch (err) {
    console.error('[learn] Failed to load articles:', err);
  }

  return (
    <div className="learn-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Learn</h2>
          <p className="page-subtitle">
            Education and harm-reduction resources
            {articles.length > 0
              ? ` · ${articles.length} article${articles.length === 1 ? '' : 's'}`
              : ''}
          </p>
        </div>
      </header>

      {articles.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No articles yet"
          description="Curated Learn content is loaded from the CMS seed pack. Run npm run learn:import to publish articles."
        />
      ) : (
        <ul className="learn-list">
          {articles.map((article) => (
            <li key={article.slug}>
              <Link
                href={`/pacs/learn/${encodeURIComponent(article.slug)}`}
                className="learn-card glass-panel"
              >
                <div className="learn-card-top">
                  <Chip label={article.category} />
                  <time
                    className="learn-card-date meta-numeric"
                    dateTime={article.published_at}
                  >
                    {new Date(article.published_at).toLocaleDateString()}
                  </time>
                </div>
                <h3 className="learn-card-title">{article.title}</h3>
                <p className="learn-card-summary">{article.summary}</p>
                {article.tags.length > 0 && (
                  <p className="learn-card-tags">
                    {article.tags.map((tag) => (
                      <span key={tag} className="learn-tag">
                        {tag}
                      </span>
                    ))}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
