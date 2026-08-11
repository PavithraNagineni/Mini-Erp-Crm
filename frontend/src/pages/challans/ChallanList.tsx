import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { challanApi } from "../../api/endpoints";
import type { Challan } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import { Badge } from "../../components/Badge";
import { Pagination } from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";

export function ChallanList() {
  const { hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    challanApi
      .list({ status: status || undefined, page, limit: 15 })
      .then((res) => {
        if (!mounted) return;
        setChallans(res.data.data);
        setTotalPages(res.data.totalPages);
        setError("");
      })
      .catch((err) => mounted && setError(apiErrorMessage(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [status, page]);

  return (
    <div>
      <div className="page-header">
        <h1>Sales Challans</h1>
        {hasRole("ADMIN", "SALES") && (
          <Link to="/challans/new" className="btn btn-primary">
            + New Challan
          </Link>
        )}
      </div>

      <div className="toolbar">
        <select
          className="input"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
            setSearchParams(e.target.value ? { status: e.target.value } : {});
          }}
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Challan #</th>
              <th>Customer</th>
              <th>Total Qty</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>Loading...</td>
              </tr>
            ) : challans.length === 0 ? (
              <tr>
                <td colSpan={5}>No challans found.</td>
              </tr>
            ) : (
              challans.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/challans/${c.id}`}>{c.challanNumber}</Link>
                  </td>
                  <td>{c.customer.businessName || c.customer.name}</td>
                  <td>{c.totalQuantity}</td>
                  <td>
                    <Badge status={c.status} />
                  </td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
