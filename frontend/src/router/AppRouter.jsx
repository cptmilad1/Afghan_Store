import { Navigate, Route, Routes } from 'react-router';
import AppLayout from '../layout/AppLayout';
import { useAuth } from '../app/providers/authContext';
import HomePage from '../features/home/pages/HomePage';
import CatalogPage from '../features/products/pages/CatalogPage';
import ProductDetailPage from '../features/products/pages/ProductDetailPage';
import ServiceCatalogPage from '../features/services/pages/ServiceCatalogPage';
import ServiceDetailPage from '../features/services/pages/ServiceDetailPage';
import AuthPage from '../features/auth/pages/AuthPage';
import CartPage from '../features/cart/pages/CartPage';
import CheckoutPage from '../features/checkout/pages/CheckoutPage';
import OrdersPage from '../features/orders/pages/OrdersPage';
import ProfilePage from '../features/profile/pages/ProfilePage';
import SellerPage from '../features/seller/pages/SellerPage';
import AdminPage from '../features/admin/pages/AdminPage';
import ChatPage from '../features/chat/pages/ChatPage';
import NotificationsPage from '../features/notifications/pages/NotificationsPage';
import CourierPage from '../features/courier/pages/CourierPage';
import WishlistPage from '../features/wishlist/pages/WishlistPage';
import AboutPage from '../features/home/pages/AboutPage';
import ContactPage from '../features/home/pages/ContactPage';
import NotFoundPage from '../shared/components/NotFoundPage';
import OrderDetailPage from '../features/orders/pages/OrderDetailPage';
import ComparisonsPage from '../features/comparisons/pages/ComparisonsPage';
import CategoriesPage from '../features/categories/pages/CategoriesPage';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-state"><span className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role_name)) return <Navigate to="/" replace />;
  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="marketplace" element={<CatalogPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="services" element={<ServiceCatalogPage />} />
        <Route path="services/:id" element={<ServiceDetailPage />} />
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="register" element={<AuthPage mode="register" />} />
        <Route path="cart" element={<ProtectedRoute roles={['customer']}><CartPage /></ProtectedRoute>} />
        <Route path="checkout" element={<ProtectedRoute roles={['customer']}><CheckoutPage /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="seller" element={<ProtectedRoute><SellerPage /></ProtectedRoute>} />
        <Route path="courier" element={<ProtectedRoute><CourierPage /></ProtectedRoute>} />
        <Route path="wishlist" element={<ProtectedRoute roles={['customer']}><WishlistPage /></ProtectedRoute>} />
        <Route path="comparisons" element={<ProtectedRoute roles={['customer']}><ComparisonsPage /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>} />
        <Route path="chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
