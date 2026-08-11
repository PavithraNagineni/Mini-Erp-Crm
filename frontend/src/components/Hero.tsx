import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Hero({ counts }: { counts: { customers: number; lowStockProducts: number; draftChallans: number; confirmedChallans: number; } }) {
  const { user } = useAuth();
  return (
    <section className="hero" style={{ background: 'var(--color-primary-gradient)', color: '#fff', padding: '3rem 2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Welcome, {user?.name ?? "User"}!</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Here's a quick overview of your business at a glance.</p>
      <div className="hero-stats" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
        <Link to="/customers" className="stat-card" style={{ flex: '1 1 200px' }}>
          <div className="stat-value">{counts.customers}</div>
          <div className="stat-label">Customers</div>
        </Link>
        <Link to="/products?lowStock=true" className="stat-card" style={{ flex: '1 1 200px' }}>
          <div className="stat-value">{counts.lowStockProducts}</div>
          <div className="stat-label">Low‑Stock Products</div>
        </Link>
        <Link to="/challans?status=DRAFT" className="stat-card" style={{ flex: '1 1 200px' }}>
          <div className="stat-value">{counts.draftChallans}</div>
          <div className="stat-label">Draft Challans</div>
        </Link>
        <Link to="/challans?status=CONFIRMED" className="stat-card" style={{ flex: '1 1 200px' }}>
          <div className="stat-value">{counts.confirmedChallans}</div>
          <div className="stat-label">Confirmed Challans</div>
        </Link>
      </div>
    </section>
  );
}
