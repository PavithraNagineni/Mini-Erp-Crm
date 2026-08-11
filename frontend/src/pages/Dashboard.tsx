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
    <div className="dashboard-wrapper">
      {/* Welcome Banner */}
      <div className="dashboard-hero-banner">
        <div className="hero-text">
          <h2>Welcome back, {user?.name === "Ava Admin" || !user?.name ? "Your System Engineer" : user.name}</h2>
          <p>Here is your enterprise overview for today. Monitor metrics, stock alerts, and sales challans.</p>
        </div>
        <div className="hero-actions">
          <Link to="/customers" className="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            Manage Customers
          </Link>
          <Link to="/challans" className="btn btn-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            Create Challan
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="page-loading">
          <div className="spinner"></div>
          <span>Loading overview metrics...</span>
        </div>
      ) : (
        <>
          {/* Top Row KPI Cards */}
          <div className="kpi-grid">
            <Link to="/customers" className="kpi-card card-blue">
              <div className="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Total Customers</span>
                <span className="kpi-value">{counts.customers}</span>
                <span className="kpi-status status-blue">Active CRM Accounts</span>
              </div>
            </Link>

            <Link to="/products?lowStock=true" className="kpi-card card-amber">
              <div className="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Low Stock Products</span>
                <span className="kpi-value">{counts.lowStockProducts}</span>
                <span className={`kpi-status ${counts.lowStockProducts > 0 ? 'status-amber' : 'status-green'}`}>
                  {counts.lowStockProducts > 0 ? "Reorder Needed" : "Stock Normal"}
                </span>
              </div>
            </Link>

            <Link to="/challans?status=DRAFT" className="kpi-card card-indigo">
              <div className="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Draft Challans</span>
                <span className="kpi-value">{counts.draftChallans}</span>
                <span className="kpi-status status-indigo">Pending Confirmation</span>
              </div>
            </Link>

            <Link to="/challans?status=CONFIRMED" className="kpi-card card-emerald">
              <div className="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Confirmed Challans</span>
                <span className="kpi-value">{counts.confirmedChallans}</span>
                <span className="kpi-status status-emerald">Dispatched / Completed</span>
              </div>
            </Link>
          </div>

          {/* Business Modules Grid */}
          <div className="modules-section">
            <h3 className="section-title">Quick Operations</h3>
            <div className="modules-grid">
              <div className="module-card">
                <div className="module-header">
                  <div className="module-icon icon-users">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  </div>
                  <h4>Customer Directory</h4>
                </div>
                <p>Manage client information, contact records, and sales history across accounts.</p>
                <Link to="/customers" className="module-link">
                  View Customers &rarr;
                </Link>
              </div>

              <div className="module-card">
                <div className="module-header">
                  <div className="module-icon icon-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  </div>
                  <h4>Inventory & Products</h4>
                </div>
                <p>Track product catalogs, monitor inventory stock levels, and update pricing.</p>
                <Link to="/products" className="module-link">
                  Manage Products &rarr;
                </Link>
              </div>

              <div className="module-card">
                <div className="module-header">
                  <div className="module-icon icon-file">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <h4>Sales Delivery Challans</h4>
                </div>
                <p>Generate, issue, and track delivery challans for verified customer dispatch.</p>
                <Link to="/challans" className="module-link">
                  View Sales Challans &rarr;
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

