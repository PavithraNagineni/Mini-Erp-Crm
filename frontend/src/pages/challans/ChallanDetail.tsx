import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { challanApi } from "../../api/endpoints";
import type { Challan } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import { Badge } from "../../components/Badge";
import { useAuth } from "../../context/AuthContext";

export function ChallanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    if (!id) return;
    try {
      const res = await challanApi.get(id);
      setChallan(res.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleConfirm() {
    if (!id) return;
    setActionLoading(true);
    setActionError("");
    try {
      await challanApi.confirm(id);
      await load();
    } catch (err) {
      setActionError(apiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!id) return;
    if (!window.confirm("Cancel this challan? If it was confirmed, stock will be reverted.")) return;
    setActionLoading(true);
    setActionError("");
    try {
      await challanApi.cancel(id);
      await load();
    } catch (err) {
      setActionError(apiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!challan) return <p>Challan not found.</p>;

  const canManage = hasRole("ADMIN", "SALES");

  return (
    <div>
      <div className="page-header">
        <h1>
          {challan.challanNumber} <Badge status={challan.status} />
        </h1>
        <div className="btn-group">
          {canManage && challan.status === "DRAFT" && (
            <>
              <button className="btn btn-secondary" onClick={() => navigate(`/challans/${challan.id}/edit`)}>
                Edit
              </button>
              <button className="btn btn-primary" onClick={handleConfirm} disabled={actionLoading}>
                {actionLoading ? "Confirming..." : "Confirm Challan"}
              </button>
            </>
          )}
          {canManage && challan.status !== "CANCELLED" && (
            <button className="btn btn-danger" onClick={handleCancel} disabled={actionLoading}>
              Cancel Challan
            </button>
          )}
        </div>
      </div>

      {actionError && <div className="alert alert-error">{actionError}</div>}

      <div className="detail-card">
        <h3>Summary</h3>
        <dl>
          <dt>Customer</dt>
          <dd>
            <Link to={`/customers/${challan.customer.id}`}>{challan.customer.businessName || challan.customer.name}</Link>
          </dd>
          <dt>Total Quantity</dt>
          <dd>{challan.totalQuantity}</dd>
          <dt>Created</dt>
          <dd>{new Date(challan.createdAt).toLocaleString()}</dd>
          {challan.createdBy && (
            <>
              <dt>Created By</dt>
              <dd>{challan.createdBy.name}</dd>
            </>
          )}
        </dl>
      </div>

      <div className="detail-card">
        <h3>Line Items</h3>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Unit Price (at time of order)</th>
                <th>Quantity</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((it) => (
                <tr key={it.id}>
                  <td>{it.productNameSnapshot}</td>
                  <td>{it.productSkuSnapshot}</td>
                  <td>₹{Number(it.unitPriceSnapshot).toFixed(2)}</td>
                  <td>{it.quantity}</td>
                  <td>₹{(Number(it.unitPriceSnapshot) * it.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
