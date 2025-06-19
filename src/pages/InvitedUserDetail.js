import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Container,
  Button,
  Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

function InvitedUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitedUser, setInvitedUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 检查用户权限
    if (!user || user.role !== 'vip') {
      navigate('/home');
      return;
    }

    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        // 获取被邀请用户信息
        const userResponse = await apiService.userService.getUserById(id);
        if (!userResponse.success) {
          throw new Error(userResponse.message || '获取用户信息失败');
        }
        setInvitedUser(userResponse.user);

        // 获取用户交易信息
        const transactionsResponse = await apiService.transactionService.getUserTransactions(id);
        if (!transactionsResponse.success) {
          throw new Error(transactionsResponse.message || '获取交易信息失败');
        }
        setTransactions(transactionsResponse.transactions || []);
      } catch (err) {
        setError(err.message || '获取用户详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [id, user, navigate]);

  // 计算总交易金额
  const totalAmount = transactions.reduce((sum, transaction) => {
    return sum + (transaction.type === 'purchase' ? transaction.amount : 0);
  }, 0);

  // 如果用户不是VIP，不渲染内容
  if (!user || user.role !== 'vip') {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3, px: { xs: 1, sm: 2, md: 3 } }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/invited-users')}
        sx={{ mb: 3 }}
      >
        返回列表
      </Button>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    用户信息
                  </Typography>
                  <Typography variant="body1">
                    用户名: {invitedUser?.username}
                  </Typography>
                  <Typography variant="body1">
                    注册时间: {new Date(invitedUser?.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    信息购买统计
                  </Typography>
                  <Typography variant="body1">
                    总购买金额: ¥{totalAmount.toFixed(2)}
                  </Typography>
                  <Typography variant="body1">
                    购买笔数: {transactions.length}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Typography variant="h6" gutterBottom>
            信息购买记录
          </Typography>
          
          {transactions.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              暂无信息购买记录
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 400 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>交易类型</TableCell>
                    <TableCell>金额</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>交易时间</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        信息购买
                      </TableCell>
                      <TableCell>¥{transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        {transaction.status === 'approved' ? '已通过' :
                         transaction.status === 'pending' ? '待审核' :
                         transaction.status === 'rejected' ? '已拒绝' : '未知'}
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Container>
  );
}

export default InvitedUserDetail; 