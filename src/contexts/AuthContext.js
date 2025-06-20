import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(null);

// Helper function to ensure user object has _id
const normalizeUserData = (userData) => {
  if (!userData) return null;
  const normalizedUser = { ...userData };
  if (userData.id && !userData._id) {
    normalizedUser._id = userData.id;
  }
  // If _id exists but id doesn't, can also add id for consistency if needed elsewhere,
  // but primary goal here is to ensure _id for internal app use.
  // if (userData._id && !userData.id) {
  //   normalizedUser.id = userData._id;
  // }
  return normalizedUser;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null); // General error for Alert component
  const [authError, setAuthError] = useState(null); // For specific auth errors like device conflict
  const [showDeviceConflictDialog, setShowDeviceConflictDialog] = useState(false); // New state for device conflict dialog
  const [unreadCSCount, setUnreadCSCount] = useState(0);

  const fetchUnreadCSCount = useCallback(async () => {
    if (!isAuthenticated) {
      // console.log('AuthContext: fetchUnreadCSCount skipped - not authenticated');
      return;
    }
    try {
      const response = await apiService.customerService.getUnreadCount();
      if (response.success && response.data && typeof response.data.unreadCount === 'number') {
        setUnreadCSCount(response.data.unreadCount);
      } else {
        // console.log('AuthContext: Invalid response format:', response);
      }
    } catch (err) {
      console.error('AuthContext: Failed to fetch unread CS message count:', err);
    }
  }, [isAuthenticated]);

  // 初始化时自动从 localStorage 恢复 token 和 user
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let intervalId;
    if (isAuthenticated) {
      fetchUnreadCSCount();
      intervalId = setInterval(fetchUnreadCSCount, 60000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAuthenticated, fetchUnreadCSCount]);

  const updateUser = (newUserData) => {
    const normalizedUser = normalizeUserData(newUserData); // Normalize before setting
    if (normalizedUser) {
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    setAuthError(null); // Clear any previous auth-specific error
    setShowDeviceConflictDialog(false); // Ensure dialog is closed before new login attempt

    try {
      const response = await apiService.userService.login(credentials);
      // console.log('[DEBUG AuthContext] API Login Response:', response); // 移除调试日志
      
      if (response && response.success) {
        const { token, user } = response;
        
        if (token && user) {
          const normalizedUser = normalizeUserData(user);
          
          // 保存token和用户信息
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(normalizedUser));
          
          // 设置认证状态
          setIsAuthenticated(true);
          setUser(normalizedUser);
          window.dispatchEvent(new Event('storage'));
          
          // 获取未读消息数
          try {
            const csResponse = await apiService.customerService.getUnreadCount();
            if (csResponse.success && csResponse.data) {
              setUnreadCSCount(csResponse.data.unreadCount || 0);
            }
          } catch (err) {
            console.error('获取未读消息数失败:', err);
          }
        } else {
          throw new Error('登录响应数据不完整');
        }
      } else {
        throw new Error(response?.message || '登录失败');
      }
    } catch (error) {
      console.error('AuthContext - 登录错误 (完整对象):', error);
      // 存储原始错误对象（或其相关数据），供上层组件使用
      const backendErrorData = error.response?.data || { message: error.message || '未知错误' };
      setAuthError(backendErrorData);
      
      // 如果是设备冲突错误，则设置对话框状态
      if (error.response?.status === 403 && backendErrorData.message && backendErrorData.message.includes('已在其他设备登录') && backendErrorData.code === 'DEVICE_CONFLICT') {
        setShowDeviceConflictDialog(true);
      }

      setLoading(false); // 确保在错误时也关闭加载状态
      // 不再在此处直接抛出错误，而是通过 authError 状态传递
    } finally {
      // setLoading(false); // 已经在 catch 块中处理，避免重复
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.userService.register(userData);
      console.log('Received response in AuthContext register:', response);
      localStorage.setItem('token', response.token);
      // updateUser will handle normalization
      updateUser({ ...response.user, token: response.token });
      setIsAuthenticated(true);
      setLoading(false);
      return { success: true, data: response };
    } catch (err) {
      const backendErrorMessage = err.response?.data?.message || err.message || '注册失败';
      console.error('注册失败:', err);
      setError(backendErrorMessage);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { success: false, error: backendErrorMessage };
    }
  };

  const logout = async () => {
    try {
      // 调用后端登出接口
      await apiService.userService.logout();
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      // 无论后端登出是否成功，都清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
      setAuthError(null); // Clear authError on logout
      setShowDeviceConflictDialog(false); // Clear device conflict dialog state on logout
    }
  };

  const updateUserProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.userService.updateProfile(profileData);
      // Assuming response.data contains the updated user fields
      // Normalize the incoming data and merge with existing user (if any, to preserve token etc.)
      const updatedFields = normalizeUserData(response.data); 
      updateUser({ ...user, ...updatedFields }); // user here should already be normalized
      setLoading(false);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('更新资料失败:', err);
      setError(err.message || '更新资料失败');
      setLoading(false);
      return { success: false, error: err.message || '更新资料失败' };
    }
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const value = {
    user, // This will now be the normalized user object with _id
    loading,
    isAuthenticated,
    error,
    authError, // Expose authError
    clearAuthError: () => setAuthError(null), // Expose clear function
    showDeviceConflictDialog, // Expose device conflict dialog state
    clearDeviceConflictDialog: () => setShowDeviceConflictDialog(false), // Expose clear function
    unreadCSCount,
    fetchUnreadCSCount,
    login,
    register,
    logout,
    updateUserProfile,
    isAdmin,
    updateUser, // Exposing the normalized updateUser
  };

  // 优先渲染页面主内容，挂载/预检逻辑延后
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
