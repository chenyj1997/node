import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  CircularProgress,
  IconButton,
  InputAdornment,
  Modal,
  Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { useAuth } from '../contexts/AuthContext';
import apiService, { baseStaticURL } from '../services/api';

const INPUT_AREA_HEIGHT = '25px';
const POLLING_INTERVAL = 4000; // 4秒轮询一次

function CustomerServicePage() {
  const { user, clearUnreadCSCount } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  // State for image modal
  const [openImageModal, setOpenImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    if (!user || !user._id) {
      console.log('CustomerServicePage: fetchMessages: User or user ID not available, skipping fetch.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 首先标记所有消息为已读
      try {
        await apiService.customerService.markAllCSMessagesAsRead();
        console.log('所有客服消息已标记为已读');
      } catch (err) {
        console.error('标记所有消息为已读失败:', err);
      }

      const response = await apiService.customerService.getMessages(user._id);
      if (response.success && Array.isArray(response.data)) {
        setMessages(response.data);
        
        // 清除前端的未读计数
        if (clearUnreadCSCount) {
          clearUnreadCSCount();
        }
      } else {
        console.log('CustomerServicePage: Invalid response format:', response);
        setError(response.message || 'Failed to load messages.');
        setMessages([]);
      }
    } catch (err) {
      console.error('CustomerServicePage: Error fetching messages:', err);
      setError(err.message || 'An error occurred while fetching messages.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [user, clearUnreadCSCount]);

  useEffect(() => {
    if (user && user._id) {
      fetchMessages();
      // 启动轮询
      pollingIntervalRef.current = setInterval(fetchMessages, POLLING_INTERVAL);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [user, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    setError(null);
    try {
      const response = await apiService.customerService.sendMessage({
        content: newMessage,
      });
      if (response.success && response.data) {
        setMessages(prevMessages => [...prevMessages, response.data]);
        setNewMessage('');
      } else {
        setError(response.message || 'Failed to send message.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'An error occurred while sending the message.');
    } finally {
      setSending(false);
      scrollToBottom(); 
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件！');
      event.target.value = '';
      return;
    }

    // 验证文件大小（限制为5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('图片文件过大，请选择小于5MB的图片！');
      event.target.value = '';
      return;
    }

    // 创建本地预览URL
    const previewUrl = URL.createObjectURL(file);
    
    // 立即在对话框中显示预览
    const tempMessageId = 'temp-' + Date.now();
    const tempMessage = {
      _id: tempMessageId,
      tempId: tempMessageId,
      senderType: 'user',
      messageType: 'image',
      imageUrl: previewUrl,
      content: file.name,
      createdAt: new Date(),
      sender: { username: '我' },
      isTemp: true, // 标记为临时消息
      isError: false
    };

    // 添加到消息列表并显示
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    scrollToBottom();

    // 显示上传进度提示
    setError('正在上传图片...');

    try {
      // 异步上传图片
      const uploadResponse = await apiService.customerService.uploadImage(file);
      console.log('Image upload response:', uploadResponse);

      if (uploadResponse.success && uploadResponse.data && uploadResponse.data.url) {
        const imageUrl = uploadResponse.data.url;
        
        // 发送图片消息到服务器
        const messagePayload = {
          messageType: 'image',
          imageUrl: imageUrl,
          content: file.name
        };

        const sendMessageResponse = await apiService.customerService.sendMessage(messagePayload);
        
        if (sendMessageResponse.success && sendMessageResponse.data) {
          // 上传成功，移除临时消息
          setMessages(prevMessages => prevMessages.filter(msg => msg._id !== tempMessageId));
          setError(null);
        } else {
          // 发送失败，保留临时消息但标记为错误
          setMessages(prevMessages => prevMessages.map(msg => 
            msg._id === tempMessageId ? { ...msg, isError: true } : msg
          ));
          setError(sendMessageResponse.message || '图片发送失败！');
        }
      } else {
        // 上传失败，移除临时消息
        setMessages(prevMessages => prevMessages.filter(msg => msg._id !== tempMessageId));
        setError(uploadResponse.message || '图片上传失败！');
      }
    } catch (err) {
      console.error('图片上传或发送失败:', err);
      // 上传失败，移除临时消息
      setMessages(prevMessages => prevMessages.filter(msg => msg._id !== tempMessageId));
      setError(err.message || '图片上传或发送失败！');
    } finally {
      // 清理本地预览URL
      URL.revokeObjectURL(previewUrl);
      setUploadingImage(false);
      event.target.value = ''; // Clear file input value to allow re-uploading the same file
    }
  };

  const triggerImageSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleOpenImageModal = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setOpenImageModal(true);
  };

  const handleCloseImageModal = () => {
    setOpenImageModal(false);
    setSelectedImageUrl('');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        paddingLeft: { xs: '1px', sm: '2px' },
        paddingRight: { xs: '1px', sm: '2px' },
        paddingTop: { xs: '8px', sm: '8px' },
        display: 'flex', 
        flexDirection: 'column', 
        paddingBottom: INPUT_AREA_HEIGHT,
        justifyContent: 'flex-end',
        minHeight: 0,
      }}>
        {loading && messages.length === 0 && <CircularProgress sx={{ alignSelf: 'center', my: 'auto' }} />}
        {error && (
          <Alert 
            severity={error.includes('失败') ? 'error' : 'info'} 
            sx={{ mx: 2, mb: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        {!loading && !error && messages.length === 0 && (
          <Typography sx={{ textAlign: 'center', my: 'auto', color: 'text.secondary' }}>
            还没有消息，快开始对话吧！
          </Typography>
        )}
        <List sx={{ flexGrow: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: '100px' }}>
          {messages.map((msg) => (
            <ListItem 
              key={msg._id || msg.tempId} 
              sx={{
                display: 'flex', 
                flexDirection: msg.senderType === 'user' || msg.sender?._id === user?._id ? 'row-reverse' : 'row',
                px: 0,
              }}
            >
              <Paper 
                elevation={1} 
                sx={{
                  p: 1.5,
                  borderRadius: '20px',
                  bgcolor: msg.senderType === 'user' || msg.sender?._id === user?._id ? 'primary.main' : 'grey.200',
                  color: msg.senderType === 'user' || msg.sender?._id === user?._id ? 'primary.contrastText' : 'text.primary',
                  maxWidth: '65%',
                  mx: msg.senderType === 'user' || msg.sender?._id === user?._id ? 0 : '8px',
                  mr: msg.senderType === 'user' || msg.sender?._id === user?._id ? '8px' : 0,
                  opacity: msg.isTemp ? 0.7 : 1,
                  border: msg.isError ? '2px solid #f44336' : 'none',
                }}
              >
                {msg.messageType === 'image' && msg.imageUrl ? (
                  <Box>
                    <Box 
                      component="img" 
                      src={msg.imageUrl.startsWith('http') ? msg.imageUrl : `${baseStaticURL}${msg.imageUrl}`}
                      alt={msg.content || '图片消息'} 
                      sx={{ 
                        maxWidth: '100%', 
                        maxHeight: '250px', 
                        borderRadius: '18px', 
                        display: 'block',
                        cursor: 'pointer'
                      }} 
                      onClick={() => handleOpenImageModal(msg.imageUrl.startsWith('http') ? msg.imageUrl : `${baseStaticURL}${msg.imageUrl}`)}
                    />
                    {/* 为临时消息添加上传状态指示 */}
                    {msg.isTemp && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          textAlign: 'center', 
                          mt: 0.5,
                          fontSize: '0.75rem',
                          color: msg.isError ? '#f44336' : 'rgba(255,255,255,0.8)',
                        }}
                      >
                        {msg.isError ? '发送失败' : '正在上传...'}
                      </Typography>
                    )}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block', 
                        textAlign: 'right', 
                        mt: 0.5,
                        fontSize: '0.75rem',
                        color: msg.senderType === 'user' || msg.sender?._id === user?._id ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                      }}
                    >
                      {`${msg.sender?.username || (msg.senderType === 'user' ? '我' : '客服')} - ${new Date(msg.createdAt || Date.now()).toLocaleString()}`}
                    </Typography>
                  </Box>
                ) : (
                  <ListItemText 
                    primary={msg.content} 
                    secondary={`${msg.sender?.username || (msg.senderType === 'user' ? '我' : '客服')} - ${new Date(msg.createdAt || Date.now()).toLocaleString()}`} 
                    secondaryTypographyProps={{ 
                      color: msg.senderType === 'user' || msg.sender?._id === user?._id ? 'rgba(255,255,255,0.8)' : 'text.secondary', 
                      fontSize: '0.75rem', 
                      mt: 0.5 
                    }}
                  />
                )}
              </Paper>
            </ListItem>
          ))}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Image Modal */}
      <Modal
        open={openImageModal}
        onClose={handleCloseImageModal}
        aria-labelledby="image-modal-title"
        aria-describedby="image-modal-description"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box 
          sx={{
            position: 'relative',
            bgcolor: 'background.paper', 
            boxShadow: 24, 
            p: 0, // No padding for the box itself, image will fill
            outline: 'none',
            maxWidth: '90vw',
            maxHeight: '90vh',
          }}
        >
          <IconButton 
            onClick={handleCloseImageModal} 
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, backgroundColor: 'rgba(0,0,0,0.3)', color:'white', '&:hover': {backgroundColor: 'rgba(0,0,0,0.5)'} }}
          >
            <SendIcon sx={{transform: 'rotate(135deg)'}}/> {/* Using SendIcon rotated as a close icon example, can be replaced with CloseIcon */}
          </IconButton>
          <img 
            src={selectedImageUrl} 
            alt="Selected preview" 
            style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(90vh - 16px)', objectFit: 'contain' }}
          />
        </Box>
      </Modal>

      {/* Hidden file input */}
      <input 
        type="file" 
        accept="image/*" 
        style={{ display: 'none' }} 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
      />

      <Box
        component="footer"
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: '4px',
          py: '4px',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          backgroundColor: '#E3F2FD', // Light blue background - adjust as needed (e.g. theme.palette.primary.light)
          zIndex: 1100,
          boxSizing: 'border-box'
        }}
      >
        <TextField
          variant="outlined"
          placeholder="输入消息..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
          disabled={sending || uploadingImage}
          sx={{
            flexGrow: 1, // Allow TextField to take available space
            mr: '18px', // 增加右边距以增加图标间距
            borderRadius: '25px', // Rounded text field
            backgroundColor: 'white',
            '& .MuiOutlinedInput-root': {
              borderRadius: '25px',
              padding: '0px 0px', // 进一步减小垂直内边距
              minHeight: 'unset', // 移除最小高度限制
              '& fieldset': {
                borderColor: 'transparent', // Hide border
              },
              '&:hover fieldset': {
                borderColor: 'transparent', // Hide border on hover
              },
              '&.Mui-focused fieldset': {
                borderColor: 'transparent', // Hide border when focused
              },
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  onClick={triggerImageSelect} 
                  edge="end"
                  disabled={uploadingImage}
                >
                  <AddPhotoAlternateIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <IconButton 
          color="primary" 
          onClick={handleSendMessage} 
          disabled={sending || uploadingImage || !newMessage.trim()}
          sx={{ 
            backgroundColor: 'primary.main', // Use theme color
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            }
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

export default CustomerServicePage; 
