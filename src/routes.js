import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout'; // Import Layout

// 页面组件
import Splash from './pages/Splash';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import MyPosts from './pages/MyPosts';
import Detail from './pages/Detail';
import RechargePaths from './pages/RechargePaths';
import Recharge from './pages/Recharge';
import Withdraw from './pages/Withdraw';
import Notification from './pages/Notification';
import TransactionNotification from './pages/TransactionNotification';
import Settings from './pages/Settings';
import SetPaymentPassword from './pages/SetPaymentPassword';
import CustomerServicePage from './pages/CustomerService';
import OperationResult from './pages/OperationResult';
import NotificationsPage from './pages/Notification';
import WalletPage from './pages/WalletPage';
import InvitedUsers from './pages/InvitedUsers';
import InvitedUserDetail from './pages/InvitedUserDetail';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import ForgotPaymentPassword from './pages/ForgotPaymentPassword';

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return null; // 或者返回一个加载指示器
  }
  
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

// 路由配置数组
export const routesConfig = [
  { path: '/home', element: <Home />, title: '首页' },
  { path: '/profile', element: <Profile />, title: '个人中心' },
  { path: '/profile/edit', element: <ProfileEdit />, title: '编辑个人资料' },
  { path: '/my-posts', element: <MyPosts />, title: '我的发布' },
  { path: '/detail/:id', element: <Detail />, title: '信息详情' },
  { path: '/recharge-paths', element: <RechargePaths />, title: '充值方式' },
  { path: '/recharge-paths/:pathId', element: <Recharge />, title: '充值' },
  { path: '/withdraw', element: <Withdraw />, title: '提现' },
  { path: '/notification', element: <Notification />, title: '通知' },
  { path: '/transaction-notification', element: <TransactionNotification />, title: '交易通知' },
  { path: '/settings', element: <Settings />, title: '设置' },
  { path: '/set-payment-password', element: <SetPaymentPassword />, title: '设置支付密码' },
  { path: '/customer-service', element: <CustomerServicePage />, title: '在线客服' },
  { path: '/operation-result', element: <OperationResult />, title: '操作结果' },
  { path: '/notifications', element: <NotificationsPage />, title: '通知中心' },
  { path: '/wallet', element: <WalletPage />, title: '交易记录' },
  { path: '/invited-users', element: <InvitedUsers />, title: '邀请用户' },
  { path: '/invited-users/:id', element: <InvitedUserDetail />, title: '邀请用户详情' },
  { path: '/change-password', element: <ChangePassword />, title: '修改登入密码' },
  { path: '/forgot-password', element: <ForgotPassword />, title: '找回登入密码' },
  { path: '/forgot-payment-password', element: <ForgotPaymentPassword />, title: '找回支付密码' },
];

// 路由组件
function AppRoutes() {
  return (
    <Routes>
      {/* 公共路由 */}
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* 受保护的路由 */}
      {routesConfig.map((route) => (
        <Route 
          key={route.path} 
          path={route.path} 
          element={<ProtectedRoute>{route.element}</ProtectedRoute>} 
        />
      ))}

      {/* 处理所有其他路由，返回首页 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes; 