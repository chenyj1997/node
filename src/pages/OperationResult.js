import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

function OperationResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { success, message, amount, balance } = location.state || {};

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        {success ? (
          <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
        ) : (
          <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
        )}
        
        <Typography variant="h5" component="h1" gutterBottom>
          {success ? '操作成功' : '操作失败'}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {message}
        </Typography>

        {success && amount && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ textAlign: 'left', mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                交易详情：
              </Typography>
              <Typography variant="body2" color="text.secondary">
                提现金额：¥{Number(amount).toFixed(2)}
              </Typography>
              {balance && (
                <Typography variant="body2" color="text.secondary">
                  当前余额：¥{Number(balance).toFixed(2)}
                </Typography>
              )}
            </Box>
          </>
        )}

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate((location.state && location.state.redirectTo) ? location.state.redirectTo : '/home')}
            sx={{ mr: 2 }}
          >
            返回首页
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/transactions')}
          >
            查看交易记录
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default OperationResult; 