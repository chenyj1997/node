import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import { Link as MuiLink, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    referrerCode: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      console.error('Passwords do not match');
      alert('密码和确认密码不匹配');
      return;
    }
    if (!formData.referrerCode) {
      alert('邀请码为必填项');
      return;
    }
    if (!formData.phone || !/^1[3-9]\d{9}$/.test(formData.phone)) {
      alert('请输入有效的11位手机号码');
      return;
    }
    const result = await register(formData);
    if (result.success) {
      navigate('/login');
    } else {
      alert(result.error || '注册失败');
    }
  };

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
      <AppBar position="static" sx={{ mb: 3, boxShadow: 0, bgcolor: 'transparent' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={() => navigate(-1)}
            sx={{ mr: 2, color: 'text.primary' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            注册
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 3,
          boxShadow: 3,
          borderRadius: 2,
          width: '100%'
        }}
      >
        <Typography component="h1" variant="h5" gutterBottom sx={{ mb: 2 }}>
          注册
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="用户名"
            name="username"
            autoComplete="username"
            autoFocus
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
            autoComplete="new-password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="确认密码"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            fullWidth
            id="email"
            label="邮箱 (必填)"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            fullWidth
            id="phone"
            label="手机号 (必填)"
            name="phone"
            autoComplete="tel"
            value={formData.phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 11);
              setFormData({ ...formData, phone: value });
            }}
            inputProps={{
              pattern: '^1[3-9]\\d{9}$',
              title: '请输入11位手机号码'
            }}
            error={formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)}
            helperText={formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone) ? '请输入有效的11位手机号码' : ''}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="referrerCode"
            label="邀请码(必填)"
            name="referrerCode"
            autoComplete="off"
            value={formData.referrerCode}
            onChange={(e) => setFormData({ ...formData, referrerCode: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
             {loading ? <CircularProgress size={24} /> : '注册'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <MuiLink component={RouterLink} to="/login" variant="body2">
              已有账号？去登录
            </MuiLink>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default Register; 