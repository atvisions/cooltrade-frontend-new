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

    // Don't build full URL here, let background.js handle it
    const requestUrl = url || ''

    // Check if force refresh request
    const isForceRefresh = requestUrl.includes('force_refresh=true') ||
                          (params && Object.values(params).some(v => String(v).includes('force_refresh=true')))

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
        // Ensure token format is correct - avoid double prefix
        let cleanToken = token;
        if (token.startsWith('Token ')) {
          cleanToken = token.substring(6); // Remove "Token " prefix
        } else if (token.startsWith('Bearer ')) {
          cleanToken = token.substring(7); // Remove "Bearer " prefix
        }
        updatedHeaders = { ...updatedHeaders, Authorization: `Token ${cleanToken}` };
      } else {
      }
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
      }
    } catch (e) {
    }

    chrome.runtime.sendMessage({
      type: 'PROXY_API_REQUEST',
      data: {
        url: requestUrl,  // Use original URL, let background.js handle baseURL
        method: requestMethod,
        headers: updatedHeaders,  // Use updated headers
        body: data,
        params: params  // Pass params separately for background.js to handle
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

        // For 404 responses, ensure we return the correct status
        if (response.status === 404) {
          // For technical analysis endpoints, return not_found status
          if (config.url && config.url.includes('/technical-indicators/')) {
            processedData = {
              status: 'not_found',
              message: 'Report not found'
            };
          }
        } else if (processedData && typeof processedData === 'object') {
          // Check if response data has the standard format
          if (processedData.status === 'success' || processedData.status === 'error' || processedData.status === 'not_found') {
            processedData = processedData;
          } else {
            // If not standard format, wrap as standard format
            processedData = {
              status: 'success',
              data: processedData
            };
          }
        }

        // Return simplified response object with processed data
        resolve({
          data: processedData,
          status: response.status,
          statusText: response.statusText,
          headers: {},  // Use empty object to avoid undefined
          config: {}
        })
      } catch (error) {
        // If error, return minimal response object
        resolve({
          data: response.data,
          status: response.status || 200,
          statusText: response.statusText || 'OK',
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
