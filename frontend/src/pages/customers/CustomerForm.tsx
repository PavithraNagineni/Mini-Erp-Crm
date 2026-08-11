import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { customerApi } from "../../api/endpoints";
import type { Customer } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";

const emptyForm = {
  name: "",
  mobile: "",
  email: "",
  businessName: "",
  gstNumber: "",
  customerType: "RETAIL" as Customer["customerType"],
  address: "",
  status: "LEAD" as Customer["status"],
  followUpDate: "",
};

export function CustomerForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    customerApi
      .get(id)
      .then((res) => {
        const c = res.data;
        setForm({
          name: c.name,
          mobile: c.mobile,
          email: c.email || "",
          businessName: c.businessName || "",
          gstNumber: c.gstNumber || "",
          customerType: c.customerType,
          address: c.address || "",
          status: c.status,
          followUpDate: c.followUpDate ? c.followUpDate.substring(0, 10) : "",
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
        ...form,
        followUpDate: form.followUpDate ? new Date(form.followUpDate).toISOString() : "",
      };
      if (isEdit && id) {
        await customerApi.update(id, payload);
        navigate(`/customers/${id}`);
      } else {
        const res = await customerApi.create(payload);
        navigate(`/customers/${res.data.id}`);
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
        <h1>{isEdit ? "Edit Customer" : "Add Customer"}</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Name *
          <input required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label>
          Mobile *
          <input required value={form.mobile} onChange={(e) => set("mobile", e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label>
          Business Name
          <input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
        </label>
        <label>
          GST Number
          <input value={form.gstNumber} onChange={(e) => set("gstNumber", e.target.value)} />
        </label>
        <label>
          Customer Type *
          <select value={form.customerType} onChange={(e) => set("customerType", e.target.value as Customer["customerType"])}>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </label>
        <label>
          Status
          <select value={form.status} onChange={(e) => set("status", e.target.value as Customer["status"])}>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <label>
          Follow-up Date
          <input type="date" value={form.followUpDate} onChange={(e) => set("followUpDate", e.target.value)} />
        </label>
        <label className="form-full">
          Address
          <textarea value={form.address} onChange={(e) => set("address", e.target.value)} rows={3} />
        </label>

        <div className="form-actions form-full">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Customer"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
