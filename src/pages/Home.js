import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import CardMedia from '@mui/material/CardMedia';
import Skeleton from '@mui/material/Skeleton';
import Pagination from '@mui/material/Pagination';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Modal from '@mui/material/Modal';
import Paper from '@mui/material/Paper';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import apiService, { baseStaticURL } from '../services/api';

// 色带颜色数组
const bandColors = ['#4ecdc4', '#f7b731', '#fd6e6a', '#5f27cd', '#54a0ff', '#00b894', '#e17055', '#00b8d4'];

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [dontShowToday, setDontShowToday] = useState(false);
  
  // 初始化时从URL读取page参数
  const initialPage = parseInt(query.get('page')) || 1;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize] = useState(12); // 每页12条

  // 使用 React Query 获取帖子数据，添加分页参数
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', currentPage, pageSize],
    queryFn: () => apiService.postService.getPosts({ page: currentPage, limit: pageSize }),
    select: (response) => response?.data || { list: [], totalPages: 1, total: 0 },
    staleTime: 5 * 60 * 1000, // 5分钟内数据不会重新获取
    cacheTime: 30 * 60 * 1000, // 缓存30分钟
  });

  // 使用 React Query 获取广告数据，添加staleTime和cacheTime
  const { data: adsData, isLoading: adsLoading } = useQuery({
    queryKey: ['ads'],
    queryFn: () => apiService.systemService.getAds(),
    select: (response) => {
      if (response.success && response.data) {
        return response.data
          .filter(ad => ad.status === 'active')
          .map(ad => ({
            ...ad,
            imageUrl: ad.imageUrl?.startsWith('http') ? ad.imageUrl : `${baseStaticURL}${ad.imageUrl}`
          }));
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5分钟内数据不会重新获取
    cacheTime: 30 * 60 * 1000, // 缓存30分钟
  });

  // 处理分页变化
  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
    // 更新URL参数
    navigate(`/home?page=${newPage}`);
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 监听URL变化，保持currentPage与URL同步
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const page = parseInt(query.get('page')) || 1;
    setCurrentPage(page);
  }, [location.search]);

  // 使用useMemo缓存卡片渲染结果
  const cards = useMemo(() => {
    if (postsLoading || adsLoading) {
      return Array(8).fill(null).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={`skeleton-${index}`}>
          <Box sx={{ width: 170, height: 170, m: '0 auto' }}>
            <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: 4 }} />
          </Box>
        </Grid>
      ));
    }

    const cards = [];
    let adIndex = 0;
    let infoIndex = 0;
    const posts = postsData?.list || [];
    const activeAds = adsData || [];

    while (infoIndex < posts.length) {
      // 广告卡片
      if (infoIndex > 0 && infoIndex % 5 === 0 && adIndex < activeAds.length) {
        const ad = activeAds[adIndex];
        if (ad) {
          cards.push(
            <Grid item xs={12} sm={6} md={3} key={`ad-${adIndex}`}>
              <Box
                sx={{
                  width: 170,
                  height: 170,
                  m: '0 auto',
                  cursor: ad?.path ? 'pointer' : 'default'
                }}
                onClick={() => {
                  if (ad?.path) {
                    window.open(ad.path, '_blank');
                  }
                }}
              >
                <Card
                  sx={{
                    borderRadius: 4,
                    boxShadow: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    width: '100%',
                    height: '100%'
                  }}
                >
                  <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                    <CardMedia
                      component="img"
                      image={ad.imageUrl}
                      alt={ad.title}
                      loading="lazy"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: '#e67e22',
                        color: '#fff',
                        px: 2,
                        py: 0.5,
                        borderRadius: 3,
                        fontWeight: 700,
                        fontSize: 16,
                        boxShadow: 1
                      }}
                    >
                      {ad.price ? `¥${ad.price}` : '广告'}
                    </Box>
                    {ad.title && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 0,
                          bgcolor: bandColors[Math.floor(Math.random() * bandColors.length)],
                          color: '#222',
                          px: 2,
                          py: 1,
                          borderBottomLeftRadius: 16,
                          borderBottomRightRadius: 16,
                          fontWeight: 600,
                          fontSize: 18
                        }}
                      >
                        {ad.title}
                      </Box>
                    )}
                  </Box>
                </Card>
              </Box>
            </Grid>
          );
        }
        adIndex++;
      }
      // 信息卡片
      const post = posts[infoIndex];
      if (!post) { infoIndex++; continue; }
      cards.push(
        <Grid item xs={12} sm={6} md={3} key={post._id || infoIndex}>
          <Box sx={{ width: 170, height: 170, m: '0 auto' }}>
            <Card
              sx={{
                borderRadius: 4,
                boxShadow: 3,
                overflow: 'hidden',
                position: 'relative',
                width: '100%',
                height: '100%',
                cursor: 'pointer'
              }}
              onClick={() => post && handleCardClick(post._id)}
            >
              <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                <CardMedia
                  component="img"
                  image={
                    post.imageUrls && post.imageUrls.length > 0
                      ? (post.imageUrls[0].startsWith('http') ? post.imageUrls[0] : `${baseStaticURL}${post.imageUrls[0]}`)
                      : 'https://via.placeholder.com/150'
                  }
                  alt={post.title}
                  loading="lazy"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
                />
                {/* 醒目的价格标签 */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    bgcolor: '#e74c3c',
                    color: '#fff',
                    px: 2,
                    py: 0.5,
                    borderRadius: 3,
                    fontWeight: 700,
                    fontSize: 16,
                    boxShadow: 1
                  }}
                >
                  ¥{post.loanAmount.toFixed(2)}
                </Box>
                {/* 随机色带标题 */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: bandColors[Math.floor(Math.random() * bandColors.length)],
                    color: '#222',
                    px: 2,
                    py: 1,
                    borderBottomLeftRadius: 16,
                    borderBottomRightRadius: 16,
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  {post.title}
                </Box>
              </Box>
            </Card>
          </Box>
        </Grid>
      );
      infoIndex++;
    }

    // 如果还有剩余的广告，在最后显示
    while (adIndex < activeAds.length) {
      const ad = activeAds[adIndex];
      if (ad) {
        cards.push(
          <Grid item xs={12} sm={6} md={3} key={`ad-${adIndex}`}>
            <Box
              sx={{
                width: 170,
                height: 170,
                m: '0 auto',
                cursor: ad?.path ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (ad?.path) {
                  window.open(ad.path, '_blank');
                }
              }}
            >
              <Card
                sx={{
                  borderRadius: 4,
                  boxShadow: 3,
                  overflow: 'hidden',
                  position: 'relative',
                  width: '100%',
                  height: '100%'
                }}
              >
                <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                  <CardMedia
                    component="img"
                    image={ad.imageUrl}
                    alt={ad.title}
                    loading="lazy"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      bgcolor: '#e67e22',
                      color: '#fff',
                      px: 2,
                      py: 0.5,
                      borderRadius: 3,
                      fontWeight: 700,
                      fontSize: 16,
                      boxShadow: 1
                    }}
                  >
                    {ad.price ? `¥${ad.price}` : '广告'}
                  </Box>
                  {ad.title && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: bandColors[Math.floor(Math.random() * bandColors.length)],
                        color: '#222',
                        px: 2,
                        py: 1,
                        borderBottomLeftRadius: 16,
                        borderBottomRightRadius: 16,
                        fontWeight: 600,
                        fontSize: 18
                      }}
                    >
                      {ad.title}
                    </Box>
                  )}
                </Box>
              </Card>
            </Box>
          </Grid>
        );
      }
      adIndex++;
    }
    return cards;
  }, [postsData, adsData, postsLoading, adsLoading, navigate]);

  // 处理公告切换
  const handleAnnouncementChange = (index) => {
    setCurrentAnnouncementIndex(index);
  };

  // 处理上一页
  const handlePrevPage = () => {
    if (currentAnnouncementIndex > 0) {
      setCurrentAnnouncementIndex(currentAnnouncementIndex - 1);
    }
  };

  // 处理下一页
  const handleNextPage = () => {
    if (currentAnnouncementIndex < announcements.length - 1) {
      setCurrentAnnouncementIndex(currentAnnouncementIndex + 1);
    }
  };

  // 跳转到详情页时，带上当前分页参数
  const handleCardClick = (id) => {
    navigate(`/detail/${id}?fromPage=${currentPage}`);
  };

  // 页面主内容渲染
  if (postsLoading || adsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>加载中...</Typography>
      </Box>
    );
  }

  // 事件监听、公告弹窗等副作用逻辑延后
  useEffect(() => {
    const handleShowSystemNotification = (event) => {
      const notificationData = event.detail;
      if (notificationData && notificationData.notification) {
        setAnnouncements([notificationData.notification]);
        setCurrentAnnouncementIndex(0);
        setShowAnnouncementModal(true);
        setDontShowToday(notificationData.dontShowTodayStatus || false);
      }
    };
    window.addEventListener('showSystemNotificationDetail', handleShowSystemNotification);
    return () => {
      window.removeEventListener('showSystemNotificationDetail', handleShowSystemNotification);
    };
  }, []);

  return (
    <>
      <Grid container spacing={3} sx={{ pt: 4 }}>
        {cards}
      </Grid>
      
      {/* 分页控件 */}
      {postsData && postsData.totalPages > 1 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          mt: 4,
          mb: 4,
          gap: 2
        }}>
          <IconButton 
            disabled={currentPage === 1 || postsLoading}
            onClick={() => handlePageChange(null, currentPage - 1)}
            sx={{ 
              color: currentPage === 1 ? 'text.disabled' : 'primary.main',
              '&:hover': {
                bgcolor: currentPage === 1 ? 'transparent' : 'primary.light'
              }
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          
          <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'center' }}>
            第 {currentPage} 页，共 {postsData.totalPages} 页
          </Typography>
          
          <IconButton 
            disabled={currentPage === postsData.totalPages || postsLoading}
            onClick={() => handlePageChange(null, currentPage + 1)}
            sx={{ 
              color: currentPage === postsData.totalPages ? 'text.disabled' : 'primary.main',
              '&:hover': {
                bgcolor: currentPage === postsData.totalPages ? 'transparent' : 'primary.light'
              }
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}

      {/* Announcement Modal using Material UI Modal */}
      <Modal
        open={showAnnouncementModal}
        onClose={() => {
          setShowAnnouncementModal(false);
          setCurrentAnnouncementIndex(0);
          setAnnouncements([]);
          if (dontShowToday) {
            const today = new Date().toISOString().slice(0, 10);
            localStorage.setItem('noShowAnnouncementDate', today);
          }
        }}
        aria-labelledby="announcement-modal-title"
        aria-describedby="announcement-modal-description"
      >
        <Paper sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 400 },
          maxWidth: '100%',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: { xs: 2, sm: 4 },
          maxHeight: '80vh',
          overflowY: 'auto',
          borderRadius: 2,
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            pb: 1
          }}>
             <Typography id="announcement-modal-title" variant="h6" component="h2">
               最新公告 ({currentAnnouncementIndex + 1}/{announcements.length})
             </Typography>
             <IconButton onClick={() => {
               setShowAnnouncementModal(false);
               setCurrentAnnouncementIndex(0);
               setAnnouncements([]);
               if (dontShowToday) {
                 const today = new Date().toISOString().slice(0, 10);
                 localStorage.setItem('noShowAnnouncementDate', today);
               }
             }} size="small">
               <CloseIcon />
             </IconButton>
          </Box>

          <Box sx={{ position: 'relative', px: { xs: 1, sm: 3 } }}>
            {announcements.length > 1 && (
              <>
                <IconButton
                  onClick={handlePrevPage}
                  disabled={currentAnnouncementIndex === 0}
                  sx={{
                    position: 'absolute',
                    left: { xs: -8, sm: -12 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: 'transparent',
                    },
                    '&.Mui-disabled': {
                      color: 'action.disabled',
                    },
                    zIndex: 1
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton
                  onClick={handleNextPage}
                  disabled={currentAnnouncementIndex === announcements.length - 1}
                  sx={{
                    position: 'absolute',
                    right: { xs: -8, sm: -12 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: 'transparent',
                    },
                    '&.Mui-disabled': {
                      color: 'action.disabled',
                    },
                    zIndex: 1
                  }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </>
            )}

            <Box id="announcement-modal-description" sx={{ mt: 2, position: 'relative', minHeight: 150 }}>
              {announcements.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center">
                  暂无公告
                </Typography>
              ) : (
                <Box 
                  sx={{ 
                    p: { xs: 1.5, sm: 2 },
                    bgcolor: 'background.default',
                    borderRadius: 1,
                    minHeight: 150,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box>
                    <Typography 
                      variant="subtitle1" 
                      component="h6"
                      sx={{ 
                        fontWeight: 'bold',
                        mb: 1.5,
                        color: 'primary.main',
                        fontSize: { xs: '1rem', sm: '1.1rem' }
                      }}
                    >
                      {announcements[currentAnnouncementIndex].title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        mb: 1,
                        lineHeight: 1.6,
                        fontSize: { xs: '0.875rem', sm: '0.9rem' }
                      }}
                    >
                      {announcements[currentAnnouncementIndex].content}
                    </Typography>
                  </Box>
                  {announcements[currentAnnouncementIndex].createdAt && (
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      display="block" 
                      sx={{ 
                        mt: 2,
                        textAlign: 'right',
                        fontSize: '0.75rem',
                        opacity: 0.8
                      }}
                    >
                      {new Date(announcements[currentAnnouncementIndex].createdAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
            {announcements.length > 1 && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 1,
                mt: 2
              }}>
                {announcements.map((_, index) => (
                  <Box
                    key={index}
                    onClick={() => handleAnnouncementChange(index)}
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: currentAnnouncementIndex === index ? 'primary.main' : 'grey.300',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: currentAnnouncementIndex === index ? 'primary.dark' : 'grey.400',
                      }
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Paper>
      </Modal>
      {/* 复选框放在弹窗外部，居中，仅在弹窗显示时出现 */}
      {showAnnouncementModal && (
        <Box sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: { xs: 24, sm: 40 },
          display: 'flex',
          justifyContent: 'center',
          zIndex: 1401 // 比modal略高
        }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={dontShowToday}
                onChange={e => setDontShowToday(e.target.checked)}
                color="primary"
              />
            }
            label="今日不再提示"
            sx={{
              bgcolor: 'background.paper',
              px: 2,
              borderRadius: 2,
              boxShadow: 2,
              userSelect: 'none',
            }}
          />
        </Box>
      )}
    </>
  );
}

export default Home; 
