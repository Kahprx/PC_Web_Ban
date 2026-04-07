import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import MainLayout from "./layouts/MainLayout";
import { useAuth } from "./context/AuthContext";

import Dashboard from "./pages/admin/Dashboard";
import OrderManager from "./pages/admin/OrderManager";
import ProductForm from "./pages/admin/ProductForm";
import ProductManager from "./pages/admin/ProductManager";
import SupportChatManager from "./pages/admin/SupportChatManager";
import UserManager from "./pages/admin/UserManager";

import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";

import BuildPC from "./pages/buildpc/BuildPC";
import Cart from "./pages/cart/Cart";
import Category from "./pages/category/Category";
import Checkout from "./pages/checkout/Checkout";
import Confirm from "./pages/checkout/Confirm";
import NotFound from "./pages/common/NotFound";
import About from "./pages/content/About";
import Blog from "./pages/content/Blog";
import BlogDetail from "./pages/content/BlogDetail";
import Contact from "./pages/content/Contact";
import PolicyWarranty from "./pages/content/PolicyWarranty";
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
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/policy-warranty" element={<PolicyWarranty />} />

        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/confirm" element={<Confirm />} />
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
      <Route path="/reset-password" element={<ResetPassword />} />
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
        <Route path="support-chat" element={<SupportChatManager />} />
        <Route path="users" element={<UserManager />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
