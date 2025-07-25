/// <reference types="chrome"/>

import axios from 'axios'
import type {
  FormattedTechnicalAnalysisData
} from '@/types/technical-analysis'
import { formatTechnicalAnalysisData } from '@/utils/data-formatter'
import { proxyRequest, isExtensionEnvironment as isExtension } from './proxy'
import { getApiBaseUrl } from '@/config/constants'

// Check if it is development environment
const isDevelopment = (): boolean => {
  return import.meta.env.DEV
}

// Get base URL
const getBaseUrl = (): string => {
  // 根据环境自动选择API地址
  return getApiBaseUrl();
}

// 创建axios实例
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 重试配置
const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2秒
const FORCE_REFRESH_TIMEOUT = 120000 // 强制刷新超时时间增加到120秒

// 请求限制配置
const MAX_REQUESTS_PER_MINUTE = 30
const MIN_REQUEST_INTERVAL = 2000 // 最小请求间隔2秒

// 请求队列
let requestQueue: { timestamp: number; count: number }[] = []
let lastRequestTime = 0

// Token validation
const validateToken = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    return false
  }

  // Check token format
  if (!token.startsWith('Token ') && !token.startsWith('Bearer ')) {
    try {
      localStorage.setItem('token', `Token ${token}`)
      return true
    } catch (e) {
      return false
    }
  }

  // Check token length (only for Token format)
  if (token.startsWith('Token ')) {
    const tokenValue = token.replace('Token ', '')
    // Relax token length check, just ensure not empty
    if (tokenValue.length < 5) {
      return false
    }
  }

  return true
}

// Check if it is an auth-related request
const isAuthRequest = (url: string | undefined): boolean => {
  if (!url) return false;
  return url.includes('/auth/login') ||
         url.includes('/auth/register') ||
         url.includes('/auth/send-code') ||
         url.includes('/auth/request-password-reset') ||
         url.includes('/auth/reset-password-with-code');
}

// Check rate limit
const checkRateLimit = async (): Promise<void> => {
  const now = Date.now()
  const oneMinuteAgo = now - 60000

  // Clean up old request records
  requestQueue = requestQueue.filter(item => item.timestamp > oneMinuteAgo)

  // Check if exceeds per minute limit
  if (requestQueue.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldestRequest = requestQueue[0]
    const waitTime = 60000 - (now - oldestRequest.timestamp)
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime))
      await checkRateLimit()
      return
    }
  }

  // Check minimum request interval
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }

  // Update request record
  requestQueue.push({ timestamp: now, count: 1 })
  lastRequestTime = now
}

// Retry request function
const retryRequest = async (config: any, retryCount: number = 0): Promise<any> => {
  try {
    // Validate token
    if (!validateToken()) {
      throw new Error('Token validation failed')
    }

    // Check rate limit
    await checkRateLimit()

    const token = localStorage.getItem('token')
    if (token) {
      // Ensure token format is correct
      if (!token.startsWith('Token ') && !token.startsWith('Bearer ')) {
        config.headers.Authorization = `Token ${token}`
      } else {
        config.headers.Authorization = token
      }
    }

    // Add cache control headers (后端已支持这些头部)
    config.headers['Cache-Control'] = 'no-cache'
    config.headers['Pragma'] = 'no-cache'

    // Use longer timeout for force refresh requests
    if (config.params?.force_refresh) {
      config.timeout = FORCE_REFRESH_TIMEOUT
    }

    // Use proxy in extension environment
    if (isExtension()) {
      return proxyRequest(config);
    }

    // Use configured axios instance (api)
    let response = await api(config);

    return response
  } catch (error: any) {
    // Handle file access error
    if (error.code === 'ERR_FILE_NOT_FOUND') {
      if (isExtension() && error.config?.url?.includes(chrome.runtime.getURL(''))) {
        chrome.runtime.sendMessage({ type: 'RELOAD_RESOURCES' })
        await new Promise(resolve => setTimeout(resolve, 1000))
        return retryRequest(config, retryCount + 1)
      }
    }

    if (error.message === 'Token validation failed') {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Increase retry count for force refresh requests
    const maxRetries = config.params?.force_refresh ? MAX_RETRIES * 2 : MAX_RETRIES

    if (retryCount < maxRetries && (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ERR_FILE_NOT_FOUND' ||
      error.code === 'ECONNABORTED' ||
      error.response?.status === 500
    )) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount)
      await new Promise(resolve => setTimeout(resolve, delay))
      return retryRequest(config, retryCount + 1)
    }

    throw error
  }
}

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      // Ensure request contains auth token
      if (!isAuthRequest(config.url) && !config.headers.Authorization) {
        const token = localStorage.getItem('token');
        if (token) {
          // 确保token格式正确
          if (token.startsWith('Token ') || token.startsWith('Bearer ')) {
            config.headers.Authorization = token;
          } else {
            config.headers.Authorization = `Token ${token}`;
          }
        }
      } else if (config.headers.Authorization) {
      }

      // Only validate token for non-auth requests
      if (!isAuthRequest(config.url) && !validateToken()) {
        return Promise.reject(new Error('Token validation failed'))
      }

      // Only add token for non-auth requests
      if (!isAuthRequest(config.url)) {
        const token = localStorage.getItem('token')
        if (token) {
          // Ensure token format is correct, avoid repeating adding Token prefix
          if (token.startsWith('Token ') || token.startsWith('Bearer ')) {
            config.headers.Authorization = token
          } else {
            config.headers.Authorization = `Token ${token}`
          }
        }
      }

      // Use proxy in extension environment
      if (isExtension()) {
        return proxyRequest(config);
      } else if (isDevelopment()) {
      }

      // Check rate limit
      await checkRateLimit()

      return config
    } catch (error) {
      return Promise.reject(error)
    }
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Check data structure
    if (!response.data || typeof response.data !== 'object') {
      return Promise.reject(new Error('Invalid data format'))
    }

    // Check if response is already in standard format
    if (response.data.status === 'success' || response.data.status === 'error') {
      return response.data
    }

    // Handle Django REST Framework error responses
    if (response.data.detail) {
      return {
        status: 'error',
        message: response.data.detail,
        data: null
      }
    }

    // If not standard format, wrap as standard format
    return {
      status: 'success',
      data: response.data
    }
  },
  async (error) => {
    const originalRequest = error.config

    // Handle token validation failure
    if (error.message === 'Token validation failed') {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Handle network error
    if (error.code === 'ERR_NETWORK') {
      if (!originalRequest._retry) {
        originalRequest._retry = true
        try {
          const response = await retryRequest(originalRequest)
          return response
        } catch (retryError) {
          return Promise.reject(retryError)
        }
      }
    }

    // Handle other errors
    if ((error.code === 'ERR_FILE_NOT_FOUND' || error.response?.status === 500) && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const response = await retryRequest(originalRequest)
        return response
      } catch (retryError) {
        return Promise.reject(retryError)
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

interface LoginResponse {
  status: string;
  message?: string;
  data: {
    token: string;
    user: {
      id: number;
      email: string;
      username: string;
      is_active: boolean;
    };
  } | null;
}
export const auth = {
  sendCode: async (data: { email: string }) => {
    try {
      const url = `${getBaseUrl()}/auth/send-code/`;
      const response = await axios.post(url, {
        email: data.email.trim()
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },
  register: async (data: { email: string; password: string; code: string; invitation_code: string }) => {
    try {
      const url = `${getBaseUrl()}/auth/register/`;
      const response = await axios.post(url, {
        email: data.email.trim(),
        password: data.password.trim(),
        code: data.code.trim(),
        invitation_code: data.invitation_code.trim()
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },
  login: async (data: { email: string; password: string }): Promise<LoginResponse> => {
    try {
      const url = `${getBaseUrl()}/auth/login/`;
      const response = await axios.post(url, {
        email: data.email.trim(),
        password: data.password.trim()
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },
  requestPasswordReset: async (data: { email: string }) => {
    try {
      const response = await api.post('/auth/request-password-reset/', {
        email: data.email.trim()
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  resetPasswordWithCode: async (data: { email: string; code: string; new_password: string; confirm_password: string }) => {
    try {
      const response = await api.post('/auth/reset-password-with-code/', {
        email: data.email.trim(),
        code: data.code.trim(),
        new_password: data.new_password.trim(),
        confirm_password: data.confirm_password.trim()
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  changePassword: async (data: { current_password: string; new_password: string; confirm_password: string }) => {
    try {
      const url = `${getBaseUrl()}/auth/change-password/`;

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not logged in, unable to change password');
      }

      const response = await axios.post(url, {
        current_password: data.current_password.trim(),
        new_password: data.new_password.trim(),
        confirm_password: data.confirm_password.trim()
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// API response common interface
export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
}

// 会员相关接口
export interface MembershipPlan {
  id: number;
  name: string;
  plan_type: 'monthly' | 'yearly';
  price: string;
  duration_days: number;
  is_active: boolean;
}

export interface MembershipOrder {
  id: number;
  order_id: string;
  plan: number;
  plan_name: string;
  plan_type: string;
  amount: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  payment_method: string;
  created_at: string;
  paid_at?: string;
  expires_at?: string;
}

export interface UserMembershipStatus {
  id: number;
  email: string;
  is_premium: boolean;
  premium_expires_at?: string;
  membership_status: 'regular' | 'premium';
  is_premium_active: boolean;
  points: number;
}

export interface PointsTransaction {
  id: number;
  transaction_type: 'earn' | 'spend';
  amount: number;
  reason: 'invitation' | 'premium_analysis' | 'admin_adjust';
  description: string;
  created_at: string;
}

// Technical analysis interface return type
export interface TechnicalAnalysisData {
  trend_analysis: {
    probabilities: {
      up: number;
      sideways: number;
      down: number;
    };
    summary: string;
  };
  indicators_analysis: {
    RSI: {
      value: number;
      analysis: string;
      support_trend: string;
    };
    MACD: {
      value: {
        line: number;
        signal: number;
        histogram: number;
      };
      analysis: string;
      support_trend: string;
    };
    BollingerBands: {
      value: {
        upper: number;
        middle: number;
        lower: number;
      };
      analysis: string;
      support_trend: string;
    };
    BIAS: {
      value: number;
      analysis: string;
      support_trend: string;
    };
    PSY: {
      value: number;
      analysis: string;
      support_trend: string;
    };
    DMI: {
      value: {
        plus_di: number;
        minus_di: number;
        adx: number;
      };
      analysis: string;
      support_trend: string;
    };
    VWAP: {
      value: number;
      analysis: string;
      support_trend: string;
    };
    FundingRate: {
      value: number;
      analysis: string;
      support_trend: string;
    };
    ExchangeNetflow: {
      value: number;
      analysis: string;
      support_trend: string;
    };
    NUPL: {
      value: number;
      analysis: string;
      support_trend: string;
    };
    MayerMultiple: {
      value: number;
      analysis: string;
      support_trend: string;
    };
  };
  trading_advice: {
    action: string;
    reason: string;
    entry_price: number;
    stop_loss: number;
    take_profit: number;
  };
  risk_assessment: {
    level: string;
    score: number;
    details: string[];
  };
  current_price: number;
  last_update_time: string;
}

// Type guard: Check if it is base API response (removed unused function)

// Get current user language
const getCurrentLanguage = (): string => {
  // First get language setting from localStorage
  const storedLanguage = localStorage.getItem('language')
  if (storedLanguage && ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(storedLanguage)) {
    return storedLanguage
  }

  // If not set, try to get from user info
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    try {
      const user = JSON.parse(userInfo)
      if (user.language && ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(user.language)) {
        return user.language
      }
    } catch (e) {
    }
  }

  // Default to English
  return 'en-US'
}

// Get technical analysis data - read locally existing report data
export const getTechnicalAnalysis = async (
  symbol: string,
  noCache: boolean = false,
  marketType: 'crypto' | 'stock' | 'china' = 'crypto'
): Promise<FormattedTechnicalAnalysisData> => {
  try {
    // 构建完整的symbol
    const fullSymbol = symbol.toUpperCase()

    // 构建请求URL
    const endpoint = marketType === 'crypto' ? 'crypto' : marketType === 'china' ? 'china' : 'stock'
    const url = `/${endpoint}/technical-indicators/${fullSymbol}/`

    // 构建请求参数
    const params: any = {}
    if (noCache) {
      params.no_cache = 'true'
    }

    // 验证token
    if (!validateToken()) {
      throw new Error('Token validation failed')
    }

    // 构建请求头
    const token = localStorage.getItem('token')
    const headers: any = {
      'Content-Type': 'application/json'
    }

    // 确保token格式正确 - 避免重复前缀
    if (token) {
      let cleanToken = token;
      if (token.startsWith('Token ')) {
        cleanToken = token.substring(6); // Remove "Token " prefix
      } else if (token.startsWith('Bearer ')) {
        cleanToken = token.substring(7); // Remove "Bearer " prefix
      }
      headers.Authorization = `Token ${cleanToken}`;
    }

    let response: any

    // 检查是否在扩展环境中
    if (isExtension()) {
      const requestData = {
        url: url,
        method: 'GET',
        params: params,
        headers: headers
      }

      response = await proxyRequest(requestData)
    } else {
      // 在非扩展环境中使用axios请求
      response = await api.get(url, { params, headers })
    }

    // 检查响应状态
    if (response && response.data && response.data.status === 'not_found') {
      throw new Error('not_found')
    }

    // 格式化数据
    const formattedData = formatTechnicalAnalysisData(response.data)
    return formattedData
  } catch (error: any) {
    if (error.response?.status === 404 || error.message === 'not_found') {
      throw new Error('not_found')
    }
    throw error
  }
}

// Prevent duplicate request mark
let pendingRequests: Record<string, boolean> = {};

// Get latest technical analysis report - refresh or get new token analysis report
export const getLatestTechnicalAnalysis = async (
  symbol: string,
  marketType: 'crypto' | 'stock' | 'china' = 'crypto'
): Promise<FormattedTechnicalAnalysisData> => {
  try {
    // 构建完整的symbol
    const fullSymbol = symbol.toUpperCase()

    // 构建请求URL
    const endpoint = marketType === 'crypto' ? 'crypto' : marketType === 'china' ? 'china' : 'stock'
    const url = `/${endpoint}/get_report/${fullSymbol}/`

    // 验证token
    if (!validateToken()) {
      throw new Error('Token validation failed')
    }

    // 构建请求头
    const token = localStorage.getItem('token')
    const headers: any = {
      'Content-Type': 'application/json'
    }

    // 确保token格式正确 - 避免重复前缀
    if (token) {
      let cleanToken = token;
      if (token.startsWith('Token ')) {
        cleanToken = token.substring(6); // Remove "Token " prefix
      } else if (token.startsWith('Bearer ')) {
        cleanToken = token.substring(7); // Remove "Bearer " prefix
      }
      headers.Authorization = `Token ${cleanToken}`;
    }

    let response: any

    // 检查是否在扩展环境中
    if (isExtension()) {
      const requestData = {
        url: url,
        method: 'GET',
        headers: headers,
        // A股和股票报告生成需要更长时间，设置更长超时
        timeout: marketType === 'china' || marketType === 'stock' ? 180000 : 60000
      }

      response = await proxyRequest(requestData)
    } else {
      // 在非扩展环境中使用axios请求，A股需要更长超时
      const requestConfig = {
        headers,
        timeout: marketType === 'china' || marketType === 'stock' ? 180000 : 60000
      }
      response = await api.get(url, requestConfig)
    }

    // 检查响应状态
    if (response && response.data && response.data.status === 'not_found') {
      throw new Error('not_found')
    }

    // 格式化数据
    const formattedData = formatTechnicalAnalysisData(response.data)
    return formattedData
  } catch (error: any) {
    if (error.response?.status === 404 || error.message === 'not_found') {
      throw new Error('not_found')
    }
    throw error
  }
}

// Points related interfaces
export interface InvitationInfo {
  points: number;
  invitation_code: string;
  invitation_points_per_user: number;
  invitation_count: number;
  invitation_records: {
    invitee_email: string;
    invitee_username: string;
    points_awarded: number;
    created_at: string;
  }[];
  ranking?: number;
}

// 修改 RankingInfo 接口以匹配实际响应格式
export interface RankingInfo {
  status: 'success';
  ranking: number;
}

// Points related API
export const points = {
  // Get invitation info and points
  getInvitationInfo: async (): Promise<ApiResponse<InvitationInfo>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      if (isExtension()) {
        const response = await proxyRequest({
          url: '/auth/invitation-info/',
          method: 'GET',
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // 统一返回格式处理
        if (response && response.data) {
          // 如果response.data存在，说明是标准格式
          return response.data;
        } else if (response && response.invitation_code) {
          // 如果直接包含invitation_code，说明是直接数据格式，包装成标准格式
          return {
            status: 'success',
            data: response
          } as ApiResponse<InvitationInfo>;
        } else {
          return response;
        }
      } else {
        const response = await api.get('/auth/invitation-info/');

        // 统一返回格式处理
        if (response && response.data) {
          return response.data;
        } else if (response && response.invitation_code) {
          return {
            status: 'success',
            data: response
          } as ApiResponse<InvitationInfo>;
        } else {
          return response;
        }
      }
    } catch (error: any) {
      throw error;
    }
  },

  // Get points ranking
  getRanking: async (): Promise<RankingInfo> => {
    try {
      if (isExtension()) {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            type: 'PROXY_API_REQUEST',
            data: {
              url: '/auth/invitation-info/ranking/',
              method: 'GET',
              headers: {
                'Authorization': (() => {
                  const token = localStorage.getItem('token');
                  if (!token) return null;
                  return token.startsWith('Token ') || token.startsWith('Bearer ') ? token : `Token ${token}`;
                })(),
                'Accept': 'application/json'
              }
            }
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (response.success) {
              resolve((response as any).data);
            } else {
              reject(new Error(response.error || '请求失败'));
            }
          });
        });
        return response as RankingInfo;
      }
      const response = await api.get('/auth/invitation-info/ranking/');
      // 直接返回接口原始数据
      return response as unknown as RankingInfo;
    } catch (error) {
      throw error;
    }
  },

  // Claim temporary invitation
  claimTemporaryInvitation: async (uuid: string): Promise<ApiResponse<null>> => {
    try {
      // 在扩展环境中使用代理请求
      if (isExtension()) {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            type: 'PROXY_API_REQUEST',
            data: {
              url: '/auth/claim-temporary-invitation/',
              method: 'POST',
              headers: {
                'Authorization': (() => {
                  const token = localStorage.getItem('token');
                  if (!token) return null;
                  return token.startsWith('Token ') || token.startsWith('Bearer ') ? token : `Token ${token}`;
                })(),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: {
                temporary_invitation_uuid: uuid
              }
            }
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error(response.error || '请求失败'));
            }
          });
        });

        // 处理代理请求的响应格式
        if (response && (response as any).success && (response as any).data) {
          const apiResponse = (response as any).data;
          return apiResponse as ApiResponse<null>;
        }
        throw new Error('Invalid response format');
      }

      // 非扩展环境使用普通请求
      const fullUrl = `${getBaseUrl()}/auth/claim-temporary-invitation/`
      const response = await axios.post(fullUrl, {
        temporary_invitation_uuid: uuid
      });
      return response as unknown as ApiResponse<null>;
    } catch (error) {
      throw error;
    }
  }
};

// Asset search and favorites interfaces
export interface Asset {
  symbol: string
  name: string
  market_type: 'crypto' | 'stock'
  exchange?: string
  sector?: string
  is_active?: boolean
}

export interface SearchResponse {
  status: 'success' | 'error'
  data: Asset[]
  source?: 'database' | 'external'
  message?: string
}

export interface FavoriteResponse {
  status: 'success' | 'error' | 'info'
  message?: string
  data?: {
    id: number
    symbol: string
    name: string
    market_type: string
    added_at?: string
  }
}

// Search and favorites API
export const search = {
  // Search assets
  searchAssets: async (query: string, marketType: 'crypto' | 'stock' | 'china', limit: number = 10): Promise<SearchResponse> => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token')
      }

      // 根据市场类型构建正确的URL路径
      const endpoint = marketType === 'crypto' ? 'crypto' : marketType === 'china' ? 'china' : 'stock'
      const searchUrl = `/${endpoint}/search/`

      // 检查是否在扩展环境中
      if (isExtension()) {
        const requestData = {
          url: searchUrl,
          method: 'GET',
          params: {
            q: query,  // 后端期望的参数名是 'q' 而不是 'query'
            market_type: marketType,
            limit: limit
          },
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }

        const response = await proxyRequest(requestData)
        return response.data
      } else {
        // 在非扩展环境中使用axios请求
        const response = await api.get(searchUrl, {
          params: {
            q: query,  // 后端期望的参数名是 'q' 而不是 'query'
            market_type: marketType,
            limit: limit
          }
        })
        return response as any
      }
    } catch (error: any) {
      throw error
    }
  },

  // Get popular assets
  getPopularAssets: async (marketType: 'crypto' | 'stock' | 'china'): Promise<SearchResponse> => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token')
      }

      // 根据市场类型构建正确的URL路径
      const endpoint = marketType === 'crypto' ? 'crypto' : marketType === 'china' ? 'china' : 'stock'
      const popularUrl = `/${endpoint}/popular-assets/`

      // 检查是否在扩展环境中
      if (isExtension()) {
        const requestData = {
          url: popularUrl,
          method: 'GET',
          params: {
            market_type: marketType
          },
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }

        const response = await proxyRequest(requestData)
        return response.data
      } else {
        // 在非扩展环境中使用axios请求
        const response = await api.get(popularUrl, {
          params: {
            market_type: marketType
          }
        })
        return response as any
      }
    } catch (error: any) {
      throw error
    }
  }
}

export const favorites = {
  // Get user favorites
  getFavorites: async (): Promise<FavoriteResponse> => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token')
      }

      // 检查是否在扩展环境中
      if (isExtension()) {
        // 确保token格式正确
        const authToken = token.startsWith('Token ') || token.startsWith('Bearer ') ? token : `Token ${token}`

        const requestData = {
          url: '/crypto/favorites/',
          method: 'GET',
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        }

        const response = await proxyRequest(requestData)
        return response.data
      } else {
        // 在非扩展环境中使用axios请求
        const response = await api.get('/crypto/favorites/')
        return response as any
      }
    } catch (error: any) {
      throw error
    }
  },

  // Add to favorites
  addFavorite: async (asset: Asset): Promise<FavoriteResponse> => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token')
      }

      // 检查是否在扩展环境中
      if (isExtension()) {
        // 确保token格式正确
        const authToken = token.startsWith('Token ') || token.startsWith('Bearer ') ? token : `Token ${token}`

        const requestData = {
          url: '/crypto/favorites/',
          method: 'POST',
          data: asset,
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        }

        const response = await proxyRequest(requestData)
        // 确保返回标准格式的响应
        if (response && response.data) {
          return response.data
        }
        return response
      } else {
        // 在非扩展环境中使用axios请求
        const response = await api.post('/crypto/favorites/', asset)
        return response as any
      }
    } catch (error: any) {
      throw error
    }
  },

  // Remove from favorites
  removeFavorite: async (symbol: string, marketType: 'crypto' | 'stock' | 'china'): Promise<FavoriteResponse> => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token')
      }

      // 检查是否在扩展环境中
      if (isExtension()) {
        // 确保token格式正确
        const authToken = token.startsWith('Token ') || token.startsWith('Bearer ') ? token : `Token ${token}`

        const requestData = {
          url: '/crypto/favorites/',
          method: 'DELETE',
          data: {
            symbol: symbol,
            market_type: marketType
          },
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        }

        const response = await proxyRequest(requestData)
        // 确保返回标准格式的响应
        if (response && response.data) {
          return response.data
        }
        return response
      } else {
        // 在非扩展环境中使用axios请求
        const response = await api.delete('/crypto/favorites/', {
          data: {
            symbol: symbol,
            market_type: marketType
          }
        })
        return response as any
      }
    } catch (error: any) {
      // 如果是404错误，说明收藏不存在，视为成功移除
      // 处理不同环境下的错误结构
      const status = error.response?.status || error.status
      if (status === 404 || error.message?.includes('404') || error.message?.includes('Not Found')) {
        return {
          status: 'success',
          message: 'Favorite not found, considered as removed'
        }
      }
      throw error
    }
  },

  // Check favorite status
  checkFavoriteStatus: async (symbol: string, marketType: 'crypto' | 'stock' | 'china'): Promise<{ status: 'success'; data: { symbol: string; market_type: string; is_favorite: boolean } }> => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token')
      }

      // 检查是否在扩展环境中
      if (isExtension()) {
        // 确保token格式正确
        const authToken = token.startsWith('Token ') || token.startsWith('Bearer ') ? token : `Token ${token}`

        const requestData = {
          url: `/crypto/favorites/status/${symbol}/`,
          method: 'GET',
          params: {
            market_type: marketType
          },
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        }

        const response = await proxyRequest(requestData)
        // 确保返回标准格式的响应
        if (response && response.data) {
          return response.data
        }
        return response
      } else {
        // 在非扩展环境中使用axios请求
        const response = await api.get(`/crypto/favorites/status/${symbol}/`, {
          params: {
            market_type: marketType
          }
        })
        return response as any
      }
    } catch (error: any) {
      // 如果是404错误，说明资产未收藏
      if (error.response?.status === 404) {
        return {
          status: 'success',
          data: {
            symbol: symbol,
            market_type: marketType,
            is_favorite: false
          }
        }
      }
      throw error
    }
  }
}

// 新闻API - 通过后端代理调用，支持按符号获取新闻
export const fetchNews = async (symbol: string, limit: number = 10, skipCache: boolean = false, marketType: 'crypto' | 'stock' | 'china' = 'crypto') => {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('No authentication token')
  }

  // 确保token格式正确 - 避免重复前缀
  let cleanToken = token;
  if (token.startsWith('Token ')) {
    cleanToken = token.substring(6); // Remove "Token " prefix
  } else if (token.startsWith('Bearer ')) {
    cleanToken = token.substring(7); // Remove "Bearer " prefix
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Token ${cleanToken}`
  }

  try {
    let response;

    // 根据市场类型构建正确的URL路径
    const endpoint = marketType === 'crypto' ? 'crypto' : marketType === 'china' ? 'china' : 'stock'

    if (isExtension()) {
      // 在扩展环境中使用代理
      const url = skipCache
        ? `/${endpoint}/news/${encodeURIComponent(symbol)}/?limit=${limit}&skip_cache=true`
        : `/${endpoint}/news/${encodeURIComponent(symbol)}/?limit=${limit}`
      response = await proxyRequest({
        url,
        method: 'GET',
        headers
      })
    } else {
      // 在localhost环境中直接调用
      const params: any = { limit }
      if (skipCache) {
        params.skip_cache = 'true'
      }
      response = await axios.get(`${getBaseUrl()}/${endpoint}/news/${encodeURIComponent(symbol)}/`, {
        params,
        headers
      })
    }

    if (response?.status === 'success') {
      return response.data || []
    } else {
      throw new Error(response?.message || 'Failed to fetch news')
    }
  } catch (error: any) {
    console.error('News API error:', error)
    throw error
  }
}

// 会员相关API
export const membership = {
  // 获取会员套餐列表
  getPlans: async (): Promise<ApiResponse<MembershipPlan[]>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      if (isExtension()) {
        const response = await proxyRequest({
          url: '/auth/membership/plans/',
          method: 'GET',
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // 代理响应已经包含了处理后的数据，直接返回response.data
        return response.data || response;
      } else {
        const response = await api.get('/auth/membership/plans/');
        return response as any;
      }
    } catch (error: any) {
      throw error;
    }
  },

  // 创建会员订单
  createOrder: async (data: { plan_id: string, payment_method: string }): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      if (isExtension()) {
        const response = await proxyRequest({
          url: '/auth/membership/orders/create/',
          method: 'POST',
          data,
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // 代理响应已经包含了处理后的数据，直接返回response.data
        return response.data || response;
      } else {
        const response = await api.post('/auth/membership/orders/create/', data);
        return response as any;
      }
    } catch (error: any) {
      throw error;
    }
  },

  // 获取用户会员状态
  getStatus: async (): Promise<ApiResponse<UserMembershipStatus>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      if (isExtension()) {
        const response = await proxyRequest({
          url: '/auth/membership/status/',
          method: 'GET',
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // 代理响应已经包含了处理后的数据，直接返回response.data
        return response.data;
      } else {
        const response = await api.get('/auth/membership/status/');
        return response.data;
      }
    } catch (error: any) {
      throw error;
    }
  },

  // 获取用户订单列表
  getOrders: async (): Promise<ApiResponse<MembershipOrder[]>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      if (isExtension()) {
        const response = await proxyRequest({
          url: '/auth/membership/orders/',
          method: 'GET',
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // 代理响应已经包含了处理后的数据，直接返回response.data
        return response.data || response;
      } else {
        const response = await api.get('/auth/membership/orders/');
        return response as any;
      }
    } catch (error: any) {
      throw error;
    }
  },

  // 检查订单支付状态
  checkOrderStatus: async (orderId: string): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      if (isExtension()) {
        const response = await proxyRequest({
          url: `/auth/membership/orders/${orderId}/status/`,
          method: 'GET',
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // 代理响应已经包含了处理后的数据，直接返回response.data
        return response.data || response;
      } else {
        const response = await api.get(`/auth/membership/orders/${orderId}/status/`);
        return response.data;
      }
    } catch (error: any) {
      throw error;
    }
  },

  // 重新支付订单
  repayOrder: async (orderId: string): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      if (isExtension()) {
        const response = await proxyRequest({
          url: `/auth/membership/orders/${orderId}/repay/`,
          method: 'POST',
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // 代理响应已经包含了处理后的数据，直接返回response.data
        return response.data || response;
      } else {
        const response = await api.post(`/auth/membership/orders/${orderId}/repay/`);
        return response.data;
      }
    } catch (error: any) {
      throw error;
    }
  },

  // 获取支付二维码
  getPaymentQRCode: async (orderId: string): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      if (isExtension()) {
        const response = await proxyRequest({
          url: `/auth/membership/orders/${orderId}/qrcode/`,
          method: 'GET',
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        return response.data || response;
      } else {
        const response = await api.get(`/auth/membership/orders/${orderId}/qrcode/`);
        return response as any;
      }
    } catch (error: any) {
      throw error;
    }
  },

  // 检查支付状态
  checkPaymentStatus: async (orderId: string): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      if (isExtension()) {
        const response = await proxyRequest({
          url: `/auth/membership/orders/${orderId}/payment-status/`,
          method: 'GET',
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        return response.data || response;
      } else {
        const response = await api.get(`/auth/membership/orders/${orderId}/payment-status/`);
        return response as any;
      }
    } catch (error: any) {
      throw error;
    }
  },

  // 取消订单
  cancelOrder: async (orderId: string): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      if (isExtension()) {
        const response = await proxyRequest({
          url: `/auth/membership/orders/${orderId}/cancel/`,
          method: 'POST',
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        return response.data || response;
      } else {
        const response = await api.post(`/auth/membership/orders/${orderId}/cancel/`);
        return response as any;
      }
    } catch (error: any) {
      throw error;
    }
  }
};

// 积分相关API
export const pointsApi = {
  // 消费积分查看高级分析
  spendPoints: async (): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      if (isExtension()) {
        const response = await proxyRequest({
          url: '/auth/points/spend/',
          method: 'POST',
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // 代理响应已经包含了处理后的数据，直接返回response.data
        return response.data || response;
      } else {
        const response = await api.post('/auth/points/spend/');
        return response.data || response;
      }
    } catch (error: any) {
      throw error;
    }
  },

  // 消费积分保存图片
  spendPointsForImage: async (): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      if (isExtension()) {
        const response = await proxyRequest({
          url: '/auth/points/spend-for-image/',
          method: 'POST',
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // 代理响应已经包含了处理后的数据，直接返回response.data
        return response.data || response;
      } else {
        const response = await api.post('/auth/points/spend-for-image/');
        return response.data || response;
      }
    } catch (error: any) {
      throw error;
    }
  },

  // 检查高级分析访问权限
  checkPremiumAccess: async (): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      if (isExtension()) {
        const response = await proxyRequest({
          url: '/auth/points/check-access/',
          method: 'GET',
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // 代理响应已经包含了处理后的数据，直接返回response.data
        return response.data || response;
      } else {
        const response = await api.get('/auth/points/check-access/');
        return response.data || response;
      }
    } catch (error: any) {
      throw error;
    }
  },

  // 获取积分配置
  getPointsConfig: async (): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      if (isExtension()) {
        const response = await proxyRequest({
          url: '/auth/points/config/',
          method: 'GET',
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // 代理响应已经包含了处理后的数据，直接返回response.data
        return response.data || response;
      } else {
        const response = await api.get('/auth/points/config/');
        return response.data || response;
      }
    } catch (error: any) {
      throw error;
    }
  },

  // 获取积分交易历史
  getTransactions: async (): Promise<ApiResponse<PointsTransaction[]>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      if (isExtension()) {
        const response = await proxyRequest({
          url: '/auth/points/transactions/',
          method: 'GET',
          headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('插件环境下交易记录原始响应:', response);
        console.log('响应数据类型:', typeof response);
        console.log('响应数据结构:', response ? Object.keys(response) : 'null');

        // 处理插件环境下的响应格式
        // proxyRequest 返回的格式是 { data: actualData, status: httpStatus, ... }
        if (response && response.data) {
          console.log('response.data:', response.data);
          console.log('response.data 类型:', typeof response.data);

          // 检查是否是标准格式 {status: 'success', data: [...]}
          if (response.data.status === 'success' && response.data.data) {
            console.log('检测到标准格式，数据:', response.data.data);
            return response.data as ApiResponse<PointsTransaction[]>;
          }
          // 检查是否直接是数组格式
          else if (Array.isArray(response.data)) {
            console.log('检测到数组格式，长度:', response.data.length);
            return {
              status: 'success',
              data: response.data
            } as ApiResponse<PointsTransaction[]>;
          }
          // 其他格式直接返回
          else {
            console.log('使用其他格式');
            return response.data;
          }
        } else if (Array.isArray(response)) {
          // 如果response直接是数组，包装成标准格式
          console.log('response直接是数组，长度:', response.length);
          return {
            status: 'success',
            data: response
          } as ApiResponse<PointsTransaction[]>;
        } else {
          console.log('使用默认空数组');
          return response || { status: 'success', data: [] };
        }
      } else {
        const response = await api.get('/auth/points/transactions/');

        // 统一返回格式处理
        if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        } else if (Array.isArray(response)) {
          return {
            status: 'success',
            data: response
          } as ApiResponse<PointsTransaction[]>;
        } else {
          return response;
        }
      }
    } catch (error: any) {
      throw error;
    }
  }
};

export default api