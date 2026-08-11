import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { productApi } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  unitPrice: "",
  currentStock: "0",
  minStockAlert: "0",
  location: "",
};

export function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    productApi
      .get(id)
      .then((res) => {
        const p = res.data;
        setForm({
          name: p.name,
          sku: p.sku,
          category: p.category || "",
          unitPrice: String(p.unitPrice),
          currentStock: String(p.currentStock),
          minStockAlert: String(p.minStockAlert),
          location: p.location || "",
        });
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        category: form.category || undefined,
        unitPrice: Number(form.unitPrice),
        currentStock: isEdit ? undefined : Number(form.currentStock || 0),
        minStockAlert: Number(form.minStockAlert || 0),
        location: form.location || undefined,
      };
      if (isEdit && id) {
        await productApi.update(id, payload);
        navigate(`/products/${id}`);
      } else {
        const res = await productApi.create(payload);
        navigate(`/products/${res.data.id}`);
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? "Edit Product" : "Add Product"}</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Name *
          <input required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label>
          SKU / Code *
          <input required value={form.sku} onChange={(e) => set("sku", e.target.value)} disabled={isEdit} />
        </label>
        <label>
          Category
          <input value={form.category} onChange={(e) => set("category", e.target.value)} />
        </label>
        <label>
          Unit Price *
          <input required type="number" step="0.01" min="0" value={form.unitPrice} onChange={(e) => set("unitPrice", e.target.value)} />
        </label>
        {!isEdit && (
          <label>
            Opening Stock
            <input type="number" min="0" value={form.currentStock} onChange={(e) => set("currentStock", e.target.value)} />
          </label>
        )}
        <label>
          Minimum Stock Alert Qty
          <input type="number" min="0" value={form.minStockAlert} onChange={(e) => set("minStockAlert", e.target.value)} />
        </label>
        <label>
          Location / Warehouse
          <input value={form.location} onChange={(e) => set("location", e.target.value)} />
        </label>

        <div className="form-actions form-full">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>

      {isEdit && (
        <p className="text-muted" style={{ marginTop: "0.75rem" }}>
          To adjust stock, use the Stock Movement panel on the product detail page instead of editing this form
          directly — that keeps the movement log accurate.
        </p>
      )}
    </div>
  );
}
