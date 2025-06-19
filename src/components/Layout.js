import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Divider,
  Paper,
  Link as MuiLink,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Notifications as NotificationsIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { routesConfig } from '../routes';

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [balance, setBalance] = useState(null);
  const [latestSystemNotification, setLatestSystemNotification] = useState(null);
  
  const { user, logout, unreadCSCount } = useAuth();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const data = await apiService.transactionService.getBalance();
        setBalance(data.data.balance);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };

    if (anchorEl && user) {
      fetchBalance();
    } else if (!user) {
      setBalance(null);
    }
  }, [anchorEl, user]);

  // 获取未读通知数量
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await apiService.notificationService.getUnreadCount();
        if (res && typeof res.data === 'number') {
          setNotificationCount(res.data);
        } else if (res && typeof res.data?.count === 'number') {
          setNotificationCount(res.data.count);
        } else if (typeof res.count === 'number') {
          setNotificationCount(res.count);
        } else {
          setNotificationCount(0);
        }
      } catch (e) {
        setNotificationCount(0);
      }
    };
    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // 获取最新的系统通知 (仅在首页)
  useEffect(() => {
    const fetchLatestSystemNotification = async () => {
      if (location.pathname === '/home') {
        try {
          const response = await apiService.notificationService.getSystemNotifications({
            type: 'SYSTEM',
            status: 'ACTIVE',
            limit: 1,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          });

          if (response && response.data && response.data.length > 0) {
            setLatestSystemNotification(response.data[0]);

            // 检查是否需要自动弹出
            const isTodayNoShow = () => {
              const key = 'noShowAnnouncementDate';
              const today = new Date().toISOString().slice(0, 10);
              const storedDate = localStorage.getItem(key);
              return storedDate === today;
            };

            const shouldShowAutoPopup = !isTodayNoShow();

            if (shouldShowAutoPopup) {
              setTimeout(() => {
                const event = new CustomEvent('showSystemNotificationDetail', { 
                  detail: { 
                    notification: response.data[0],
                    dontShowTodayStatus: false
                  }
                });
                window.dispatchEvent(event);
              }, 1000);
            }
          } else {
            setLatestSystemNotification(null);
          }
        } catch (error) {
          console.error('获取系统通知失败:', error);
          setLatestSystemNotification(null);
        }
      } else {
        setLatestSystemNotification(null);
      }
    };

    fetchLatestSystemNotification();
  }, [location.pathname]);

  const handleSystemNotificationCardClick = () => {
    if (latestSystemNotification) {
      const isTodayNoShow = () => {
        const key = 'noShowAnnouncementDate';
        const today = new Date().toISOString().slice(0, 10);
        return localStorage.getItem(key) === today;
      };

      const event = new CustomEvent('showSystemNotificationDetail', { 
        detail: { 
          notification: latestSystemNotification,
          dontShowTodayStatus: isTodayNoShow()
        }
      });
      window.dispatchEvent(event);
    }
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    window.location.replace('/login');
  };

  const totalUnreadCount = notificationCount + unreadCSCount;

  // 根据当前路径查找对应的标题
  let pageTitle = '加载中...';
  const currentRoute = routesConfig.find(route => {
    if (route.path.includes(':')) {
      const pathRegex = new RegExp(`^${route.path.replace(/\//g, '\\/').replace(/:\w+/g, '[^\\/]+')}$`);
      return pathRegex.test(location.pathname);
    }
    return route.path === location.pathname;
  });

  if (currentRoute) {
    pageTitle = currentRoute.title;
  }

  // 特别处理充值详情页面的标题
  if (location.pathname.startsWith('/recharge-paths/') && location.state?.rechargePath?.name) {
    pageTitle = location.state.rechargePath.name;
  }

  // 判断是否在详情页面
  const isDetailPage = location.pathname.startsWith('/detail/');

  // 定义需要显示返回按钮的精确匹配路径
  const exactSpecialPaths = [
    '/change-password',
    '/forgot-password',
    '/set-payment-password',
    '/forgot-payment-password',
    '/wallet',
    '/notification',
    '/customer-service',
    '/settings',
    '/withdraw',
  ];

  // 定义需要显示返回按钮的以特定前缀开头的路径
  const startsWithSpecialPaths = [
    '/recharge-paths',
  ];

  // 综合判断是否为特殊页面
  const isSpecialPage = 
    exactSpecialPaths.includes(location.pathname) ||
    startsWithSpecialPaths.some(path => location.pathname.startsWith(path));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="fixed">
        <Toolbar sx={{ minHeight: '48px !important' }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label={isDetailPage || isSpecialPage ? "back" : "home"}
            onClick={() => isDetailPage || isSpecialPage ? navigate(-1) : navigate('/home')}
            sx={{ mr: 1, p: 0.5 }}
          >
            {isDetailPage || isSpecialPage ? (
              <ArrowBackIcon sx={{ fontSize: '1.25rem' }} />
            ) : (
              <HomeIcon sx={{ fontSize: '1.25rem' }} />
            )}
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: '1rem', textAlign: 'center' }}>
            {pageTitle}
          </Typography>
          <IconButton
            size="small"
            aria-label="show notifications"
            color="inherit"
            onClick={() => navigate('/notification')}
            sx={{ p: 1.5 }}
          >
            <Badge
              color="error"
              badgeContent={totalUnreadCount > 0 ? totalUnreadCount : null}
              max={99}
            >
              <NotificationsIcon sx={{ fontSize: '1.25rem' }} />
            </Badge>
          </IconButton>
          <IconButton
            size="small"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
            sx={{ p: 0.5, ml: 1 }}
          >
            <AccountCircleIcon sx={{ fontSize: '1.25rem' }} />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 0.5,
                minWidth: '180px',
                '& .MuiMenuItem-root': {
                  fontSize: '0.875rem',
                  py: 1,
                },
              },
            }}
          >
            <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {user ? (
                  <>
                    {user.role === 'admin' ? '管理员' : 
                     user.role === 'vip' ? 'VIP用户' : '用户'} - {user.username}
                  </>
                ) : '加载中...'}
              </Typography>
            </MenuItem>
            <MenuItem onClick={() => { handleClose(); navigate('/wallet'); }}>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                余额: {user ? (balance !== null ? `¥${balance.toFixed(2)}` : '加载中...') : '--'}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { handleClose(); navigate('/recharge-paths'); }}>充值</MenuItem>
            <MenuItem onClick={() => { handleClose(); navigate('/withdraw'); }}>提现</MenuItem>
            {user && user.role === 'vip' && (
              <MenuItem onClick={() => { handleClose(); navigate('/invited-users'); }}>
                我的邀请
              </MenuItem>
            )}
            <MenuItem onClick={() => { handleClose(); navigate('/customer-service'); }}>客服</MenuItem>
            <MenuItem onClick={handleLogout}>退出登录</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{
        mt: '48px', // 对应AppBar高度
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        px: 0, // 确保Box没有水平内边距
      }}>
        {location.pathname === '/home' && latestSystemNotification && (
          <Paper 
            elevation={3} 
            sx={{
              p: 1,
              mt: 0,
              mb: 1,
              mx: 0,
              backgroundColor: '#e3f2fd',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            onClick={handleSystemNotificationCardClick}
          >
            <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 'medium' }}>
              系统公告: {latestSystemNotification.title}
            </Typography>
            <MuiLink 
              component="button" 
              variant="body2" 
              sx={{ fontSize: '0.75rem' }}
              onClick={(e) => { 
                e.stopPropagation();
                handleSystemNotificationCardClick();
              }}
            >
              查看详情
            </MuiLink>
          </Paper>
        )}

        <Container 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            py: 2,
            // 移除px属性，让maxWidth自动管理内边距
          }}
          maxWidth="lg" // 恢复标准最大宽度
          disableGutters={false} // 确保Container使用默认的gutter内边距
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
}

export default Layout; 