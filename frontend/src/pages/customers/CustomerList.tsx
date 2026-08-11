import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { customerApi } from "../../api/endpoints";
import type { Customer } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import { Badge } from "../../components/Badge";
import { Pagination } from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";

export function CustomerList() {
  const { hasRole } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await customerApi.list({ search, status: status || undefined, page, limit: 15 });
        if (!mounted) return;
        setCustomers(res.data.data);
        setTotalPages(res.data.totalPages);
        setError("");
      } catch (err) {
        if (mounted) setError(apiErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }, 300);
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [search, status, page]);

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        {hasRole("ADMIN", "SALES") && (
          <Link to="/customers/new" className="btn btn-primary">
            + Add Customer
          </Link>
        )}
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search by name, mobile, business, email..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          className="input"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Business</th>
              <th>Mobile</th>
              <th>Type</th>
              <th>Status</th>
              <th>Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Loading...</td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6}>No customers found.</td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/customers/${c.id}`}>{c.name}</Link>
                  </td>
                  <td>{c.businessName || "-"}</td>
                  <td>{c.mobile}</td>
                  <td>{c.customerType}</td>
                  <td>
                    <Badge status={c.status} />
                  </td>
                  <td>{c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : "-"}</td>
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
