import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Container
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

function InvitedUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 检查用户权限
    if (!user || user.role !== 'vip') {
      navigate('/home');
      return;
    }

    const fetchInvitedUsers = async () => {
      try {
        setLoading(true);
        const response = await apiService.userService.getInvitedUsers();
        if (response.success) {
          setInvitedUsers(response.invitedUsers || []);
        } else {
          setError(response.message || '获取邀请用户列表失败');
        }
      } catch (err) {
        setError(err.message || '获取邀请用户列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitedUsers();
  }, [user, navigate]);

  // 处理行点击事件
  const handleRowClick = (userId) => {
    navigate(`/invited-users/${userId}`);
  };

  // 如果用户不是VIP，不渲染内容
  if (!user || user.role !== 'vip') {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            我的邀请
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            邀请码: {user?.inviteCode || '未设置'}
          </Typography>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : invitedUsers.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          暂无邀请用户
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>用户名</TableCell>
                <TableCell>注册时间</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invitedUsers.map((user) => (
                <TableRow 
                  key={user._id}
                  onClick={() => handleRowClick(user._id)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}

export default InvitedUsers; 