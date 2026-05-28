import CircleCard from '@/components/CircleCard/CircleCard';
import { circles } from '@/data/socialMock';
import './circles.css';

export default function CirclesPage() {
  return (
    <div className="circles-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Circles</h2>
          <p className="page-subtitle">Community groups for shared wellness tracking</p>
        </div>
      </header>
      <div className="circles-grid">
        {circles.map((c) => (
          <CircleCard key={c.id} circle={c} />
        ))}
      </div>
    </div>
  );
}
