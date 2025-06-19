import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import apiService from '../services/api';

function MyPosts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.postService.getMyPosts();
      setPosts(data);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (id) => {
    navigate(`/publish/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这条信息吗？')) {
      try {
        await apiService.postService.deletePost(id);
        setPosts(posts.filter(post => post.id !== id));
      } catch (err) {
        setError(err.message || '删除失败');
      }
    }
  };

  return (
    <Box sx={{ bgcolor: '#f7f8fa', minHeight: '100vh' }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>
            我的发布
          </Typography>
          <Button color="inherit" onClick={() => navigate('/publish')}>
            发布新信息
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 3, p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>加载中...</Typography>
          </Box>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : posts.length === 0 ? (
          <Typography align="center" sx={{ mt: 8 }}>暂无发布信息</Typography>
        ) : (
          <List>
            {posts.map((post) => (
              <React.Fragment key={post.id}>
                <ListItem>
                  <ListItemText
                    primary={post.title}
                    secondary={post.content}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleEdit(post.id)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(post.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}

export default MyPosts; 