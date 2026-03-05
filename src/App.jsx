import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import MainLayout from "./layouts/MainLayout";
import { useAuth } from "./context/AuthContext";

import Dashboard from "./pages/admin/Dashboard";
import OrderManager from "./pages/admin/OrderManager";
import ProductForm from "./pages/admin/ProductForm";
import ProductManager from "./pages/admin/ProductManager";
import UserManager from "./pages/admin/UserManager";

import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import BuildPC from "./pages/buildpc/BuildPC";
import Cart from "./pages/cart/Cart";
import Category from "./pages/category/Category";
import Checkout from "./pages/checkout/Checkout";
import Confirm from "./pages/checkout/Confirm";
import NotFound from "./pages/common/NotFound";
import Home from "./pages/home/Home";
import OrderDetail from "./pages/order/OrderDetail";
import OrderHistory from "./pages/order/OrderHistory";
import ProductDetail from "./pages/product/ProductDetail";
import ProductList from "./pages/product/ProductList";
import ChangePassword from "./pages/profile/ChangePassword";
import Profile from "./pages/profile/Profile";

function RootEntry() {
  const { isAuthenticated, isAdmin } = useAuth();

  if (isAuthenticated && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/user" replace />;
}

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<RootEntry />} />
        <Route path="/home" element={<Navigate to="/user" replace />} />
        <Route path="/user" element={<Home />} />
        <Route path="/category/:slug" element={<Category />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/build-pc" element={<BuildPC />} />

        <Route
          path="/cart"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/confirm"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <Confirm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <OrderHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductManager />} />
        <Route path="products/create" element={<ProductForm />} />
        <Route path="products/edit/:id" element={<ProductForm />} />
        <Route path="orders" element={<OrderManager />} />
        <Route path="users" element={<UserManager />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
