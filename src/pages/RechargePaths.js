import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Container,
  Divider
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import WalletIcon from '@mui/icons-material/AccountBalanceWallet';
import apiService, { baseStaticURL } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function RechargePaths() {
  const navigate = useNavigate();
  useAuth(); // 如果不需要使用 user 变量，直接调用 useAuth 即可
  const [rechargePaths, setRechargePaths] = useState([]);
  const [balance, setBalance] = useState(0); // 用户余额状态
  const [loadingPaths, setLoadingPaths] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRechargePaths();
    fetchBalance();
  }, []);

  const fetchRechargePaths = async () => {
    setLoadingPaths(true);
    setError('');
    try {
      // 调用获取充值路径的API
      const response = await apiService.transactionService.getRechargePaths();
      console.log('充值路径API响应:', response);
      
      // 假设后端返回的数据结构类似安卓：{ success: true, data: [...] }
      if (response.success && Array.isArray(response.data)) {
        console.log('充值路径数据:', response.data);
        setRechargePaths(response.data);
      } else {
        console.error('获取充值路径失败: 数据格式错误', response);
        setError('获取充值路径失败: 数据格式错误');
        setRechargePaths([]);
      }
    } catch (err) {
      console.error('获取充值路径错误:', err);
      setError(err.message || '获取充值路径失败');
      setRechargePaths([]);
    } finally {
      setLoadingPaths(false);
    }
  };

  const fetchBalance = async () => {
    setLoadingBalance(true);
    try {
      // 调用获取用户余额的API
      const response = await apiService.transactionService.getBalance();
      // 假设后端返回的数据结构：{ success: true, data: { balance: number } }
      if (response.success && typeof response.data?.balance === 'number') {
        setBalance(response.data.balance);
      } else {
        console.error('获取余额失败: 数据格式错误', response);
        setBalance(0); // 设置默认值
      }
    } catch (err) {
      console.error('获取余额错误:', err);
      setBalance(0); // 加载失败时设置默认值
    } finally {
      setLoadingBalance(false);
    }
  };

  const handlePathClick = (path) => {
    // 跳转到充值详情页面，并将选中的路径信息传递过去
    navigate(`/recharge-paths/${path._id}`, { state: { rechargePath: path } });
  };

  const isLoading = loadingPaths || loadingBalance;

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, boxShadow: 3, borderRadius: 2 }}>
        {/* 余额显示部分统一为提现页面的布局 */}
        {balance !== null && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
            当前余额: ¥{loadingBalance ? '加载中...' : (typeof balance === 'number' ? balance.toFixed(2) : '0.00')}
          </Typography>
        )}

        <Divider sx={{ width: '100%', mb: 3 }} />

        {/* 充值路径列表 */}
        <Box sx={{ width: '100%' }}>
          <Typography variant="subtitle1" gutterBottom>
            请选择充值方式:
          </Typography>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" align="center">
              {error}
            </Typography>
          ) : rechargePaths.length === 0 ? (
            <Typography align="center" color="text.secondary">
              暂无可用充值方式
            </Typography>
          ) : (
            <Box>
              {rechargePaths.map((path) => {
                const iconPath = path.displayIcon || path.icon;
                console.log('充值路径图标调试:', {
                  pathName: path.name,
                  iconField: iconPath,
                  hasIcon: !!iconPath
                });
                
                // 处理图标URL - 支持Cloudinary URL和相对路径
                let fullIconSrc = null;
                if (iconPath) {
                  // 如果是完整的URL（包含http或https），直接使用
                  if (iconPath.startsWith('http://') || iconPath.startsWith('https://')) {
                    fullIconSrc = iconPath;
                    console.log('使用完整URL:', fullIconSrc);
                  } else {
                    // 如果是相对路径，添加baseStaticURL
                    fullIconSrc = baseStaticURL + iconPath;
                    console.log('使用相对路径:', fullIconSrc);
                  }
                } else {
                  console.log('没有图标，使用默认图标');
                }
                
                return (
                  <Card key={path._id} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => handlePathClick(path)}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* 图标 */}
                        <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                          {fullIconSrc ? (
                            <img 
                              src={fullIconSrc} 
                              alt={path.name} 
                              width={40} 
                              height={40} 
                              onError={(e) => { 
                                console.error('图标加载失败:', fullIconSrc);
                                e.target.style.display = 'none'; 
                              }}
                              onLoad={() => {
                                console.log('图标加载成功:', fullIconSrc);
                              }}
                            />
                          ) : (
                            // 没有图标时使用默认或不显示
                            <WalletIcon sx={{ width: 40, height: 40, color: 'text.secondary' }} />
                          )}
                        </Box>
                        {/* 名称和描述 */}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="bold">{path.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{path.description}</Typography>
                        </Box>
                        {/* 右侧箭头 */}
                        <ArrowForwardIosIcon sx={{ color: 'text.secondary' }} />
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default RechargePaths; 
