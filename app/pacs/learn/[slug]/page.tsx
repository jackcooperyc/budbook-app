import Link from 'next/link';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { getLearnArticle } from '@lib/repositories/learn';
import { renderLearnMarkdown } from '@lib/learn/renderMarkdown';
import EmptyState from '@/components/EmptyState/EmptyState';
import Chip from '@/components/Chip/Chip';
import Button from '@/components/Button/Button';
import '../learn.css';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

export default async function LearnArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = await getLearnArticle(decodeURIComponent(slug));

  if (!article) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Article not found"
        description="This Learn article is not in the CMS. Browse the library for available guides."
        action={
          <Link href="/pacs/learn">
            <Button variant="primary" size="sm">
              Back to Learn
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <article className="learn-detail">
      <Link href="/pacs/learn" className="learn-detail-back">
        <ArrowLeft size={14} strokeWidth={1.75} />
        Learn
      </Link>

      <header className="learn-detail-hero glass-panel">
        <div className="learn-detail-meta">
          <Chip label={article.category} />
          <time className="meta-numeric" dateTime={article.published_at}>
            {new Date(article.published_at).toLocaleDateString()}
          </time>
        </div>
        <h1 className="page-title">{article.title}</h1>
        <p className="learn-detail-summary">{article.summary}</p>
        {article.tags.length > 0 && (
          <p className="learn-card-tags">
            {article.tags.map((tag) => (
              <span key={tag} className="learn-tag">
                {tag}
              </span>
            ))}
          </p>
        )}
      </header>

      <div className="learn-detail-body glass-panel">{renderLearnMarkdown(article.body)}</div>

      <p className="learn-detail-updated meta-numeric">
        Updated {new Date(article.updated_at).toLocaleDateString()}
      </p>
    </article>
  );
}
