import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  Container
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

function WalletPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionError, setTransactionError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoadingTransactions(true);
    setTransactionError(null);
    try {
      const response = await apiService.userService.getMyTransactions();
      if (response.success && Array.isArray(response.data)) {
        setTransactions(response.data);
      } else {
        setTransactions([]);
        console.warn('No transactions found or data format incorrect.', response);
        setTransactionError(response.message || '交易记录加载失败或格式不正确');
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
      setTransactionError(err.message || '无法加载交易记录');
    } finally {
      setLoadingTransactions(false);
    }
  }, [user]);

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

  const isExpense = (type) => {
    const expenseTypes = ['withdraw', 'purchase'];
    return expenseTypes.includes(String(type).toLowerCase());
  };

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // 新增：过滤掉待审核记录
  const filteredTransactions = transactions.filter(tx => tx.status !== 'pending');

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, boxShadow: 3, borderRadius: 2 }}>
        {transactionError && (
          <Typography color="error" sx={{ textAlign: 'center', mb: 2, width: '100%' }}>
            交易记录错误: {transactionError}
          </Typography>
        )}
        {loadingTransactions ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3, width: '100%' }}>
            <CircularProgress />
          </Box>
        ) : transactionError ? (
          <Typography color="error">{transactionError}</Typography>
        ) : filteredTransactions.length === 0 ? (
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 3, width: '100%' }}>
            暂无交易记录
          </Typography>
        ) : (
          <List disablePadding sx={{ width: '100%' }}>
            {filteredTransactions.map((tx, index) => (
              <React.Fragment key={tx._id || index}>
                <ListItem
                  sx={{
                    py: 2,
                    px: 0,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    borderBottom: index < filteredTransactions.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {getTransactionTypeDisplay(tx.type)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {new Date(tx.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 90, textAlign: 'right' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: isExpense(tx.type) ? 'error.main' : 'success.main',
                        fontWeight: 600
                      }}
                    >
                      ￥{isExpense(tx.type) ? '-' : '+'}{tx.amount ? tx.amount.toFixed(2) : '0.00'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      余额: ￥{typeof tx.status === 'string'
                        ? (tx.status === 'pending'
                            ? (typeof tx.balanceBefore === 'number' ? tx.balanceBefore.toFixed(2) : '--')
                            : (typeof tx.balanceAfter === 'number' ? tx.balanceAfter.toFixed(2) : '--'))
                        : '--'}
                    </Typography>
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Container>
  );
}

export default WalletPage; 
