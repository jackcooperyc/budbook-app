import LearnCard from '@/components/LearnCard/LearnCard';
import { learnItems } from '@/data/socialMock';
import './learn.css';

export default function LearnPage() {
  return (
    <div className="learn-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Learn</h2>
          <p className="page-subtitle">Courses, guides, and recipes for responsible wellness</p>
        </div>
      </header>
      <div className="learn-list">
        {learnItems.map((item) => (
          <LearnCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
