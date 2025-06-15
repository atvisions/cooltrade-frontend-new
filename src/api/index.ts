/// <reference types="chrome"/>

import axios from 'axios'
import type {
  FormattedTechnicalAnalysisData
} from '@/types/technical-analysis'
import { formatTechnicalAnalysisData } from '@/utils/data-formatter'
import { proxyRequest, isExtensionEnvironment as isExtension } from './proxy'

// Check if it is development environment
const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development'
}

// Get base URL
const getBaseUrl = (): string => {
  if (isExtension()) {
    return 'https://www.cooltrade.xyz/api'; // Use production server in extension environment
  }
  // Use proxy in development environment
  if (isDevelopment()) {
    return '/api'
  }
  // Use production server in production environment
  return 'https://www.cooltrade.xyz/api'
}

// 创建axios实例
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 重试配置
const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2秒
const FORCE_REFRESH_TIMEOUT = 60000 // 强制刷新超时时间60秒

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

    // Add cache control headers
    config.headers['Cache-Control'] = 'no-cache'
    config.headers['Pragma'] = 'no-cache'

    // Use longer timeout for force refresh requests
    if (config.params?.force_refresh) {
      config.timeout = FORCE_REFRESH_TIMEOUT
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
  noCache: boolean = false
): Promise<FormattedTechnicalAnalysisData> => {
  try {
    // Validate symbol parameter
    if (!symbol || typeof symbol !== 'string') {
      console.error('getTechnicalAnalysis: Invalid symbol provided:', { symbol, type: typeof symbol });
      throw new Error('Invalid symbol provided');
    }

    // Ensure symbol is uppercase
    const normalizedSymbol = symbol.toUpperCase();

    // Add USDT suffix if not present
    const fullSymbol = normalizedSymbol.endsWith('USDT')
      ? normalizedSymbol
      : `${normalizedSymbol}USDT`;

    // Build request path - use technical-indicators endpoint to read local data
    const path = `/crypto/technical-indicators/${fullSymbol}/`

    // Prepare query params
    const params: Record<string, any> = {}

    // Add language param
    const currentLanguage = getCurrentLanguage()
    params.language = currentLanguage
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

    const response = await axios.get(url, {
      params,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    })

    // Check response format
    const data = response.data

    if (typeof data === 'object') {
      // Check for special response format
      if ('status' in data) {
        if (data.status === 'not_found') {
          return data as unknown as FormattedTechnicalAnalysisData
        }

        if (data.status === 'success' && 'data' in data) {
          return data.data
        }
      }
    }

    // Assume response is direct technical analysis data, return as is
    return data
  } catch (error: any) {
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
  forceRefresh: boolean = true
): Promise<FormattedTechnicalAnalysisData> => {
  // Define at function top for access in try/catch
  let requestPath = '';
  let requestLanguage = '';

  try {
    // Validate symbol parameter
    if (!symbol || typeof symbol !== 'string') {
      console.error('getLatestTechnicalAnalysis: Invalid symbol provided:', { symbol, type: typeof symbol });
      throw new Error('Invalid symbol provided');
    }

    // Ensure symbol is uppercase
    const normalizedSymbol = symbol.toUpperCase();

    // Add USDT suffix if not present
    const fullSymbol = normalizedSymbol.endsWith('USDT')
      ? normalizedSymbol
      : `${normalizedSymbol}USDT`;

    // Build request path - use get_report endpoint to get/refresh report
    requestPath = `/crypto/get_report/${fullSymbol}/`

    // Prepare query params
    const params: Record<string, any> = {}

    // Add language param
    requestLanguage = getCurrentLanguage()
    params.language = requestLanguage

    console.log(`getLatestTechnicalAnalysis: Current language set to ${requestLanguage}`)

    // Default force refresh, ensure latest data
    if (forceRefresh) {
      params.force_refresh = 'true'
    }

    // Add timestamp to prevent caching
    params._t = Date.now()

    console.log(`getLatestTechnicalAnalysis: Get/refresh report ${fullSymbol}, forceRefresh: ${forceRefresh}`)

    // Create request identifier
    const requestId = `${requestPath}?language=${requestLanguage}&force_refresh=${forceRefresh}`;

    // Check if same request is in progress
    if (pendingRequests[requestId]) {
      throw new Error('Request is already in progress, please try again later');
    }

    // Mark request as in progress
    pendingRequests[requestId] = true;

    // Use api instance to send request
    const response = await api.get(requestPath, {
      params,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

    // Check response format
    const data = response.data

    if (typeof data === 'object') {
      // Check for special response format
      if ('status' in data) {
        if (data.status === 'not_found') {
          return data as unknown as FormattedTechnicalAnalysisData
        }

        if (data.status === 'success' && 'data' in data) {
          return formatTechnicalAnalysisData(data.data)
        }
      }
    }

    // Assume response is direct technical analysis data, format and return
    const result = formatTechnicalAnalysisData(data);

    console.log(`getLatestTechnicalAnalysis: Successfully got report data ${fullSymbol}`)

    return result;
  } catch (error: any) {
    console.error(`getLatestTechnicalAnalysis: Failed to get report for ${symbol}:`, error)

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
  } finally {
    // Clear request mark
    if (requestPath && requestLanguage) {
      const requestId = `${requestPath}?language=${requestLanguage}&force_refresh=${forceRefresh}`;
      pendingRequests[requestId] = false;
    }
  }
}

export default api