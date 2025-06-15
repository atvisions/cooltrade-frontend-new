// API proxy module for solving CORS issues
import type { AxiosRequestConfig } from 'axios'

/**
 * Check if running in extension environment
 */
export const isExtensionEnvironment = (): boolean => {
  return typeof chrome !== 'undefined' &&
         typeof chrome.runtime !== 'undefined' &&
         typeof chrome.runtime.sendMessage === 'function'
}

/**
 * Proxy API requests via extension background.js
 * @param config Axios request config
 * @returns Promise<AxiosResponse>
 */
export const proxyRequest = async (config: AxiosRequestConfig): Promise<any> => {
  if (!isExtensionEnvironment()) {
    throw new Error('Not running in extension environment, cannot use proxy')
  }

  return new Promise((resolve, reject) => {
    const { url, method, headers, data, params } = config

    // Build full URL with query params
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

    // Check if force refresh request
    const isForceRefresh = fullUrl.includes('force_refresh=true')

    // Set timeout
    let timeoutId: number | null = null
    const timeout = isForceRefresh ? 120000 : 30000 // Longer timeout for force refresh

    timeoutId = window.setTimeout(() => {
      reject(new Error(`Request timed out (${timeout/1000}s)`))
    }, timeout)

    // Ensure auth token is passed
    let updatedHeaders = headers || {};
    if (!updatedHeaders.Authorization) {
      const token = localStorage.getItem('token');
      if (token) {
        updatedHeaders = { ...updatedHeaders, Authorization: token };
      }
    }

    // Send proxy request
    // Ensure method is valid string
    const requestMethod = typeof method === 'string' ? method.toUpperCase() : 'GET';

    chrome.runtime.sendMessage({
      type: 'PROXY_API_REQUEST',
      data: {
        url: fullUrl,  // Use full URL with query params
        method: requestMethod,
        headers: updatedHeaders,  // Use updated headers
        body: data
      }
    }, (response) => {
      // Clear timeout
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }

      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }

      if (!response || !response.success) {
        const error = new Error(response?.error || 'Proxy request failed')
        if (response?.errorDetail) {
          // @ts-ignore
          error.detail = response.errorDetail
        }
        reject(error)
        return
      }

      try {
        // Return simplified response object with necessary data only
        resolve({
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: {},  // Use empty object to avoid undefined
          config: {}
        })
      } catch (error) {
        // If error, return minimal response object
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
