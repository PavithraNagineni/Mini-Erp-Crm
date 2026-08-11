import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { customerApi } from "../../api/endpoints";
import type { Customer } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import { Badge } from "../../components/Badge";
import { useAuth } from "../../context/AuthContext";

export function CustomerDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  async function load() {
    if (!id) return;
    try {
      const res = await customerApi.get(id);
      setCustomer(res.data);
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

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!id || !note.trim()) return;
    setAddingNote(true);
    try {
      await customerApi.addNote(id, note.trim());
      setNote("");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setAddingNote(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!customer) return <p>Customer not found.</p>;

  return (
    <div>
      <div className="page-header">
        <h1>{customer.name}</h1>
        {hasRole("ADMIN", "SALES") && (
          <Link to={`/customers/${customer.id}/edit`} className="btn btn-secondary">
            Edit
          </Link>
        )}
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Details</h3>
          <dl>
            <dt>Business</dt>
            <dd>{customer.businessName || "-"}</dd>
            <dt>Mobile</dt>
            <dd>{customer.mobile}</dd>
            <dt>Email</dt>
            <dd>{customer.email || "-"}</dd>
            <dt>GST Number</dt>
            <dd>{customer.gstNumber || "-"}</dd>
            <dt>Type</dt>
            <dd>{customer.customerType}</dd>
            <dt>Status</dt>
            <dd>
              <Badge status={customer.status} />
            </dd>
            <dt>Follow-up Date</dt>
            <dd>{customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : "-"}</dd>
            <dt>Address</dt>
            <dd>{customer.address || "-"}</dd>
          </dl>
        </div>

        <div className="detail-card">
          <h3>Related Challans</h3>
          {customer.challans && customer.challans.length > 0 ? (
            <ul className="simple-list">
              {customer.challans.map((c) => (
                <li key={c.id}>
                  <Link to={`/challans/${c.id}`}>{c.challanNumber}</Link> - <Badge status={c.status} /> ({c.totalQuantity} qty)
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No challans yet.</p>
          )}
        </div>
      </div>

      <div className="detail-card">
        <h3>Follow-up Notes</h3>
        {hasRole("ADMIN", "SALES") && (
          <form className="note-form" onSubmit={handleAddNote}>
            <textarea
              placeholder="Add a follow-up note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
            <button className="btn btn-primary" type="submit" disabled={addingNote || !note.trim()}>
              {addingNote ? "Adding..." : "Add Note"}
            </button>
          </form>
        )}
        <ul className="note-timeline">
          {(customer.notes || []).map((n) => (
            <li key={n.id}>
              <div className="note-meta">
                {n.createdBy.name} - {new Date(n.createdAt).toLocaleString()}
              </div>
              <div className="note-text">{n.note}</div>
            </li>
          ))}
          {(!customer.notes || customer.notes.length === 0) && <li className="text-muted">No notes yet.</li>}
        </ul>
      </div>
    </div>
  );
}
