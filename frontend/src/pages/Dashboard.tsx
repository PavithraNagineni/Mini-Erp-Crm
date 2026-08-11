import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { customerApi, productApi, challanApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";

export function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    customers: 0,
    lowStockProducts: 0,
    draftChallans: 0,
    confirmedChallans: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [customers, lowStock, drafts, confirmed] = await Promise.all([
          customerApi.list({ page: 1, limit: 1 }),
          productApi.list({ page: 1, limit: 1, lowStock: true }),
          challanApi.list({ page: 1, limit: 1, status: "DRAFT" }),
          challanApi.list({ page: 1, limit: 1, status: "CONFIRMED" }),
        ]);
        if (!mounted) return;
        setCounts({
          customers: customers.data.total,
          lowStockProducts: lowStock.data.total,
          draftChallans: drafts.data.total,
          confirmedChallans: confirmed.data.total,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {user?.name}</h1>
        <p className="text-muted">Role: {user?.role}</p>
      </div>

      {loading ? (
        <div className="page-loading">Loading overview...</div>
      ) : (
        <div className="card-grid">
          <Link to="/customers" className="stat-card">
            <div className="stat-value">{counts.customers}</div>
            <div className="stat-label">Total Customers</div>
          </Link>
          <Link to="/products?lowStock=true" className="stat-card stat-warning">
            <div className="stat-value">{counts.lowStockProducts}</div>
            <div className="stat-label">Low Stock Products</div>
          </Link>
          <Link to="/challans?status=DRAFT" className="stat-card">
            <div className="stat-value">{counts.draftChallans}</div>
            <div className="stat-label">Draft Challans</div>
          </Link>
          <Link to="/challans?status=CONFIRMED" className="stat-card stat-success">
            <div className="stat-value">{counts.confirmedChallans}</div>
            <div className="stat-label">Confirmed Challans</div>
          </Link>
        </div>
      )}
    </div>
  );
}
