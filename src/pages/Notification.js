import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

function Notification() {
  const navigate = useNavigate();
  const { user, unreadCSCount } = useAuth();
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionError, setTransactionError] = useState(null);
  const [showCustomerServiceNotificationCard, setShowCustomerServiceNotificationCard] = useState(false);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);

  useEffect(() => {
    if (unreadCSCount > 0) {
      setShowCustomerServiceNotificationCard(true);
    } else {
      setShowCustomerServiceNotificationCard(false);
    }
  }, [unreadCSCount]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoadingTransactions(true);
    setTransactionError(null);
    try {
      const response = await apiService.userService.getMyTransactions();
      if (response.success && Array.isArray(response.data)) {
        setDisplayedTransactions(response.data);
      } else {
        console.warn('No transactions found or data format incorrect.', response);
        setTransactionError(response.message || '交易记录加载失败或格式不正确');
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setDisplayedTransactions([]);
      setTransactionError(err.message || '无法加载交易记录');
    } finally {
      setLoadingTransactions(false);
    }
  }, [user]);

  const handleRemoveTransaction = (idToRemove) => {
    setDisplayedTransactions(prev => prev.filter(tx => tx._id !== idToRemove));
  };

  const getTransactionTypeDisplay = (type) => {
    const types = {
      'recharge': '充值',
      'withdraw': '提现',
      'purchase': '购买信息',
      'repay': '收益',
      'referral_commission': '推荐佣金',
      'REFERRAL_COMMISSION': '推荐佣金'
    };
    return types[String(type)] || types[String(type).toLowerCase()] || String(type).toUpperCase();
  };
  
  const getStatusDisplay = (status) => {
    const statuses = {
      'pending': '处理中',
      'approved': '已通过',
      'rejected': '已拒绝',
      'completed': '已完成',
      'failed': '失败',
      'cancelled': '已取消'
    };
    return statuses[String(status).toLowerCase()] || String(status).toUpperCase();
  };

  const getPaymentMethodDisplay = (method) => {
    const upperMethod = String(method || '').toUpperCase();
    const methods = {
      'INTERNAL_SETTLEMENT': '内部结算',
      'ALIPAY': '支付宝',
      'WECHAT': '微信',
      'BANK': '银行卡',
      'BALANCE': '余额',
      'CASH': '现金',
    };
    return methods[upperMethod] || method || '--';
  };

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleCustomerServiceCardClick = () => {
    setShowCustomerServiceNotificationCard(false);
    navigate('/customer-service');
  };

  const handleTransactionClick = (transaction) => {
    if (transaction.type === 'purchase' && transaction.infoId) {
      navigate(`/detail/${transaction.infoId}`);
    }
    // For other types, do nothing or handle as needed
  };

  if (loadingTransactions) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (transactionError) {
    return (
      <Typography color="error" sx={{ textAlign: 'center', mt: 2 }}>
        错误: {transactionError}
      </Typography>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', p: 2 }}>
      {showCustomerServiceNotificationCard && (
        <Card 
          sx={{ 
            mb: 2, 
            backgroundColor: 'primary.lighter',
            cursor: 'pointer',
            borderRadius: '12px',
            '&:hover': {
              boxShadow: 3,
            }
          }}
          onClick={handleCustomerServiceCardClick}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', p: '12px !important' }}>
            <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5, color: 'primary.main' }}>
              <ChatIcon />
            </ListItemIcon>
            <ListItemText 
              primary="您有未读客服消息"
              secondary="点击查看" 
              primaryTypographyProps={{ fontWeight: 'medium' }}
            />
          </CardContent>
        </Card>
      )}

      <Paper elevation={2} sx={{ borderRadius: '12px' }}>
        {displayedTransactions.length === 0 ? (
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 3 }}>
            暂无交易记录
          </Typography>
        ) : (
          <List disablePadding>
            {displayedTransactions.map((tx, index) => (
              <React.Fragment key={tx._id || index}>
                <ListItem 
                  sx={{ 
                    py: 2, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    position: 'relative',
                    cursor: tx.type === 'purchase' ? 'pointer' : 'default',
                    '&:hover': {
                      backgroundColor: tx.type === 'purchase' ? 'action.hover' : 'transparent',
                    }
                  }}
                  onClick={() => handleTransactionClick(tx)}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1">
                        {getTransactionTypeDisplay(tx.type)} - {getStatusDisplay(tx.status)}
                      </Typography>
                    }
                    secondary={
                      <Typography component="div">
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            component="span"
                            variant="body2"
                            color={!['withdraw', 'purchase'].includes(String(tx.type).toLowerCase()) ? 'success.main' : 'error.main'}
                            sx={{ display: 'block', mb: 0.5 }}
                          >
                            金额: ￥{ !['withdraw', 'purchase'].includes(String(tx.type).toLowerCase()) ? '+' : '-'}{tx.amount ? Math.abs(tx.amount).toFixed(2) : '0.00'}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block' }}
                          >
                            日期: {new Date(tx.createdAt).toLocaleString()}
                          </Typography>
                          {tx.remark && (
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block' }}
                            >
                              备注: {tx.remark}
                            </Typography>
                          )}
                          {tx.paymentMethod && (
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block' }}
                            >
                              方式: {getPaymentMethodDisplay(tx.paymentMethod)}
                            </Typography>
                          )}
                        </Box>
                      </Typography>
                    }
                  />
                  <IconButton
                    aria-label="delete"
                    size="small"
                    onClick={() => handleRemoveTransaction(tx._id)}
                    sx={{ color: 'text.secondary', position: 'absolute', top: 8, right: 8 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </ListItem>
                {index < displayedTransactions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}

export default Notification; 
