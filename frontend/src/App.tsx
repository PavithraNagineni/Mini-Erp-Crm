import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { CustomerList } from "./pages/customers/CustomerList";
import { CustomerForm } from "./pages/customers/CustomerForm";
import { CustomerDetail } from "./pages/customers/CustomerDetail";
import { ProductList } from "./pages/products/ProductList";
import { ProductForm } from "./pages/products/ProductForm";
import { ProductDetail } from "./pages/products/ProductDetail";
import { ChallanList } from "./pages/challans/ChallanList";
import { ChallanForm } from "./pages/challans/ChallanForm";
import { ChallanDetail } from "./pages/challans/ChallanDetail";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />

              <Route path="/customers" element={<CustomerList />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route element={<ProtectedRoute roles={["ADMIN", "SALES"]} />}>
                <Route path="/customers/new" element={<CustomerForm />} />
                <Route path="/customers/:id/edit" element={<CustomerForm />} />
              </Route>

              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route element={<ProtectedRoute roles={["ADMIN", "WAREHOUSE"]} />}>
                <Route path="/products/new" element={<ProductForm />} />
                <Route path="/products/:id/edit" element={<ProductForm />} />
              </Route>

              <Route path="/challans" element={<ChallanList />} />
              <Route path="/challans/:id" element={<ChallanDetail />} />
              <Route element={<ProtectedRoute roles={["ADMIN", "SALES"]} />}>
                <Route path="/challans/new" element={<ChallanForm />} />
                <Route path="/challans/:id/edit" element={<ChallanForm />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
