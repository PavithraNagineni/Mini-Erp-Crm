import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { productApi } from "../../api/endpoints";
import type { Product, StockMovement } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export function ProductDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [movementType, setMovementType] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!id) return;
    try {
      const [p, m] = await Promise.all([productApi.get(id), productApi.listMovements(id, { page: 1, limit: 20 })]);
      setProduct(p.data);
      setMovements(m.data.data);
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

  async function handleAdjust(e: FormEvent) {
    e.preventDefault();
    if (!id || !quantity || !reason.trim()) return;
    setSubmitting(true);
    setFormError("");
    try {
      await productApi.addStockMovement(id, {
        quantityChanged: Number(quantity),
        movementType,
        reason: reason.trim(),
      });
      setQuantity("");
      setReason("");
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!product) return <p>Product not found.</p>;

  return (
    <div>
      <div className="page-header">
        <h1>{product.name}</h1>
        {hasRole("ADMIN", "WAREHOUSE") && (
          <Link to={`/products/${product.id}/edit`} className="btn btn-secondary">
            Edit
          </Link>
        )}
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Details</h3>
          <dl>
            <dt>SKU</dt>
            <dd>{product.sku}</dd>
            <dt>Category</dt>
            <dd>{product.category || "-"}</dd>
            <dt>Unit Price</dt>
            <dd>₹{Number(product.unitPrice).toFixed(2)}</dd>
            <dt>Current Stock</dt>
            <dd>
              {product.currentStock}{" "}
              {product.currentStock <= product.minStockAlert && <span className="low-stock-tag">LOW STOCK</span>}
            </dd>
            <dt>Minimum Alert Qty</dt>
            <dd>{product.minStockAlert}</dd>
            <dt>Location</dt>
            <dd>{product.location || "-"}</dd>
          </dl>
        </div>

        {hasRole("ADMIN", "WAREHOUSE") && (
          <div className="detail-card">
            <h3>Adjust Stock</h3>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form className="stock-form" onSubmit={handleAdjust}>
              <label>
                Movement Type
                <select value={movementType} onChange={(e) => setMovementType(e.target.value as "IN" | "OUT")}>
                  <option value="IN">IN (add stock)</option>
                  <option value="OUT">OUT (remove stock)</option>
                </select>
              </label>
              <label>
                Quantity
                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </label>
              <label>
                Reason
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Purchase order received" required />
              </label>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Record Movement"}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="detail-card">
        <h3>Stock Movement Log</h3>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={5}>No movements recorded yet.</td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.createdAt).toLocaleString()}</td>
                    <td className={m.movementType === "IN" ? "text-success" : "text-danger"}>{m.movementType}</td>
                    <td>{m.quantityChanged}</td>
                    <td>{m.reason}</td>
                    <td>{m.createdBy.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
