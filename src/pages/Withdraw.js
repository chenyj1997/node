import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  CircularProgress,
  Card,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ReactCodeInput from 'react-code-input';
import apiService from '../services/api';

function Withdraw() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [paymentPassword, setPaymentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState(null);
  const [isPaymentPasswordSet, setIsPaymentPasswordSet] = useState(false);
  const [qrcodeFile, setQrcodeFile] = useState(null);
  const [qrcodePreview, setQrcodePreview] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchBalance = useCallback(async () => {
    try {
      const response = await apiService.transactionService.getBalance();
      if (response.success) {
        setBalance(response.data.balance);
        showSnackbar(`余额已更新: ¥${response.data.balance.toFixed(2)}`);
      } else {
        setError(response.message || '获取余额失败');
      }
    } catch (err) {
      setError(err.message || '获取余额失败');
      console.error('获取余额失败:', err);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    checkPaymentPasswordStatus();
  }, [fetchBalance]);

  const checkPaymentPasswordStatus = async () => {
    try {
      const response = await apiService.paymentPasswordService.getPaymentPasswordStatus();
      if (response.success) {
        setIsPaymentPasswordSet(response.data.hasPayPassword);
      }
    } catch (err) {
      console.error('获取支付密码状态失败:', err);
      setError(err.response?.data?.message || err.message || '获取支付密码状态失败');
    }
  };

  const handleQrcodeChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setError('请上传图片文件');
        return;
      }
      // 验证文件大小（限制为5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError('图片大小不能超过5MB');
        return;
      }
      setQrcodeFile(file);
      // 创建预览URL
      const previewUrl = URL.createObjectURL(file);
      setQrcodePreview(previewUrl);
      setError(''); // 清除之前的错误信息
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleConfirmWithdraw = async () => {
    if (!amount || !paymentPassword) {
      showSnackbar('请填写完整信息', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('amount', parseFloat(amount));
      formData.append('payPassword', paymentPassword);
      if (qrcodeFile) {
        formData.append('qrcode', qrcodeFile);
      }
      formData.append('receiveAccount', accountNumber);
      formData.append('receiver', accountName);

      const response = await apiService.transactionService.createWithdraw(formData);
      if (response.success) {
        setIsWithdrawalModalOpen(false);
        setPaymentPassword('');
        showSnackbar('提现申请已提交，请等待审核', 'success');
        await updateBalance();
        navigate('/operation-result', { 
          state: { 
            success: true, 
            message: '提现申请已提交，请等待审核！',
            amount: amount,
            balance: balance
          } 
        });
      } else {
        showSnackbar(response.message || '提现失败', 'error');
      }
    } catch (err) {
      console.error('提现请求失败:', err);
      showSnackbar(err.response?.data?.message || err.message || '提现失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawClick = () => {
    if (!isPaymentPasswordSet) {
      navigate('/set-payment-password');
      return;
    }

    if (!accountNumber || !accountName) {
      setError('请填写完整的收款信息');
      return;
    }

    setIsWithdrawalModalOpen(true);
    setPaymentPassword('');
    setError('');
  };

  const handleCloseWithdrawalModal = () => {
    setIsWithdrawalModalOpen(false);
    setPaymentPassword('');
    setError('');
  };

  const updateBalance = async () => {
    try {
      const response = await apiService.transactionService.getBalance();
      if (response.success) {
        setBalance(response.data.balance);
        showSnackbar(`余额已更新: ¥${response.data.balance.toFixed(2)}`);
      }
    } catch (err) {
      console.error('更新余额失败:', err);
      showSnackbar('更新余额失败', 'error');
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, boxShadow: 3, borderRadius: 2 }}>
        {/* 移除提现标题 */}
        {/* <Typography variant="h5" component="h1" gutterBottom>
          提现
        </Typography> */}
        {balance !== null && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
            当前余额: ¥{balance.toFixed(2)}
          </Typography>
        )}
        <TextField
          margin="normal"
          required
          fullWidth
          id="amount"
          label="提现金额"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="accountNumber"
          label="收款账号"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="accountName"
          label="收款人"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        {/* 二维码上传区域 */}
        <Box sx={{ width: '100%', mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            上传提现二维码
          </Typography>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="qrcode-upload"
            type="file"
            onChange={handleQrcodeChange}
          />
          <label htmlFor="qrcode-upload">
            <Button
              variant="outlined"
              component="span"
              fullWidth
              sx={{ mb: 2 }}
            >
              选择二维码图片
            </Button>
          </label>
          {qrcodePreview && (
            <Card sx={{ mt: 2 }}>
              <CardMedia
                component="img"
                image={qrcodePreview}
                alt="提现二维码预览"
                sx={{ maxHeight: 200, objectFit: 'contain' }}
              />
            </Card>
          )}
        </Box>

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Button
          type="button"
          fullWidth
          variant="contained"
          sx={{ mt: 2 }}
          onClick={handleWithdrawClick}
          disabled={loading || !amount || !accountNumber || !accountName}
        >
          {loading ? <CircularProgress size={24} /> : '提交提现申请'}
        </Button>
      </Box>

      {/* Withdrawal Password Modal */}
      <Dialog open={isWithdrawalModalOpen} onClose={handleCloseWithdrawalModal} PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle align="center">请输入支付密码</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ReactCodeInput
                type="password"
                fields={6}
                value={paymentPassword}
                onChange={(value) => setPaymentPassword(value)}
                inputStyle={{
                    fontFamily: 'monospace',
                    margin: '4px',
                    MozAppearance: 'textfield',
                    width: '36px',
                    borderRadius: '8px',
                    fontSize: '24px',
                    height: '48px',
                    paddingLeft: '7px',
                    backgroundColor: '#fff',
                    color: '#000',
                    border: '1px solid #ccc',
                    boxSizing: 'border-box',
                }}
                inputFocusStyle={{
                    borderColor: '#6a0dad',
                    boxShadow: '0 0 0 1px #6a0dad',
                }}
            />
            {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {error}
                </Typography>
            )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 13 }}>
            <Button onClick={handleCloseWithdrawalModal} color="secondary" variant="contained" disabled={loading} sx={{ borderRadius: '12px' }}>
                取消
            </Button>
            <Button onClick={handleConfirmWithdraw} color="primary" variant="contained" disabled={loading || !paymentPassword || paymentPassword.length !== 6} sx={{ borderRadius: '12px' }}>
                {loading ? <CircularProgress size={24} /> : '提现'}
            </Button>
        </DialogActions>
      </Dialog>

      {/* 添加提示消息组件 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Withdraw; 
