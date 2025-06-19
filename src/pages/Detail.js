import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Divider,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  // TextField, // Removed TextField
} from '@mui/material';
import ReactCodeInput from 'react-code-input'; // Import ReactCodeInput
import { useAuth } from '../contexts/AuthContext';
import apiService, { baseStaticURL } from '../services/api';

// Helper function to parse content string
const parseContent = (content) => {
    const fields = {};
    if (typeof content === 'string') {
        content.split('\n').forEach(line => {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key && value) {
                if (key === '手机' && value.length === 11) {
                    fields[key] = `${value.substring(0, 3)}******${value.substring(9)}`;
                } else {
                    fields[key] = value;
                }
            }
        });
    }
    return fields;
};

// Function to calculate countdown (copied from Notification.js)
const calculateCountdown = (purchaseTime, period) => {
    if (!purchaseTime || !period) return 'N/A';
    
    const purchaseDate = new Date(purchaseTime);
    const expiryDate = new Date(purchaseDate.getTime() + period * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = expiryDate - now;

    if (diff <= 0) {
      return '已过期';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}天${hours}小时${minutes}分${seconds}秒`;
};

function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPaymentPasswordSet, setIsPaymentPasswordSet] = useState(false);
  const [isPaymentPasswordModalOpen, setIsPaymentPasswordModalOpen] = useState(false);
  const [paymentPassword, setPaymentPassword] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [contentData, setContentData] = useState({}); // State to hold parsed content data
  const [countdown, setCountdown] = useState(''); // State to hold countdown value

  // Backend base URL for images
  // const backendBaseUrl = 'https://fw108ck86325.vicp.fun'; // REMOVE hardcoded URL

  const checkPaymentPasswordStatus = useCallback(async () => {
    try {
      const response = await apiService.paymentPasswordService.getPaymentPasswordStatus();
      if (response.success) {
        setIsPaymentPasswordSet(response.data.hasPayPassword);
      }
    } catch (err) {
      console.error('获取支付密码状态失败:', err);
    }
  }, []);

  const loadPostDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.postService.getPostDetails(id);
      if (response && response.data) { // Ensure response and response.data exist
        setPost(response.data);
        await checkPaymentPasswordStatus();
        if (response.data.content) {
            const parsed = parseContent(response.data.content);
            setContentData(parsed);
        }
      } else {
        console.error('[Detail.js] Invalid API response structure for getPostDetails:', response);
        setError('加载帖子详情失败: 无效的响应数据');
        setPost(null); // Ensure post is null on error
      }
    } catch (err) {
      console.error('[Detail.js] Error in loadPostDetails:', err);
      setError(err.message || '加载帖子详情失败');
      setPost(null); // Ensure post is null on error
    } finally {
      setLoading(false);
    }
  }, [id, checkPaymentPasswordStatus]); // Added checkPaymentPasswordStatus to dependencies

  useEffect(() => {
    loadPostDetails();
  }, [loadPostDetails]);

  // Effect to update countdown every second if purchased
  useEffect(() => {
    let timer;
    if (post && post.isPurchased) {
      timer = setInterval(() => {
        setCountdown(calculateCountdown(post.purchaseTime, post.period));
      }, 1000);
    } else {
      setCountdown(''); // Clear countdown if not purchased
    }

    return () => clearInterval(timer);
  }, [post]); // Re-run effect if post object changes

  const handleContact = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (post?.isPurchased) {
        console.log('Already purchased, implement contact logic');
        return;
    }

    if (!isPaymentPasswordSet) {
        navigate('/set-payment-password');
        return;
    }

    setIsPaymentPasswordModalOpen(true);
  };

  const handlePaymentPasswordSubmit = async () => {
      setPaymentLoading(true);
      setPaymentError('');
      try {
          // 检查id有效性，避免拼接出错误URL
          if (!id || typeof id !== 'string' || !/^[\w-]+$/.test(id)) {
            setPaymentError('无效的帖子ID，无法购买');
            setPaymentLoading(false);
            return;
          }
          const response = await apiService.postService.purchaseInfo(id, { paymentPassword });

          if (response.success) {
              console.log('购买成功:', response.message);
              setPost(prevPost => ({ ...prevPost, isPurchased: true }));
              setIsPaymentPasswordModalOpen(false);
              setPaymentPassword('');
              setPaymentError('');
              // 获取来源页码参数
              const fromPage = new URLSearchParams(location.search).get('fromPage');
              navigate(`/operation-result`, {
                state: {
                  success: true,
                  message: response.message || '购买成功！',
                  context: 'payment',
                  redirectTo: fromPage ? `/home?page=${fromPage}` : `/detail/${id}`
                }
              });
          } else {
              console.error('购买失败:', response.message);
              setPaymentError(response.message || '购买失败');
              if (response.message.includes('余额不足')) {
                  setIsPaymentPasswordModalOpen(true);
              } else {
                  setIsPaymentPasswordModalOpen(false);
              }
          }

      } catch (err) {
          console.error('购买请求失败:', err);
          setPaymentError(err.response?.data?.message || err.message || '购买请求失败');
          setIsPaymentPasswordModalOpen(false);
      } finally {
          setPaymentLoading(false);
      }
  };

  const handlePaymentPasswordClose = () => {
      setIsPaymentPasswordModalOpen(false);
      setPaymentPassword('');
      setPaymentError('');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" align="center">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!post) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography align="center">未找到帖子</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f7f8fa', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 3, p: 2 }}>
        <Card>
          <CardContent>

            {/* 根据购买状态条件渲染内容 */}
            {!post.isPurchased ? (
              <Box>
                {/* 未购买时显示封面图和部分信息 */}
                {post.imageUrls && post.imageUrls.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Box
                      component="img"
                      src={`${baseStaticURL}${post.imageUrls[0]}`}
                      alt={post.title}
                      sx={{
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                )}
                <Typography variant="h6" gutterBottom>
                  {post.title} {/* 通常包含姓名 */}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  借款金额: ¥{post.loanAmount ? post.loanAmount.toFixed(2) : '--'}
                </Typography>
                 <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  周期: {post.period ? `${post.period}天` : '--'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  还款金额: {post.repaymentAmount ? `¥${post.repaymentAmount}` : '--'}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body1" color="text.primary" align="center" sx={{ mt: 2, fontWeight: 'bold' }}>
                  支付后查看更多详情
                </Typography>

                {/* 购买按钮 */}
                 <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button variant="contained" color="primary" onClick={handleContact} disabled={paymentLoading}>
                    {paymentLoading ? <CircularProgress size={24} /> : `支付 ¥${post.loanAmount} 查看详情`}
                  </Button>
                </Box>
                 {paymentError && (
                  <Typography color="error" align="center" sx={{ mt: 2 }}>
                    {paymentError}
                  </Typography>
                )}

              </Box>
            ) : (
              <Box>
                {/* 已购买时显示完整信息 */}

                {/* 1. 封面图 */}
                {post.imageUrls && post.imageUrls.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Box
                      component="img"
                      src={`${baseStaticURL}${post.imageUrls[0]}`}
                      alt={post.title}
                      sx={{
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                        borderRadius: 1
                      }}
                    />
                  </Box>
                )}

                <Typography variant="h6" gutterBottom>
                  {post.title} {/* 标题，通常包含姓名 */}
                </Typography>

                {/* 2. 表格显示文字内容 */}
                <Table size="small" sx={{ mb: 2 }}>
                  <TableBody>
                    {/* 按照指定顺序显示字段 */}

                    {/* 姓名 */}
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ width: '30%', fontWeight: 'bold' }}>姓名:</TableCell>
                      <TableCell>{post.title}</TableCell>
                    </TableRow>

                    {/* 手机 */}
                    {contentData['手机'] && (
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>手机:</TableCell>
                        <TableCell>{contentData['手机']}</TableCell>
                      </TableRow>
                    )}

                    {/* 年龄 */}
                    {contentData['年龄'] && (
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>年龄:</TableCell>
                        <TableCell>{contentData['年龄']}</TableCell>
                      </TableRow>
                    )}

                    {/* 职业 */}
                    {contentData['职业'] && (
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>职业:</TableCell>
                        <TableCell>{contentData['职业']}</TableCell>
                      </TableRow>
                    )}

                    {/* 借款金额 */}
                     {post.loanAmount !== undefined && post.loanAmount !== null && (
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>借款金额:</TableCell>
                        <TableCell>¥{post.loanAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    )}

                    {/* 还款金额 */}
                    {post.repaymentAmount !== undefined && post.repaymentAmount !== null && (
                       <TableRow>
                         <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>还款金额:</TableCell>
                         <TableCell>¥{post.repaymentAmount}</TableCell>
                       </TableRow>
                    )}

                    {/* 周期 */}
                    {post.period !== undefined && post.period !== null && post.period > 0 && (
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>周期:</TableCell>
                        <TableCell>{post.period}天</TableCell>
                      </TableRow>
                    )}

                    {/* 剩余时间 */}
                     {post.isPurchased && post.period > 0 && post.expiryTime && countdown !== '' && (
                         <TableRow>
                           <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>剩余时间:</TableCell>
                           <TableCell>
                             {countdown === '已过期' ? (
                                 <Typography variant="body2" color="error" fontWeight="bold" component="span">
                                     已过期
                                 </Typography>
                             ) : (
                                 <Typography variant="body2" color="primary.main" fontWeight="bold" component="span">
                                     {countdown}
                                 </Typography>
                             )}
                           </TableCell>
                         </TableRow>
                       )}

                  </TableBody>
                </Table>

                 {/* 3. 更多图片 (显示除第一张之外的图片) */}
                {post.imageUrls && post.imageUrls.length > 1 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>更多图片:</Typography>
                    <Grid container spacing={1}>
                      {post.imageUrls.slice(1).map((url, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Box
                            component="img"
                            src={`${baseStaticURL}${url}`}
                            alt={`Image ${index + 2}`}
                            sx={{
                              width: '100%',
                              height: 'auto',
                              objectFit: 'contain',
                              borderRadius: 1
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* 详细内容 (如果需要独立于表格显示) */}
                 {/* 您可能需要根据实际 content 格式和需求决定是否显示此部分以及如何显示 */}
                {/* 例如，如果 content 包含大量自由文本，可以在表格下方单独显示 */}
                {/* 当前我们将解析的字段放入表格，这里可以不显示原始content，或者只显示未被解析的部分 */}
                 {/* <Typography variant="body1" color="text.primary" sx={{ whiteSpace: 'pre-wrap', mt: 2 }}>
                   {post.content}
                </Typography> */}

              </Box>
            )}

            {/* 支付密码输入模态框 */}
            <Dialog open={isPaymentPasswordModalOpen} onClose={handlePaymentPasswordClose} PaperProps={{ sx: { borderRadius: '12px' } }}>
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
                {paymentError && (
                  <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {paymentError}
                  </Typography>
                )}
              </DialogContent>
              <DialogActions sx={{ justifyContent: 'center', gap: 13 }}>
                <Button onClick={handlePaymentPasswordClose} color="secondary" variant="contained" disabled={paymentLoading} sx={{ borderRadius: '12px' }}>
                  取消
                </Button>
                <Button onClick={handlePaymentPasswordSubmit} color="primary" variant="contained" disabled={paymentLoading || !paymentPassword || paymentPassword.length < 6} sx={{ borderRadius: '12px' }}>
                  {paymentLoading ? <CircularProgress size={24} /> : '支付'}
                </Button>
              </DialogActions>
            </Dialog>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default Detail; 