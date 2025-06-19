import axios from 'axios';
import config from '../config';

const baseURL = config.apiBaseUrl;
const baseStaticURL = config.apiBaseUrl;

const api = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// 请求拦截器
api.interceptors.request.use(
    (config) => {
        // --- 添加日志 ---
        const fullUrl = `${config.baseURL}${config.url}`;
        console.log(`[API Request] Sending ${config.method.toUpperCase()} request to: ${fullUrl}`);
        // --- 日志结束 ---
        
        // 确保使用HTTPS
        if (config.url && config.url.startsWith('http://')) {
            config.url = config.url.replace('http://', 'https://');
        }
        
        
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('请求拦截器错误:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    async (error) => {
        console.error('响应错误:', error);
        
        // 检查是否是登录请求
        const isLoginRequest = error.config?.url?.includes('/auth/login');
        
        if (error.response) {
            console.error('错误响应:', {
                status: error.response.status,
                data: JSON.stringify(error.response.data),
                headers: error.response.headers
            });
            
            // 如果是登录请求，直接返回错误响应
            if (isLoginRequest && error.response.status !== 401 && error.response.status !== 403 && error.response.status !== 429) {
                return Promise.reject(error);
            }
            
            // 处理特定状态码的错误信息
            if (error.response.status === 401 || error.response.status === 403 || error.response.status === 429) {
                if (!isLoginRequest && error.response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        } else if (error.request) {
            console.error('网络错误: 没有收到响应');
            console.error('请求配置:', {
                url: error.config.url,
                method: error.config.method,
                baseURL: error.config.baseURL,
                headers: error.config.headers,
                timeout: error.config.timeout
            });
        } else {
            console.error('请求配置错误:', error.message);
        }
        
        return Promise.reject(error);
    }
);

// API 服务
const apiService = {
    // 用户服务
    userService: {
        login: async (credentials) => {
            try {
                const response = await api.post('/auth/login', credentials);
                // DEBUG: 打印从Axios原始请求中收到的响应对象 - 临时日志，请勿用于生产环境！
                // console.log('[DEBUG api.js] Raw Axios Response in userService.login:', response);
                
                // 返回响应数据（拦截器已经解构了 response.data，所以这里直接返回 response）
                return response;
            } catch (error) {
                // 直接重新抛出原始错误，让 AuthContext 和 Login.js 处理
                throw error;
            }
        },
        register: async (userData) => {
            const response = await api.post('/auth/register', userData);
            return response;
        },
        logout: async () => {
            const response = await api.post('/auth/logout', {}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            return response.data;
        },
        getProfile: () => api.get('/user/profile'),
        updateProfile: (data) => api.put('/user/profile', data),
        changePassword: (data) => api.put('/user/password', data),
        getInvitedUsers: () => api.get('/user/invited-users'),
        getUserById: (id) => api.get(`/user/${id}`).then(response => response),
        uploadAvatar: (formData) => api.post('/user/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).then(response => response),
        getMyTransactions: () => {
            // 明确指定不需要分页
            return api.get('/wallet/transactions', { params: { limit: null } }).then(response => response);
        },
    },

    // 帖子服务
    postService: {
        getPosts: (params) => {
            return api.get('/info/list', { params })
                .then(response => {
                    return response;
                })
                .catch(error => {
                    console.error('postService.getPosts - 获取帖子列表失败:', error);
                    throw error;
                });
        },
        getPostDetails: (id) => api.get(`/info/${id}`).then(response => response),
        createPost: (data) => api.post('/info', data).then(response => response),
        updatePost: (id, data) => api.put(`/info/${id}`, data).then(response => response),
        deletePost: (id) => api.delete(`/info/${id}`).then(response => response),
        getMyPosts: () => api.get('/info/my').then(response => response),
        searchPosts: (query) => api.get('/info/search', { params: { query } }).then(response => response),
        purchaseInfo: (id, data) => api.post(`/info/${id}/purchase`, data).then(response => response),
        getPurchasedInfos: () => api.get('/info/purchased').then(response => response),
    },

    // 交易服务
    transactionService: {
        getBalance: () => api.get('/transactions/balance').then(response => response),
        createRecharge: (formData) => api.post('/transactions/recharge', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).then(response => response),
        createWithdraw: (formData) => api.post('/wallet/withdraw', formData, {
            // headers: {
            //     'Content-Type': 'multipart/form-data',
            // },
        }).then(response => response),
        getTransactions: (params) => {
            // 只有在明确传入参数时才添加查询参数
            const config = params ? { params } : {};
            return api.get('/transactions', config).then(response => response);
        },
        getTransactionHistory: () => api.get('/transactions/history').then(response => response),
        getUserTransactions: (userId) => api.get(`/transactions/user/${userId}`).then(response => response),
        getRechargePaths: () => api.get('/recharge-paths/paths').then(response => response),
    },

    // 充值服务
    rechargeService: {
        submitRechargeOrder: (formData) => {
            console.log('准备发送充值请求，FormData内容:', {
                pathId: formData.get('pathId'),
                amount: formData.get('amount'),
                hasProof: formData.has('proof')
            });
            
            return api.post('/recharge', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 60000, // 增加超时时间到60秒
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log('上传进度:', percentCompleted + '%');
                }
            }).then(response => {
                console.log('充值请求成功响应:', response);
                return response;
            }).catch(error => {
                console.error('充值请求失败:', error);
                if (error.response) {
                    console.error('错误响应数据:', error.response.data);
                    console.error('错误状态码:', error.response.status);
                }
                throw error;
            });
        },
    },

    // Customer Service (New/Updated)
    customerService: {
        getConversations: () => api.get('/customer-service/conversations'),
        getMessages: (userId) => api.get(`/customer-service/messages/${userId}`).then(response => response),
        sendMessage: (data) => api.post('/customer-service/messages', data).then(response => response),
        markMessageAsRead: (messageId) => api.put(`/customer-service/messages/${messageId}/read`).then(response => response),
        getUnreadCount: () => api.get('/customer-service/unread-count').then(response => response),
        uploadImage: (file) => {
            const formData = new FormData();
            formData.append('file', file);
            return api.post('/info/upload/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }).then(response => response);
        },
    },

    // Notification Service (New)
    notificationService: {
        getSystemNotifications: (params) => api.get('/notifications/list', { params }).then(response => response),
        // Add other notification related methods here if needed later
    },

    // System Service
    systemService: {
        // 广告设置相关接口
        getAd: () => api.get('/system/ad').then(response => response),
        getAds: () => api.get('/system/ads').then(response => response),

        updateAd: async (settings) => {
            try {
                const response = await fetch('/api/system/ad', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(settings)
                });
                return await response.json();
            } catch (error) {
                console.error('更新广告设置失败:', error);
                throw error;
            }
        },

        // 返利设置相关接口
        getRebate: async () => {
            try {
                const response = await fetch('/api/system/rebate', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                return await response.json();
            } catch (error) {
                console.error('获取返利设置失败:', error);
                throw error;
            }
        },

        updateRebate: async (settings) => {
            try {
                const response = await fetch('/api/system/rebate', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(settings)
                });
                return await response.json();
            } catch (error) {
                console.error('更新返利设置失败:', error);
                throw error;
            }
        }
    },

    // Payment Password Service (New)
    paymentPasswordService: {
        getPaymentPasswordStatus: () => api.get('/user/check-pay-password').then(response => response),
        setPaymentPassword: (data) => api.post('/user/set-pay-password', data).then(response => response),
        modifyPaymentPassword: (data) => api.post('/user/pay-password', data).then(response => response),
        verifyPaymentPassword: (data) => api.post('/user/verify-pay-password', data).then(response => response),
    },
};

export { baseStaticURL, baseURL };
export default apiService;