const getApiBaseUrl = () => {
  // 临时硬编码线上地址，确保部署后能正常工作
  if (process.env.NODE_ENV === 'production') {
    return 'https://server-c752.onrender.com/api';
  }
  // 本地开发环境
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
};

const config = {
  apiBaseUrl: getApiBaseUrl(),

  // 前端服务器地址
  frontendUrl: process.env.NODE_ENV === 'production'
      ? window.location.origin  // 生产环境使用当前域名
      : window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:3000'      // 本地开发地址
          : window.location.origin,  // 其他环境使用当前域名
  
  // 环境
  env: process.env.NODE_ENV || 'development',
  
  // 版本
  version: '1.0.0',

  // 调试模式
  debugMode: process.env.NODE_ENV !== 'production',

  // 网络配置
  network: {
      timeout: 15000,
      retry: 3,
      retryDelay: 500
  },

  // 全局配置对象，供其他模块使用
  appConfig: {
    // apiBaseUrl: config.apiBaseUrl, // 已移除，直接使用 getApiBaseUrl()
  }
};

export default config;