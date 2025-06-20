import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import createTheme from '@mui/material/styles/createTheme';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import Box from '@mui/material/Box';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './routes';

// 创建主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  // 添加移动端适配
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: '36px',
          padding: '6px 16px',
          fontSize: '0.875rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            minHeight: '36px',
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h6: {
          fontSize: '1rem',
        },
        body1: {
          fontSize: '0.875rem',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '0px',
          paddingRight: '0px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          height: '48px',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '48px !important',
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 360,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },
});

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 数据保持新鲜5分钟
      cacheTime: 30 * 60 * 1000, // 缓存保留30分钟
      refetchOnWindowFocus: false, // 窗口聚焦时不重新获取
      retry: 1, // 失败重试1次
    },
  },
});

// New AppContent component
function AppContent() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundImage: 'url(/global_background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <Box sx={{ flexGrow: 1, pb: 7 }}>
        <AppRoutes />
      </Box>
    </Box>
  );
}

function App() {
  useEffect(() => {
    // 全局登录检测
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (!token || typeof token !== 'string' || token.length < 10) {
      window.location.href = 'https://node-2kvt.onrender.com';
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router basename={process.env.PUBLIC_URL}>
            <AppContent />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 
