import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@erp.test");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Mini ERP + CRM</h1>
        <p className="auth-subtitle">Sign in to the operations portal</p>

        {error && <div className="alert alert-error">{error}</div>}

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>

        <div className="auth-hint">
          Seeded test accounts (password: <code>Password123!</code>):
          <ul>
            <li>admin@erp.test</li>
            <li>sales@erp.test</li>
            <li>warehouse@erp.test</li>
            <li>accounts@erp.test</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
