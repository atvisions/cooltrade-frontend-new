// API proxy module for solving CORS issues
import type { AxiosRequestConfig } from 'axios'

/**
 * Check if running in extension environment (popup or extension page)
 */
export const isExtensionEnvironment = (): boolean => {
  // Check if we're in a Chrome extension context
  if (typeof chrome === 'undefined' ||
      typeof chrome.runtime === 'undefined' ||
      typeof chrome.runtime.sendMessage !== 'function') {
    return false
  }

  // Check if we're in an extension page (popup, options, etc.)
  // Extension pages have chrome-extension:// protocol
  const isExtensionPage = window.location.protocol === 'chrome-extension:' ||
                         window.location.protocol === 'moz-extension:' ||
                         window.location.protocol === 'extension:'

  // Check if we have extension ID available (indicates we're in extension context)
  let hasExtensionId = false
  try {
    hasExtensionId = !!chrome.runtime.id
  } catch (e) {
    // chrome.runtime.id might not be accessible in some contexts
  }

  return isExtensionPage || hasExtensionId
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
        // Ensure token format is correct
        if (token.startsWith('Token ') || token.startsWith('Bearer ')) {
          updatedHeaders = { ...updatedHeaders, Authorization: token };
        } else {
          updatedHeaders = { ...updatedHeaders, Authorization: `Token ${token}` };
        }
        console.log('Proxy: Added token to headers:', token.substring(0, 20) + '...');
      } else {
        console.warn('Proxy: No token found in localStorage');
      }
    } else {
      console.log('Proxy: Using existing Authorization header:', updatedHeaders.Authorization.substring(0, 20) + '...');
    }

    // Send proxy request
    // Ensure method is valid string
    const requestMethod = typeof method === 'string' ? method.toUpperCase() : 'GET';

    // Check if chrome extension API is available
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
      reject(new Error('Chrome extension API not available. Please run in Chrome extension environment.'))
      return
    }

    // Additional check for runtime.id (may not be available in all contexts)
    try {
      if (!chrome.runtime.id) {
        console.warn('Chrome runtime.id not available, but proceeding with request')
      }
    } catch (e) {
      console.warn('Cannot access chrome.runtime.id, but proceeding with request')
    }

    console.log('Proxy request details:', {
      url: fullUrl,
      method: requestMethod,
      hasAuth: !!updatedHeaders.Authorization,
      authPrefix: updatedHeaders.Authorization ? updatedHeaders.Authorization.substring(0, 10) + '...' : 'none'
    });

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
        // Process response data similar to axios response interceptor
        let processedData = response.data;

        // Check if response data has the standard format
        if (processedData && typeof processedData === 'object') {
          // If response is already in standard format, use it directly
          if (processedData.status === 'success' || processedData.status === 'error') {
            processedData = processedData;
          } else {
            // If not standard format, wrap as standard format
            processedData = {
              status: 'success',
              data: processedData
            };
          }
        }

        console.log('Proxy response processed data:', processedData);

        // Return simplified response object with processed data
        resolve({
          data: processedData,
          status: response.status,
          statusText: response.statusText,
          headers: {},  // Use empty object to avoid undefined
          config: {}
        })
      } catch (error) {
        console.error('Proxy response processing error:', error);
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
