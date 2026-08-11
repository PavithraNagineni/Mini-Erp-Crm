import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { challanApi, customerApi, productApi } from "../../api/endpoints";
import type { Customer, Product } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";

interface LineItem {
  productId: string;
  quantity: string;
}

export function ChallanForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ productId: "", quantity: "1" }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLookups() {
      const [custRes, prodRes] = await Promise.all([
        customerApi.list({ page: 1, limit: 100 }),
        productApi.list({ page: 1, limit: 200 }),
      ]);
      setCustomers(custRes.data.data);
      setProducts(prodRes.data.data);

      if (id) {
        const challanRes = await challanApi.get(id);
        const c = challanRes.data;
        if (c.status !== "DRAFT") {
          setError(`This challan is ${c.status} and can no longer be edited.`);
        }
        setCustomerId(c.customer.id);
        setItems(c.items.map((it) => ({ productId: it.productId, quantity: String(it.quantity) })));
      }
    }
    loadLookups()
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItemRow() {
    setItems((prev) => [...prev, { productId: "", quantity: "1" }]);
  }

  function removeItemRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function productStock(productId: string) {
    return products.find((p) => p.id === productId)?.currentStock;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const validItems = items
      .filter((it) => it.productId && Number(it.quantity) > 0)
      .map((it) => ({ productId: it.productId, quantity: Number(it.quantity) }));

    if (!customerId) return setError("Please select a customer.");
    if (validItems.length === 0) return setError("Add at least one product line item.");

    setSaving(true);
    try {
      if (isEdit && id) {
        await challanApi.update(id, { customerId, items: validItems });
        navigate(`/challans/${id}`);
      } else {
        const res = await challanApi.create({ customerId, items: validItems });
        navigate(`/challans/${res.data.id}`);
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
        <h1>{isEdit ? "Edit Challan (Draft)" : "New Sales Challan"}</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="form-full">
          Customer *
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
            <option value="">Select a customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.businessName ? `(${c.businessName})` : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="form-full">
          <h3>Line Items</h3>
          {items.map((item, idx) => (
            <div className="line-item-row" key={idx}>
              <select value={item.productId} onChange={(e) => updateItem(idx, { productId: e.target.value })} required>
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) - {p.currentStock} in stock
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                required
              />
              {item.productId && productStock(item.productId) !== undefined && Number(item.quantity) > (productStock(item.productId) || 0) && (
                <span className="text-danger" style={{ fontSize: "0.8rem" }}>
                  Exceeds current stock ({productStock(item.productId)})
                </span>
              )}
              <button type="button" className="btn btn-ghost" onClick={() => removeItemRow(idx)} disabled={items.length === 1}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addItemRow}>
            + Add Product
          </button>
        </div>

        <div className="form-actions form-full">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save Draft" : "Create Draft Challan"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
        <p className="text-muted form-full">
          Challans are saved as <strong>Draft</strong> first. Stock is only reduced when you confirm the challan
          from its detail page, and confirming will fail if any product no longer has enough stock.
        </p>
      </form>
    </div>
  );
}
