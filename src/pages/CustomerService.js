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
  Modal
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { useAuth } from '../contexts/AuthContext';
import apiService, { baseStaticURL } from '../services/api';

const INPUT_AREA_HEIGHT = '25px';
const POLLING_INTERVAL = 4000; // 4秒轮询一次

function CustomerServicePage() {
  const { user, fetchUnreadCSCount } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
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
      const response = await apiService.customerService.getMessages(user._id);
      if (response.success && Array.isArray(response.data)) {
        setMessages(response.data);
        
        // 标记所有未读消息为已读
        const unreadMessages = response.data.filter(msg => !msg.isRead && msg.senderType === 'admin');
        
        // 对每个未读消息调用 markMessageAsRead
        for (const msg of unreadMessages) {
          try {
            await apiService.customerService.markMessageAsRead(msg._id);
          } catch (err) {
            console.error('CustomerServicePage: Failed to mark message as read:', msg._id, err);
          }
        }
        
        // 更新未读消息计数
        if (fetchUnreadCSCount) {
          fetchUnreadCSCount();
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
  }, [user, fetchUnreadCSCount]);

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

    console.log('Selected file for upload:', file.name);
    setSending(true);
    setError(null);

    try {
      // 1. Upload file to server
      // apiService.customerService.uploadImage now handles FormData creation and appending 'file'
      const uploadResponse = await apiService.customerService.uploadImage(file);
      console.log('Image upload response:', uploadResponse);

      if (uploadResponse.success && uploadResponse.data && uploadResponse.data.url) {
        const imageUrl = uploadResponse.data.url;
        console.log('Image URL received:', imageUrl);
        
        // 2. Send message with image
        const messagePayload = {
          messageType: 'image',
          imageUrl: imageUrl,
          content: file.name
        };

        console.log('Sending image message with payload:', messagePayload);
        const sendMessageResponse = await apiService.customerService.sendMessage(messagePayload);
        console.log('Send message response:', sendMessageResponse);

        if (sendMessageResponse.success && sendMessageResponse.data) {
          console.log('Image message sent successfully:', sendMessageResponse.data);
          setMessages(prevMessages => [...prevMessages, sendMessageResponse.data]);
        } else {
          setError(sendMessageResponse.message || '发送图片消息失败');
        }
      } else {
        setError('图片上传失败或返回格式不正确');
      }
    } catch (err) {
      console.error('Error during image upload or sending message:', err);
      setError(err.message || '图片上传或发送失败');
    } finally {
      setSending(false);
      scrollToBottom();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
        {error && <Typography color="error" sx={{ textAlign: 'center', my: 2 }}>{error}</Typography>}
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
          disabled={sending}
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
                <IconButton onClick={triggerImageSelect} edge="end">
                  <AddPhotoAlternateIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <IconButton 
          color="primary" 
          onClick={handleSendMessage} 
          disabled={sending || (!newMessage.trim() && !'YOUR_IMAGE_PENDING_STATE')} // Adjust disabled logic for images
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