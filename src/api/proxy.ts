// API代理模块，用于解决CORS问题
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * 检查是否在扩展环境中
 */
export const isExtensionEnvironment = (): boolean => {
  return typeof chrome !== 'undefined' &&
         typeof chrome.runtime !== 'undefined' &&
         typeof chrome.runtime.sendMessage === 'function'
}

/**
 * 通过扩展的background.js代理API请求
 * @param config Axios请求配置
 * @returns Promise<AxiosResponse>
 */
export const proxyRequest = async (config: AxiosRequestConfig): Promise<any> => {
  if (!isExtensionEnvironment()) {
    throw new Error('不在扩展环境中，无法使用代理')
  }

  return new Promise((resolve, reject) => {
    const { url, method, headers, data, params } = config

    // 构建完整的URL，包含查询参数
    let fullUrl = url || ''
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString
      }
    }

    // 检查是否是强制刷新请求
    const isForceRefresh = fullUrl.includes('force_refresh=true')

    // 设置超时处理
    let timeoutId: number | null = null
    const timeout = isForceRefresh ? 120000 : 30000 // 强制刷新使用更长的超时时间

    timeoutId = window.setTimeout(() => {
      reject(new Error(`请求超时 (${timeout/1000}秒)`))
    }, timeout)

    // 确保认证令牌被正确传递
    let updatedHeaders = headers || {};
    if (!updatedHeaders.Authorization) {
      const token = localStorage.getItem('token');
      if (token) {
        // 确保 token 格式正确
        if (token.startsWith('Token ') || token.startsWith('Bearer ')) {
          updatedHeaders = { ...updatedHeaders, Authorization: token };
        } else {
          updatedHeaders = { ...updatedHeaders, Authorization: `Token ${token}` };
        }
        console.log('Proxy: 添加认证令牌到请求头');
      } else {
        console.warn('Proxy: localStorage 中没有找到 token');
      }
    } else {
      console.log('Proxy: 请求头中已包含认证令牌');
    }

    // 发送代理请求
    // 确保 method 是有效的字符串
    const requestMethod = typeof method === 'string' ? method.toUpperCase() : 'GET';

    chrome.runtime.sendMessage({
      type: 'PROXY_API_REQUEST',
      data: {
        url: fullUrl,  // 使用包含查询参数的完整URL
        method: requestMethod,
        headers: updatedHeaders,  // 使用更新后的 headers
        body: data
      }
    }, (response) => {
      // 清除超时计时器
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }

      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }

      if (!response || !response.success) {
        const error = new Error(response?.error || '请求失败')
        if (response?.errorDetail) {
          // @ts-ignore
          error.detail = response.errorDetail
        }
        reject(error)
        return
      }


      try {
        // 直接返回一个简化的响应对象，只包含必要的数据
        // 避免尝试构造完整的Axios响应对象，这可能会导致错误
        resolve({
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: {},  // 使用空对象避免undefined
          config: {}    // 使用空对象避免undefined
        })
      } catch (error) {
        // 如果出错，返回一个最小化的响应对象
        resolve({
          data: response.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {}
        })
      }
    })
  })
}

export default {
  proxyRequest,
  isExtensionEnvironment
}
