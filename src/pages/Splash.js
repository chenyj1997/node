import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    // 2秒后自动跳转到登录页面
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'primary.main',
        color: 'white',
      }}
    >
      <Typography variant="h4" sx={{ mb: 3 }}>
        欢迎使用
      </Typography>
      <CircularProgress color="inherit" />
    </Box>
  );
}

export default Splash; 