import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, Checkbox, FormControlLabel, Link as MuiLink, Alert, Container, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  // Load initial state from localStorage for rememberMe and username
  const initialRememberMe = localStorage.getItem('rememberMe') === 'true';
  const initialUsername = initialRememberMe ? (localStorage.getItem('rememberedUsername') || '') : '';
  // 从sessionStorage加载临时密码
  const initialPassword = sessionStorage.getItem('tempPassword') || '';

  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);
  const [rememberMe, setRememberMe] = useState(initialRememberMe);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(''); // 用于Login组件内部的即时错误，如空输入
  const navigate = useNavigate();
  // 从AuthContext获取状态和方法
  const { login, isAuthenticated, user, authError, clearAuthError, showDeviceConflictDialog, clearDeviceConflictDialog } = useAuth();

  // 监听密码变化，保存到sessionStorage
  useEffect(() => {
    if (password) {
      sessionStorage.setItem('tempPassword', password);
    }
  }, [password]);

  // 如果已经认证，清除临时密码并跳转到首页
  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.removeItem('tempPassword');
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  // 处理AuthContext中的全局认证错误，并控制localError显示
  useEffect(() => {
    if (authError) {
      // 如果是设备冲突错误，AuthContext 会处理 showDeviceConflictDialog，这里只需关注其他错误
      if (!(authError.message && authError.message.includes('已在其他设备登录') && authError.code === 'DEVICE_CONFLICT')) {
        setLocalError(authError.message || '登录失败，请稍后再试。');
      } else {
        setLocalError(''); // 设备冲突错误不显示在localError中
      }
    } else {
      // 没有全局认证错误时，清除本地错误
      setLocalError('');
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setLocalError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setLocalError(''); // 每次提交前清除本地错误
    clearAuthError(); // 每次提交前清除AuthContext中的全局错误
    clearDeviceConflictDialog(); // 确保每次提交前对话框是关闭的

    // Save rememberMe state and username if checked
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberedUsername', username);
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberedUsername');
    }

    try {
      await login({ username, password });
    } catch (err) {
      // AuthContext 已经捕获并处理了错误，设置了 authError
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogout = async () => {
    clearDeviceConflictDialog(); // 关闭对话框
    setLoading(true);
    clearAuthError(); // 清除当前设备冲突错误，以便尝试强制登录
    setLocalError(''); // 清除本地可能存在的错误

    try {
      // 使用当前密码进行强制登出
      await login({ username, password, forceLogout: true });
    } catch (forceErr) {
      // AuthContext 会设置 authError，useEffect 会处理 localError
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForceLogout = () => {
    clearDeviceConflictDialog(); // 关闭对话框
    clearAuthError(); // 清除设备冲突错误
    setLocalError('您的账号已在其他设备登录，请先退出其他设备的登录'); // 显示特定错误信息
  };

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 2 }}>
          登录
        </Typography>

        {localError && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              backgroundColor: '#ffebee',
              color: '#d32f2f',
              '& .MuiAlert-icon': {
                color: '#d32f2f'
              },
              fontWeight: 'bold',
              fontSize: '1rem',
              py: 1.5,
              border: '1px solid #d32f2f',
              borderRadius: 1,
              width: '100%'
            }}
          >
            {localError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="用户名"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={!!localError}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="密码"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!localError}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                value="remember"
                color="primary"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
            }
            label="记住我"
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : '登录'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <MuiLink component="span" variant="body2">
                没有账号？立即注册
              </MuiLink>
            </Link>
          </Box>
        </form>
      </Box>

      {/* 确认对话框 - 根据 AuthContext 中的 showDeviceConflictDialog 状态显示 */}
      <Dialog
        open={showDeviceConflictDialog} // 现在由 AuthContext 中的状态控制
        onClose={handleCancelForceLogout}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          确认强制登出
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            您的账号已在其他设备登录，是否强制登出其他设备？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelForceLogout} color="primary">
            取消
          </Button>
          <Button onClick={handleForceLogout} color="primary" autoFocus>
            确认
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Login; 
