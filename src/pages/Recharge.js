import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  CircularProgress,
  Card,
  CardMedia
} from '@mui/material';
import apiService, { baseStaticURL } from '../services/api';

function Recharge() {
  const { pathId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [rechargePath, setRechargePath] = useState(null);
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const selectedPath = location.state?.rechargePath;

    if (selectedPath && selectedPath._id === pathId) {
        setRechargePath(selectedPath);

        // 处理二维码URL - 支持Cloudinary URL和相对路径
        if (selectedPath.qrCode) {
            // 如果是完整的URL（包含http或https），直接使用
            if (selectedPath.qrCode.startsWith('http://') || selectedPath.qrCode.startsWith('https://')) {
                setQrCodeImageUrl(selectedPath.qrCode);
            } else {
                // 如果是相对路径，添加baseStaticURL
                setQrCodeImageUrl(baseStaticURL + selectedPath.qrCode);
            }
        } else {
             setQrCodeImageUrl(null);
        }

        setLoading(false);
    } else if (pathId) {
        // If pathId is present but selectedPath is not, try fetching directly (e.g., on page refresh)
        const fetchRechargePath = async () => {
            try {
                const response = await apiService.rechargeService.getRechargePath(pathId);
                if (response.success && response.data) {
                    setRechargePath(response.data);
                    
                    // 处理二维码URL - 支持Cloudinary URL和相对路径
                    if (response.data.qrCode) {
                        // 如果是完整的URL（包含http或https），直接使用
                        if (response.data.qrCode.startsWith('http://') || response.data.qrCode.startsWith('https://')) {
                            setQrCodeImageUrl(response.data.qrCode);
                        } else {
                            // 如果是相对路径，添加baseStaticURL
                            setQrCodeImageUrl(baseStaticURL + response.data.qrCode);
                        }
                    } else {
                        setQrCodeImageUrl(null);
                    }
                } else {
                    setError(response.message || '未能获取充值路径详情');
                }
            } catch (err) {
                console.error('Error fetching recharge path:', err);
                setError(err.message || '未能获取充值路径详情');
            } finally {
                setLoading(false);
            }
        };
        fetchRechargePath();
    } else {
        setError('未指定充值路径');
        setLoading(false);
    }

  }, [pathId, location.state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('请输入有效的充值金额');
      return;
    }

    if (!rechargePath) {
      setError('充值方式信息缺失');
      return;
    }

    if (!screenshotFile) {
      setError('请上传交易截图');
      return;
    }

    setSubmitting(true);
    setError('');

    const formData = new FormData();
    formData.append('pathId', rechargePath._id);
    formData.append('amount', String(Number(amount)));
    formData.append('proof', screenshotFile);

    console.log('提交充值请求:', {
      pathId: rechargePath._id,
      amount: String(Number(amount)),
      hasProof: !!screenshotFile
    });

    try {
      const response = await apiService.rechargeService.submitRechargeOrder(formData);
      console.log('充值请求响应:', response);
      if (response.success) {
         setAmount('');
         setScreenshotFile(null);
         setError('');
         navigate('/operation-result', {
           state: {
             success: true,
             message: response.message || '充值订单已提交，请等待审核。',
             context: 'recharge_request',
             redirectTo: '/home'
           }
         });
      } else {
         setError(response.message || '提交充值订单失败');
      }
    } catch (err) {
      console.error('Error submitting recharge order:', err);
      setError(err.message || '提交充值订单失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setError('请上传图片文件（支持JPG、PNG、GIF、WEBP格式）');
        e.target.value = ''; // 清空文件选择
        return;
      }
      
      // 验证文件大小（限制为5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError('图片大小不能超过5MB，请选择更小的文件');
        e.target.value = ''; // 清空文件选择
        return;
      }
      
      // 验证文件扩展名
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        setError('请上传支持的图片格式：JPG、PNG、GIF、WEBP');
        e.target.value = ''; // 清空文件选择
        return;
      }
      
      setScreenshotFile(file);
      setError(''); // 清除之前的错误信息
      console.log('充值交易截图已选择:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
    } else {
      setScreenshotFile(null);
      setError('请选择充值交易截图');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!rechargePath) {
       return (
         <Typography align="center" color="text.secondary" sx={{ p: 3 }}>
           未能加载充值方式详情。
         </Typography>
       );
  }

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {rechargePath.description}
        </Typography>

        {/* 收款信息 */}
        <Box sx={{ width: '100%', mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            收款信息:
          </Typography>
          <TextField
            margin="normal"
            fullWidth
            label="收款人"
            value={rechargePath.account}
            InputProps={{ readOnly: true }}
            sx={{ mb: 1 }}
          />
          <TextField
            margin="normal"
            fullWidth
            label="收款账号"
            value={rechargePath.receiver}
            InputProps={{ readOnly: true }}
            sx={{ mb: 2 }}
          />
        </Box>

        {/* 收款二维码 */}
        {qrCodeImageUrl && (
            <Box sx={{ width: '100%', mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    收款二维码:
                </Typography>
                <Card sx={{ mt: 1 }}>
                  <CardMedia
                    component="img"
                    image={qrCodeImageUrl}
                    alt="收款二维码"
                    sx={{ maxHeight: 200, objectFit: 'contain' }}
                  />
                </Card>
            </Box>
        )}

        {/* 充值金额 */}
        <TextField
          margin="normal"
          required
          fullWidth
          id="amount"
          label="充值金额"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          InputProps={{
            startAdornment: <Typography sx={{ mr: 1 }}>¥</Typography>,
          }}
          sx={{ mb: 2 }}
        />

        {/* 交易截图上传 */}
        <Box sx={{ width: '100%', mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            上传充值交易截图 <span style={{ color: 'red' }}>*</span>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            请上传转账成功的截图作为充值凭证，此项目为必填项
          </Typography>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="screenshot-upload"
            type="file"
            onChange={handleFileChange}
            required
          />
          <label htmlFor="screenshot-upload">
            <Button
              variant="outlined"
              component="span"
              fullWidth
              sx={{ mb: 2 }}
            >
              选择充值交易截图
            </Button>
          </label>
          {screenshotFile && (
            <Card sx={{ mt: 2 }}>
              <CardMedia
                component="img"
                image={URL.createObjectURL(screenshotFile)}
                alt="充值交易截图预览"
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
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 2 }}
          onClick={handleSubmit}
          disabled={submitting || !amount || !rechargePath || !screenshotFile}
        >
          {submitting ? <CircularProgress size={24} /> : '提交充值申请'}
        </Button>
      </Box>
    </Container>
  );
}

export default Recharge; 
