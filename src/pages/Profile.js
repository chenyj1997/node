import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Avatar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Container
} from '@mui/material';

import SettingsIcon from '@mui/icons-material/Settings';

import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

// 导入预设头像
import avatar1 from '../assets/avatars/avatar1.png';
import avatar2 from '../assets/avatars/avatar2.png';
import avatar3 from '../assets/avatars/avatar3.png';
import avatar4 from '../assets/avatars/avatar4.png';
import avatar5 from '../assets/avatars/avatar5.png';
import avatar6 from '../assets/avatars/avatar6.png';
import avatar7 from '../assets/avatars/avatar7.png';
import avatar8 from '../assets/avatars/avatar8.png';

// 定义预设头像数组
const randomAvatars = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
  avatar8,
];

// Function to calculate countdown (copied from Notification.js)
const calculateCountdown = (purchaseTime, period) => {
  if (!purchaseTime || !period) return 'N/A';
  
  const purchaseDate = new Date(purchaseTime);
  const expiryDate = new Date(purchaseDate.getTime() + period * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = expiryDate - now;

  if (diff <= 0) {
    return '已过期';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  // const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${days}天${hours}小时${minutes}分`;
};

function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [purchasedInfos, setPurchasedInfos] = useState([]); // State for purchased infos
  const [loadingPurchased, setLoadingPurchased] = useState(true); // Loading state for purchased infos
  const [errorPurchased, setErrorPurchased] = useState(''); // Error state for purchased infos
  const [displayedAvatar, setDisplayedAvatar] = useState(null); // 新增：用于显示头像的state

   // Fetch purchased infos (copied from Notification.js)
  const fetchPurchasedInfos = useCallback(async () => {
    setLoadingPurchased(true);
    setErrorPurchased('');
    try {
      const response = await apiService.postService.getPurchasedInfos();
      if (response.success) {
        setPurchasedInfos(response.data);
      } else {
         setErrorPurchased(response.message || '获取已购买信息失败');
      }
    } catch (err) {
      setErrorPurchased(err.message || '获取已购买信息失败');
      console.error('获取已购买信息失败:', err);
    } finally {
      setLoadingPurchased(false);
    }
  }, []);


  useEffect(() => {
    fetchPurchasedInfos(); // Fetch purchased infos on mount

    // 使用系统预设头像，根据用户ID分配固定的头像
    if (user) {
      // 使用用户ID的最后一位数字来选择预设头像
      const lastDigit = parseInt(user._id.slice(-1), 16) || 0;
      const avatarIndex = lastDigit % randomAvatars.length;
      setDisplayedAvatar(randomAvatars[avatarIndex]);
    } else {
      // 未登录用户显示默认头像
      setDisplayedAvatar(randomAvatars[0]);
    }

  }, [user, fetchPurchasedInfos]);

   // 每秒更新倒计时 (copied from Notification.js)
  useEffect(() => {
    const timer = setInterval(() => {
      setPurchasedInfos(prevInfos => [...prevInfos]);
    }, 1000);

    return () => clearInterval(timer);
  }, [purchasedInfos]); // Re-run effect if purchasedInfos changes

    // Handle row click to navigate to detail page (copied from Notification.js)
  const handleRowClick = (infoId) => {
    navigate(`/detail/${infoId}`);
  };


  return (
    <Container component="main" sx={{ mt: 4, width: '100%', mx: 'auto' }} disableGutters>
      {/* 用户信息卡片 */}
      <Box sx={{ width: '100%', mb: 3 }}>
        <Card sx={{ p: 2, display: 'flex', alignItems: 'center', borderRadius: 2, elevation: 0 }}>
          <Avatar
            src={displayedAvatar}
            sx={{ width: 60, height: 60, mr: 2 }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">{user?.username || '未登录'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.phone ? user.phone : (user ? '未设置手机号' : '点击登录')}
            </Typography>
            {user && user.inviteCode && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                邀请码: {user.inviteCode}
              </Typography>
            )}
          </Box>
          <IconButton onClick={() => navigate('/settings')}>
            <SettingsIcon />
          </IconButton>
        </Card>
      </Box>

      {/* 已购买信息表格 */}
      <Box sx={{ width: '100%', mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          我的已购买信息:
        </Typography>
         {loadingPurchased ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200, width: '100%' }}>
               <CircularProgress />
            </Box>
         ) : errorPurchased ? (
            <Typography color="error" align="center" sx={{ width: '100%' }}>
               {errorPurchased}
            </Typography>
         ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 0, borderRadius: 2, elevation: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ padding: '8px' }}>标题</TableCell>
                    <TableCell sx={{ padding: '8px' }}>购买时间</TableCell>
                    <TableCell sx={{ padding: '8px', fontWeight: 'bold', color: 'green', textAlign: 'right' }}>收益</TableCell>
                    <TableCell sx={{ padding: '8px' }}>倒计时</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchasedInfos.map((info) => (
                    <TableRow
                      key={info._id}
                      onClick={() => handleRowClick(info._id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell sx={{ padding: '8px' }}>{info.title}</TableCell>
                      <TableCell sx={{ padding: '8px' }}>
                        {new Intl.DateTimeFormat('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false // Use 24-hour format
                        }).format(new Date(info.purchaseTime))}
                      </TableCell>
                      <TableCell sx={{ padding: '8px', fontWeight: 'bold', color: 'green', textAlign: 'right' }}>{info.repaymentAmount || 'N/A'}</TableCell>
                      <TableCell sx={{ padding: '8px' }}>
                        {calculateCountdown(info.purchaseTime, info.period)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {purchasedInfos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        暂无已购买信息
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
         )}

     </Box>

    </Container>
  );
}

export default Profile; 
