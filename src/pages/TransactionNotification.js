import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  Container,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentIcon from '@mui/icons-material/Payment';
import apiService from '../services/api';

function TransactionNotification() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.userService.getMyTransactions();
      if (response.success && Array.isArray(response.data)) {
        setTransactions(response.data);
      } else {
        setTransactions([]);
        setError(response.message || '获取交易记录失败');
      }
    } catch (err) {
      setError(err.message || '加载交易记录失败');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'recharge':
        return 'success';
      case 'withdraw':
        return 'error';
      case 'referral_reward':
        return 'success';
      case 'repay': // 收益
        return 'success'; 
      default:
        return 'default';
    }
  };

  const formatAmount = (amount) => {
    return Number(amount).toFixed(2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 支付方式显示映射
  const getPaymentMethodDisplay = (method) => {
    const methods = {
      'INTERNAL_SETTLEMENT': '内部结算',
      'ALIPAY': '支付宝',
      'WECHAT': '微信',
      'BANK': '银行卡',
      'BALANCE': '余额',
      'CASH': '现金',
    };
    return methods[String(method)] || method || '--';
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            交易记录
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" sx={{ mt: 4 }}>
            {error}
          </Typography>
        ) : transactions.length === 0 ? (
          <Typography align="center" sx={{ mt: 4 }}>
            暂无交易记录
          </Typography>
        ) : (
          <Card>
            <CardContent sx={{ p: 0 }}>
              <List>
                {transactions.map((transaction, index) => (
                  <React.Fragment key={transaction._id}>
                    <ListItem 
                      sx={{ 
                        px: isMobile ? 1 : 2,
                        py: isMobile ? 1.5 : 2,
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.02)'
                        }
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: isMobile ? 40 : 48 }}>
                        <Avatar 
                          sx={{ 
                            width: isMobile ? 36 : 40, 
                            height: isMobile ? 36 : 40,
                            bgcolor: theme.palette.primary.light
                          }}
                        >
                          <PaymentIcon sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 'medium',
                                fontSize: isMobile ? '0.9rem' : '1rem'
                              }}
                            >
                              {transaction.type === 'recharge' ? '充值' :
                               transaction.type === 'withdraw' ? '提现' :
                               transaction.type === 'referral_reward' ? '推荐奖励' :
                               transaction.type === 'repay' ? '收益' : transaction.type}
                            </Typography>
                            <Typography 
                              variant="subtitle1" 
                              color={getTransactionTypeColor(transaction.type)}
                              sx={{ 
                                fontWeight: 'bold',
                                fontSize: isMobile ? '0.9rem' : '1rem'
                              }}
                            >
                              {transaction.type === 'withdraw' ? '-' : '+'}¥{formatAmount(transaction.amount)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography 
                              component="span" 
                              variant="body2" 
                              color="text.primary"
                              sx={{
                                display: 'block',
                                fontSize: isMobile ? '0.875rem' : '0.9rem',
                                mb: 0.5
                              }}
                            >
                              {transaction.description}
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <Typography 
                                component="span" 
                                variant="caption" 
                                color="text.secondary"
                                sx={{
                                  fontSize: isMobile ? '0.75rem' : '0.8rem'
                                }}
                              >
                                {formatDate(transaction.createdAt)}
                              </Typography>
                              <Typography 
                                component="span" 
                                variant="caption" 
                                color="text.secondary"
                                sx={{
                                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                                  ml: 2
                                }}
                              >
                                余额: ¥{formatAmount(transaction.status === 'pending' ? transaction.balanceBefore : transaction.balanceAfter)}
                              </Typography>
                              <Typography 
                                component="span" 
                                variant="caption" 
                                color="text.secondary"
                                sx={{
                                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                                  ml: 2
                                }}
                              >
                                方式: {getPaymentMethodDisplay(transaction.paymentMethod)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < transactions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}

export default TransactionNotification; 
