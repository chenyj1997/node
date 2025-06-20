import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import MuiLink from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Backdrop from '@mui/material/Backdrop';
import Modal from '@mui/material/Modal';

function Login() {
  const initialRememberMe = localStorage.getItem('rememberMe') === 'true';
  const initialUsername = initialRememberMe ? (localStorage.getItem('rememberedUsername') || '') : '';
  const initialPassword = sessionStorage.getItem('tempPassword') || '';

  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);
  const [rememberMe, setRememberMe] = useState(initialRememberMe);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated, user, authError, clearAuthError, showDeviceConflictDialog, clearDeviceConflictDialog, loading: authLoading, setIsAuthenticated, setUser } = useAuth();
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const refreshTimeoutRef = useRef(null);

  useEffect(() => {
    if (password) {
      sessionStorage.setItem('tempPassword', password);
    }
  }, [password]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      sessionStorage.removeItem('tempPassword');
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (authError) {
      if (!(authError.message && authError.message.includes('已在其他设备登录') && authError.code === 'DEVICE_CONFLICT')) {
        setLocalError(authError.message || '登录失败，请稍后再试。');
      } else {
        setLocalError('');
      }
    } else {
      setLocalError('');
    }
  }, [authError]);

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        setIsAuthenticated(true);
        setUser(JSON.parse(storedUser));
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setLocalError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setLocalError('');
    clearAuthError();
    clearDeviceConflictDialog();

    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberedUsername', username);
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberedUsername');
    }

    try {
      await login({ username, password });
      window.dispatchEvent(new Event('storage'));
      if (showDeviceConflictDialog) {
        setShouldRefresh(true);
      } else {
        refreshTimeoutRef.current = setTimeout(() => {
          window.location.replace('/');
        }, 4000);
      }
    } catch (err) {
      // AuthContext 已经捕获并处理了错误，设置了 authError
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogout = async () => {
    clearDeviceConflictDialog();
    setLoading(true);
    clearAuthError();
    setLocalError('');

    try {
      await login({ username, password, forceLogout: true });
      if (showDeviceConflictDialog) {
        setShouldRefresh(true);
      } else {
        refreshTimeoutRef.current = setTimeout(() => {
          window.location.replace('/');
        }, 4000);
      }
    } catch (forceErr) {
      // AuthContext 会设置 authError，useEffect 会处理 localError
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForceLogout = () => {
    clearDeviceConflictDialog();
    clearAuthError();
    setLocalError('您的账号已在其他设备登录，请先退出其他设备的登录');
    setShouldRefresh(true);
  };

  // 监听弹窗出现，若有定时器则清除
  useEffect(() => {
    if (showDeviceConflictDialog && refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, [showDeviceConflictDialog]);

  // 监听弹窗关闭后刷新页面
  useEffect(() => {
    if (shouldRefresh && !showDeviceConflictDialog) {
      setTimeout(() => {
        window.location.replace('/');
      }, 4000);
    }
  }, [shouldRefresh, showDeviceConflictDialog]);

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
      {/* 登录过渡弹窗 */}
      <Modal
        open={loading || authLoading}
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
        disableAutoFocus
        disableEnforceFocus
        disableEscapeKeyDown
      >
        <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography id="transition-modal-title" variant="h6" component="h2">
            正在登录，请稍候...
          </Typography>
        </Box>
      </Modal>
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
        open={showDeviceConflictDialog}
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
