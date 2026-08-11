import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { productApi } from "../../api/endpoints";
import type { Product } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import { Pagination } from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";

export function ProductList() {
  const { hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get("lowStock") === "true");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await productApi.list({ search, lowStock: lowStockOnly || undefined, page, limit: 15 });
        if (!mounted) return;
        setProducts(res.data.data);
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
  }, [search, lowStockOnly, page]);

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        {hasRole("ADMIN", "WAREHOUSE") && (
          <Link to="/products/new" className="btn btn-primary">
            + Add Product
          </Link>
        )}
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search by name, SKU, category..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => {
              setPage(1);
              setLowStockOnly(e.target.checked);
              setSearchParams(e.target.checked ? { lowStock: "true" } : {});
            }}
          />
          Low stock only
        </label>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Stock</th>
              <th>Min Alert</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Loading...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7}>No products found.</td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className={p.isLowStock ? "row-low-stock" : ""}>
                  <td>
                    <Link to={`/products/${p.id}`}>{p.name}</Link>
                  </td>
                  <td>{p.sku}</td>
                  <td>{p.category || "-"}</td>
                  <td>₹{Number(p.unitPrice).toFixed(2)}</td>
                  <td>
                    {p.currentStock}
                    {p.isLowStock && <span className="low-stock-tag">LOW</span>}
                  </td>
                  <td>{p.minStockAlert}</td>
                  <td>{p.location || "-"}</td>
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
