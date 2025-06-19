import React from 'react';
import {
  Box,
  Card,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

function Settings() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        设置
      </Typography>

      <Card>
        <List>
          <ListItem button onClick={() => navigate('/change-password')}>
            <ListItemText
              primary="登入密码修改"
            />
            <ListItemSecondaryAction>
              <ArrowForwardIosIcon fontSize="small" />
            </ListItemSecondaryAction>
          </ListItem>

          <Divider />

          <ListItem button onClick={() => navigate('/forgot-password')}>
            <ListItemText
              primary="登入密码找回"
            />
            <ListItemSecondaryAction>
              <ArrowForwardIosIcon fontSize="small" />
            </ListItemSecondaryAction>
          </ListItem>

          <Divider />

          <ListItem button onClick={() => navigate('/set-payment-password')}>
            <ListItemText
              primary="支付密码设置"
            />
            <ListItemSecondaryAction>
              <ArrowForwardIosIcon fontSize="small" />
            </ListItemSecondaryAction>
          </ListItem>

          <Divider />

          <ListItem button onClick={() => navigate('/forgot-payment-password')}>
            <ListItemText
              primary="支付密码找回"
            />
            <ListItemSecondaryAction>
              <ArrowForwardIosIcon fontSize="small" />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Card>
    </Box>
  );
}

export default Settings; 