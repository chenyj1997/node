import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  CircularProgress,
  Alert,
} from '@mui/material';
import ReactCodeInput from 'react-code-input';
import apiService from '../services/api';

function SetPaymentPassword() {
    const navigate = useNavigate();
    // State for form fields
    const [currentPassword, setCurrentPassword] = useState(''); // For modification case
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    // State for loading, error, success
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    // State for payment password status
    const [isPaymentPasswordSet, setIsPaymentPasswordSet] = useState(false);
    const [statusLoading, setStatusLoading] = useState(true);

     // Fetch payment password status on component mount
    useEffect(() => {
        const checkStatus = async () => {
            try {
                setStatusLoading(true);
                // Assuming backend returns a boolean indicating if password is set
                const response = await apiService.paymentPasswordService.getPaymentPasswordStatus();
                 // Need to confirm the actual field name from backend, assuming response.data.isSet
                setIsPaymentPasswordSet(response.data?.hasPayPassword || false); // Adjust based on actual response field
                setStatusLoading(false);
            } catch (err) {
                console.error('Error fetching payment password status:', err);
                setError('加载支付密码状态失败');
                setStatusLoading(false);
            }
        };
        checkStatus();
    }, []); // Empty dependency array means this effect runs once on mount

    const handleSubmit = async (e) => {
        console.log('handleSubmit called'); // Log at the beginning
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Basic validation
        if (isPaymentPasswordSet) {
             // Validation for modification
             if (!currentPassword || !newPassword || !confirmNewPassword) {
                 setError('请填写所有密码字段');
                 return;
             }
             if (newPassword !== confirmNewPassword) {
                 setError('两次输入的新密码不一致');
                 return;
             }
              if (newPassword.length < 6) {
                setError('新支付密码长度不能少于6位');
                return;
              }

        } else {
            // Validation for initial setting
            if (!newPassword || !confirmNewPassword) {
                setError('请填写支付密码和确认密码');
                return;
            }
            if (newPassword !== confirmNewPassword) {
                setError('两次输入的密码不一致');
                return;
            }
             if (newPassword.length < 6) {
                setError('支付密码长度不能少于6位');
                return;
             }
        }

        setLoading(true);

        try {
            let response;
            let requestBody = {};

            if (isPaymentPasswordSet) {
                // Modification case
                if (!currentPassword) {
                     setError('请输入原支付密码');
                     setLoading(false);
                     return;
                }
                 requestBody = {
                     currentPassword: currentPassword,
                     password: newPassword, // Send new password in 'password' field
                 };

            } else {
                // Initial setting case
                 requestBody = {
                     password: newPassword,
                 };
            }

            // Call the API to set/modify payment password
            // We are using the same endpoint for both set and modify as per backend wallet.js
             console.log('Calling setPaymentPassword API with body:', requestBody); // Log before API call
             // response = await apiService.paymentPasswordService.setPaymentPassword(requestBody);

             if (isPaymentPasswordSet) {
                 // Modification case
                 response = await apiService.paymentPasswordService.modifyPaymentPassword(requestBody);
             } else {
                 // Initial setting case
                 response = await apiService.paymentPasswordService.setPaymentPassword(requestBody);
             }

            console.log('Set/Modify Payment Password API response:', response); // Add logging for success case

            if (response.success) {
                setSuccessMessage(response.message || (isPaymentPasswordSet ? '支付密码修改成功' : '支付密码设置成功'));
                 // Update status after successful operation
                setIsPaymentPasswordSet(true);
                // Optionally navigate back after a delay
                setTimeout(() => {
                    navigate(-1); // Go back to previous page (e.g., Profile)
                }, 2000);
            } else {
                setError(response.message || (isPaymentPasswordSet ? '修改支付密码失败' : '设置支付密码失败'));
            }
        } catch (err) {
            console.error('Error handling payment password:', err);
            console.error('Error response from backend:', err.response); // Add logging for error response
            // Improved error message extraction
            const errorMessage = err.response?.data?.message || err.message || (isPaymentPasswordSet ? '修改支付密码失败' : '设置支付密码失败');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Show loading indicator while checking status
    if (statusLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container component="main" maxWidth="sm" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, boxShadow: 3, borderRadius: 2 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                    {isPaymentPasswordSet ? '修改支付密码' : '设置新的支付密码'}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                        {error}
                    </Alert>
                )}

                {successMessage && (
                    <Alert severity="success" sx={{ mb: 2, width: '100%' }}>
                        {successMessage}
                    </Alert>
                )}

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    {isPaymentPasswordSet && (
                        <Box sx={{ mb: 2, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="subtitle1" gutterBottom>原支付密码</Typography>
                            <ReactCodeInput
                                type="password"
                                fields={6}
                                value={currentPassword}
                                onChange={(value) => setCurrentPassword(value)}
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
                                    borderColor: '#6a0dad', // Purple color for focus
                                    boxShadow: '0 0 0 1px #6a0dad',
                                }}
                            />
                        </Box>
                    )}
                    <Box sx={{ mb: 2, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="subtitle1" gutterBottom>{isPaymentPasswordSet ? '新支付密码' : '支付密码'}</Typography>
                        <ReactCodeInput
                            type="password"
                            fields={6}
                            value={newPassword}
                            onChange={(value) => setNewPassword(value)}
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
                    </Box>
                    <Box sx={{ mb: 2, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="subtitle1" gutterBottom>{isPaymentPasswordSet ? '确认新支付密码' : '确认支付密码'}</Typography>
                        <ReactCodeInput
                            type="password"
                            fields={6}
                            value={confirmNewPassword}
                            onChange={(value) => setConfirmNewPassword(value)}
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
                    </Box>

                    <Button
                        fullWidth
                        variant="contained"
                        type="submit"
                        disabled={loading}
                        sx={{ mt: 2 }}
                    >
                        {loading ? <CircularProgress size={24} /> : (isPaymentPasswordSet ? '修改密码' : '设置密码')}
                    </Button>
                </form>
            </Box>
        </Container>
    );
}

export default SetPaymentPassword; 