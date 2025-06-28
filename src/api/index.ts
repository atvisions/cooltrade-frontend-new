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
          config.headers.Authorization = token;
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
  marketType: 'crypto' | 'stock' = 'crypto'
): Promise<FormattedTechnicalAnalysisData> => {
  // 新增日志
  console.log('[getTechnicalAnalysis] called with:', { symbol, noCache, marketType, stack: new Error().stack });
  // 更严格的 symbol 校验
  if (!symbol || typeof symbol !== 'string' || !symbol.trim()) {
    console.error('getTechnicalAnalysis: Invalid symbol provided:', { symbol, type: typeof symbol });
    throw new Error('Invalid symbol provided');
  }
  try {
    // Ensure symbol is uppercase
    const normalizedSymbol = symbol.toUpperCase();

    // Format symbol based on market type
    let fullSymbol: string;
    let apiPath: string;

    if (marketType === 'crypto') {
      // Add USDT suffix for crypto if not present
      fullSymbol = normalizedSymbol.endsWith('USDT')
        ? normalizedSymbol
        : `${normalizedSymbol}USDT`;
      apiPath = `/crypto/technical-indicators/${fullSymbol}/`;
    } else {
      // For stocks, use symbol as-is
      fullSymbol = normalizedSymbol;
      apiPath = `/stock/technical-indicators/${fullSymbol}/`;
    }

    // Build request path - use technical-indicators endpoint to read local data
    const path = apiPath

    // Prepare query params
    const params: Record<string, any> = {}

    // Add anti-cache param
    if (noCache) {
      params._t = Date.now()
    }

    console.log(`getTechnicalAnalysis: Reading local report data ${fullSymbol}`)

    // Use proxy in development environment
    const url = isDevelopment()
      ? `/api${path}`
      : `${getBaseUrl()}${path}`;

    // Send request
    const token = localStorage.getItem('token');
    const authHeader = token ? (token.startsWith('Token ') ? token : `Token ${token}`) : '';

    // 请求前日志
    console.log('[getTechnicalAnalysis] sending request', { url, params, headers: { 'Content-Type': 'application/json', 'Authorization': authHeader } });
    const response = await axios.get(url, {
      params,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    })
    // 请求后日志
    console.log('[getTechnicalAnalysis] response:', response);

    // Check response format
    const data = response.data

    if (typeof data === 'object') {
      // Check for special response format
      if ('status' in data) {
        if (data.status === 'not_found') {
          return data as unknown as FormattedTechnicalAnalysisData
        }

        if (data.status === 'success' && 'data' in data) {
          // 格式化并返回数据
          return formatTechnicalAnalysisData(data.data)
        }
      }
    }

    // Assume response is direct technical analysis data, format and return
    return formatTechnicalAnalysisData(data)
  } catch (error: any) {
    // 错误日志
    console.error('[getTechnicalAnalysis] error:', error, { symbol, noCache, stack: new Error().stack });
    // Handle 404 error (token not found)
    if (error.response?.status === 404) {
      // Return a special not_found status instead of throwing error
      return {
        status: 'not_found',
        message: error.response?.data?.message || 'Token data not found',
        needs_refresh: true
      } as unknown as FormattedTechnicalAnalysisData
    }

    // Network error, reformat to more friendly message
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Network connection error, please check your network')
    }

    throw error
  }
}

// Prevent duplicate request mark
let pendingRequests: Record<string, boolean> = {};

// Get latest technical analysis report - refresh or get new token analysis report
export const getLatestTechnicalAnalysis = async (
  symbol: string,
  marketType: 'crypto' | 'stock' = 'crypto'
): Promise<FormattedTechnicalAnalysisData> => {
  let requestPath = '';
  if (!symbol || typeof symbol !== 'string' || !symbol.trim()) {
    console.error('getLatestTechnicalAnalysis: Invalid symbol provided:', { symbol, type: typeof symbol });
    throw new Error('交易对无效，无法刷新报告');
  }
  try {
    // Ensure symbol is uppercase
    const normalizedSymbol = symbol.toUpperCase();

    // Format symbol and path based on market type
    let fullSymbol: string;

    if (marketType === 'crypto') {
      // Add USDT suffix for crypto if not present
      fullSymbol = normalizedSymbol.endsWith('USDT')
        ? normalizedSymbol
        : `${normalizedSymbol}USDT`;
      requestPath = `/crypto/get_report/${fullSymbol}/`;
    } else {
      // For stocks, use symbol as-is
      fullSymbol = normalizedSymbol;
      requestPath = `/stock/get_report/${fullSymbol}/`;
    }

    // Build request path - use get_report endpoint to get/refresh report

    // Prepare query params
    const params: Record<string, any> = {}

    // 只加时间戳防缓存，不再传 force_refresh
    params._t = Date.now()

    console.log(`getLatestTechnicalAnalysis: Get/refresh report ${fullSymbol}`)

    // Create request identifier
    const requestId = `${requestPath}`;

    // Check if same request is in progress
    if (pendingRequests[requestId]) {
      throw new Error('请求正在进行中，请稍后再试');
    }

    // Mark request as in progress
    pendingRequests[requestId] = true;

    try {
      // Use api instance to send request with retry mechanism
      const response = await retryRequest({
        url: requestPath,  // 直接使用相对路径，让 api 实例处理基础 URL
        method: 'GET',
        params,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      // Check response format
      const data = response.data

      // 兼容 data.reports[0] 结构
      let realData = data;
      if (data && Array.isArray(data.reports) && data.reports.length > 0) {
        realData = data.reports[0];
      }

      if (typeof data === 'object') {
        // Check for special response format
        if ('status' in data) {
          if (data.status === 'not_found') {
            return data as unknown as FormattedTechnicalAnalysisData
          }

          if (data.status === 'success' && 'data' in data) {
            // 已经处理过 reports[0]，此处直接返回 realData
            return formatTechnicalAnalysisData(realData)
          }
        }
      }

      // Assume response is direct technical analysis data, format and return
      const result = formatTechnicalAnalysisData(realData);

      console.log(`getLatestTechnicalAnalysis: Successfully got report data ${fullSymbol}`)

      return result;
    } catch (error: any) {
      console.error(`getLatestTechnicalAnalysis: Failed to get report for ${symbol}:`, error)

      // Handle 404 error (token not found)
      if (error.response?.status === 404) {
        // Return a special not_found status instead of throwing error
        return {
          status: 'not_found',
          message: error.response?.data?.message || '未找到交易对数据',
          needs_refresh: true
        } as unknown as FormattedTechnicalAnalysisData
      }

      // Network error, reformat to more friendly message
      if (error.code === 'ERR_NETWORK') {
        throw new Error('网络连接错误，请检查您的网络连接')
      }

      // Timeout error
      if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，服务器响应时间过长，请稍后重试')
      }

      throw error
    }
  } finally {
    // Clear request mark
    if (requestPath) {
      const requestId = `${requestPath}`;
      pendingRequests[requestId] = false;
    }
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
      // 在扩展环境中使用代理请求
      if (isExtension()) {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            type: 'PROXY_API_REQUEST',
            data: {
              url: '/auth/invitation-info/',
              method: 'GET',
              headers: {
                'Authorization': localStorage.getItem('token'),
                'Accept': 'application/json'
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
          return apiResponse as ApiResponse<InvitationInfo>;
        }
        throw new Error('Invalid response format');
      }

      // 非扩展环境使用普通请求
      const response = await api.get('/auth/invitation-info/');
      return response as unknown as ApiResponse<InvitationInfo>;
    } catch (error) {
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
                'Authorization': localStorage.getItem('token'),
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
                'Authorization': localStorage.getItem('token'),
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
      const response = await api.post('/auth/claim-temporary-invitation/', {
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
  searchAssets: async (query: string, marketType?: 'crypto' | 'stock', limit: number = 20): Promise<SearchResponse> => {
    try {
      const params: Record<string, any> = { q: query, limit }
      if (marketType) {
        params.market_type = marketType
      }

      const response = await api.get('/crypto/search/', { params })
      return response as unknown as SearchResponse
    } catch (error) {
      console.error('Search assets error:', error)
      throw error
    }
  },

  // Get popular assets
  getPopularAssets: async (marketType: 'crypto' | 'stock' = 'crypto'): Promise<SearchResponse> => {
    try {
      const response = await api.get('/crypto/popular-assets/', {
        params: { market_type: marketType }
      })
      return response as unknown as SearchResponse
    } catch (error) {
      console.error('Get popular assets error:', error)
      throw error
    }
  }
}

export const favorites = {
  // Get user favorites
  getFavorites: async (): Promise<SearchResponse> => {
    try {
      // 在扩展环境中使用代理请求，类似points功能的实现
      if (isExtension()) {
        console.log('favorites.getFavorites: 在扩展环境中使用代理请求')
        const token = localStorage.getItem('token')
        console.log('favorites.getFavorites: token存在:', !!token)
        
        const response = await new Promise((resolve, reject) => {
          const requestData = {
            type: 'PROXY_API_REQUEST',
            data: {
              url: '/crypto/favorites/',
              method: 'GET',
              headers: {
                'Authorization': token,
                'Accept': 'application/json'
              }
            }
          }
          
          console.log('favorites.getFavorites: 发送请求:', requestData)
          
          chrome.runtime.sendMessage(requestData, (response) => {
            console.log('favorites.getFavorites: 收到响应:', response)
            
            if (chrome.runtime.lastError) {
              console.error('favorites.getFavorites: Chrome runtime错误:', chrome.runtime.lastError.message)
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            
            if (response && response.success) {
              console.log('favorites.getFavorites: 请求成功')
              resolve(response.data);
            } else {
              console.error('favorites.getFavorites: 请求失败:', response?.error || '未知错误')
              reject(new Error(response?.error || '获取收藏列表失败'));
            }
          });
        });
        return response as SearchResponse;
      }

      // 非扩展环境使用普通axios请求
      console.log('favorites.getFavorites: 在非扩展环境中使用axios请求')
      const response = await api.get('/crypto/favorites/')
      return response as unknown as SearchResponse
    } catch (error) {
      console.error('Get favorites error:', error)
      throw error
    }
  },

  // Add to favorites
  addFavorite: async (asset: Asset): Promise<FavoriteResponse> => {
    try {
      // 在扩展环境中使用代理请求，类似points功能的实现
      if (isExtension()) {
        console.log('favorites.addFavorite: 在扩展环境中使用代理请求')
        const token = localStorage.getItem('token')
        console.log('favorites.addFavorite: token存在:', !!token)
        console.log('favorites.addFavorite: 添加资产:', asset)
        
        const response = await new Promise((resolve, reject) => {
          const requestData = {
            type: 'PROXY_API_REQUEST',
            data: {
              url: '/crypto/favorites/',
              method: 'POST',
              headers: {
                'Authorization': token,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: {
                symbol: asset.symbol,
                market_type: asset.market_type,
                name: asset.name,
                exchange: asset.exchange,
                sector: asset.sector
              }
            }
          }
          
          console.log('favorites.addFavorite: 发送请求:', requestData)
          
          chrome.runtime.sendMessage(requestData, (response) => {
            console.log('favorites.addFavorite: 收到响应:', response)
            
            if (chrome.runtime.lastError) {
              console.error('favorites.addFavorite: Chrome runtime错误:', chrome.runtime.lastError.message)
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            
            if (response && response.success) {
              console.log('favorites.addFavorite: 请求成功')
              // 检查响应数据结构，确保返回正确的格式
              if (response.data && (response.data.status === 'success' || response.data.status === 'info')) {
                resolve(response.data);
              } else if (response.data && typeof response.data === 'object') {
                // 如果后端直接返回了成功状态，构造标准响应格式
                resolve({
                  status: response.data.status || 'success',
                  message: response.data.message || 'Asset added to favorites',
                  data: response.data.data || response.data
                });
              } else {
                // 兜底情况，构造成功响应
                resolve({
                  status: 'success',
                  message: 'Asset added to favorites'
                });
              }
            } else {
              console.error('favorites.addFavorite: 请求失败:', response?.error || '未知错误')
              reject(new Error(response?.error || '添加收藏失败'));
            }
          });
        });
        return response as FavoriteResponse;
      }

      // 非扩展环境使用普通axios请求
      console.log('favorites.addFavorite: 在非扩展环境中使用axios请求')
      const response = await api.post('/crypto/favorites/', {
        symbol: asset.symbol,
        market_type: asset.market_type,
        name: asset.name,
        exchange: asset.exchange,
        sector: asset.sector
      })
      return response as unknown as FavoriteResponse
    } catch (error) {
      console.error('Add favorite error:', error)
      throw error
    }
  },

  // Remove from favorites
  removeFavorite: async (symbol: string, marketType: 'crypto' | 'stock'): Promise<FavoriteResponse> => {
    try {
      // 在扩展环境中使用代理请求，类似points功能的实现
      if (isExtension()) {
        console.log('favorites.removeFavorite: 在扩展环境中使用代理请求')
        const token = localStorage.getItem('token')
        console.log('favorites.removeFavorite: token存在:', !!token)
        console.log('favorites.removeFavorite: 移除资产:', { symbol, marketType })
        
        const response = await new Promise((resolve, reject) => {
          const requestData = {
            type: 'PROXY_API_REQUEST',
            data: {
              url: '/crypto/favorites/',
              method: 'DELETE',
              headers: {
                'Authorization': token,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: {
                symbol,
                market_type: marketType
              }
            }
          }
          
          console.log('favorites.removeFavorite: 发送请求:', requestData)
          
          chrome.runtime.sendMessage(requestData, (response) => {
            console.log('favorites.removeFavorite: 收到响应:', response)
            
            if (chrome.runtime.lastError) {
              console.error('favorites.removeFavorite: Chrome runtime错误:', chrome.runtime.lastError.message)
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            
            if (response && response.success) {
              console.log('favorites.removeFavorite: 请求成功')
              // 检查响应数据结构，确保返回正确的格式
              if (response.data && response.data.status === 'success') {
                resolve(response.data);
              } else if (response.data && typeof response.data === 'object') {
                // 如果后端直接返回了成功状态，构造标准响应格式
                resolve({
                  status: 'success',
                  message: response.data.message || 'Asset removed from favorites'
                });
              } else {
                // 兜底情况，构造成功响应
                resolve({
                  status: 'success',
                  message: 'Asset removed from favorites'
                });
              }
            } else if (response && response.status === 404) {
              // 404错误表示收藏不存在，这也算是成功的移除操作
              console.log('favorites.removeFavorite: 收藏不存在，视为成功移除')
              resolve({
                status: 'success',
                message: 'Asset was not in favorites (already removed)'
              });
            } else {
              console.error('favorites.removeFavorite: 请求失败:', response?.error || '未知错误')
              reject(new Error(response?.error || '移除收藏失败'));
            }
          });
        });
        return response as FavoriteResponse;
      }

      // 非扩展环境使用普通axios请求
      console.log('favorites.removeFavorite: 在非扩展环境中使用axios请求')
      const response = await api.delete('/crypto/favorites/', {
        data: {
          symbol,
          market_type: marketType
        }
      })
      return response as unknown as FavoriteResponse
    } catch (error) {
      console.error('Remove favorite error:', error)
      throw error
    }
  },

  // Check favorite status
  checkFavoriteStatus: async (symbol: string, marketType: 'crypto' | 'stock' = 'crypto'): Promise<{
    status: 'success' | 'error'
    data: {
      symbol: string
      market_type: string
      is_favorite: boolean
    }
  }> => {
    try {
      // 在扩展环境中使用代理请求，类似points功能的实现
      if (isExtension()) {
        console.log('favorites.checkFavoriteStatus: 在扩展环境中使用代理请求')
        const token = localStorage.getItem('token')
        console.log('favorites.checkFavoriteStatus: token存在:', !!token)
        console.log('favorites.checkFavoriteStatus: 检查状态:', { symbol, marketType })
        
        const response = await new Promise((resolve, reject) => {
          const requestData = {
            type: 'PROXY_API_REQUEST',
            data: {
              url: `/crypto/favorites/status/${symbol}/?market_type=${marketType}`,
              method: 'GET',
              headers: {
                'Authorization': token,
                'Accept': 'application/json'
              }
            }
          }
          
          console.log('favorites.checkFavoriteStatus: 发送请求:', requestData)
          
          chrome.runtime.sendMessage(requestData, (response) => {
            console.log('favorites.checkFavoriteStatus: 收到响应:', response)
            
            if (chrome.runtime.lastError) {
              console.error('favorites.checkFavoriteStatus: Chrome runtime错误:', chrome.runtime.lastError.message)
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            
            if (response && response.success) {
              console.log('favorites.checkFavoriteStatus: 请求成功')
              // 检查响应数据结构，确保返回正确的格式
              if (response.data && response.data.status === 'success') {
                resolve(response.data);
              } else if (response.data && typeof response.data === 'object') {
                // 如果后端直接返回了数据，构造标准响应格式
                resolve({
                  status: 'success',
                  data: response.data.data || response.data
                });
              } else {
                // 兜底情况，构造失败响应
                resolve({
                  status: 'error',
                  data: {
                    symbol,
                    market_type: marketType,
                    is_favorite: false
                  }
                });
              }
            } else if (response && response.status === 404) {
              // 404错误表示资产不存在或未收藏
              console.log('favorites.checkFavoriteStatus: 资产未收藏')
              resolve({
                status: 'success',
                data: {
                  symbol,
                  market_type: marketType,
                  is_favorite: false
                }
              });
            } else {
              console.error('favorites.checkFavoriteStatus: 请求失败:', response?.error || '未知错误')
              reject(new Error(response?.error || '检查收藏状态失败'));
            }
          });
        });
        return response as any;
      }

      // 非扩展环境使用普通axios请求
      console.log('favorites.checkFavoriteStatus: 在非扩展环境中使用axios请求')
      const response = await api.get(`/crypto/favorites/status/${symbol}/`, {
        params: { market_type: marketType }
      })
      return response as any
    } catch (error) {
      console.error('Check favorite status error:', error)
      throw error
    }
  }
}

export default api