// Initialize environment variables
let envConfig = {
  baseApiUrl: 'https://www.cooltrade.xyz/api',
  env: 'production',
  token: null
};

// Store current trading symbol information
let currentTradingSymbol = 'BTCUSDT'; // Default value

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === 'RELOAD_RESOURCES') {
    // Reload extension resources
    chrome.runtime.reload()
  } else if (message.type === 'TRADING_PAGE_LOADED') {
    const tabId = sender.tab?.id || null;
    handleTradingPage(message.data, tabId)
    sendResponse({ status: 'success' })
  } else if (message.type === 'GET_RESOURCE_URL') {
    try {
      const url = chrome.runtime.getURL(message.data.resource)
      sendResponse({ status: 'success', url })
    } catch (error) {
      sendResponse({ status: 'error', error: error.message })
    }
  } else if (message.type === 'SET_ENV_CONFIG') {
    // 禁止覆盖 baseApiUrl，始终保持为生产环境
    // envConfig = { ...envConfig, ...message.data };
    sendResponse({ status: 'success' });
  } else if (message.type === 'GET_CURRENT_SYMBOL') {
    // Respond to get current trading symbol request
    sendResponse({ symbol: currentTradingSymbol });
  } else if (message.type === 'MANUAL_SET_SYMBOL') {
    // Manually set trading symbol (for debugging)
    const { symbol } = message.data;
    if (symbol) {
      currentTradingSymbol = symbol;
      // Notify frontend to update (only if popup is open)
      try {
        chrome.runtime.sendMessage({
          type: 'SYMBOL_UPDATED',
          data: { symbol: currentTradingSymbol }
        }, () => {
          // Handle response or ignore if no receiver
          if (chrome.runtime.lastError) {
            // This is normal if popup is not open
          }
        });
      } catch (error) {
      }
    }
    sendResponse({ status: 'success', symbol: currentTradingSymbol });
  } else if (message.type === 'PROXY_API_REQUEST') {
    // Handle API proxy request
    handleApiProxyRequest(message.data, sendResponse)
    return true // Keep connection open, wait for async response
  } else if (message.type === 'getCookie') {
    // Handle get cookie request
    const { url, name } = message.data
    chrome.cookies.get({ url: url, name: name }, (cookie) => {
      if (chrome.runtime.lastError) {
        sendResponse({ cookie: null, error: chrome.runtime.lastError.message })
      } else {
        sendResponse({ cookie: cookie })
      }
    })
    return true // Keep connection open, wait for async response
  } else if (message.type === 'removeCookie') {
    // Handle remove cookie request
    const { url, name } = message.data
    chrome.cookies.remove({ url: url, name: name }, (details) => {
      if (chrome.runtime.lastError) {
        // Cookie removal failed
      }
    })
    return false // No async response needed
  } else if (message.type === 'PROCESS_TRADE_PAGE') {
    // ... existing code ...
  } else if (message.type === 'SEND_UPDATE_MESSAGE') {
    // ... existing code ...
  } else if (message.type === 'PROCESS_TRADE_PAGE_ERROR') {
    // ... existing code ...
  } else if (message.type === 'EXTENSION_INSTALLED') {
    // ... existing code ...
  } else if (message.type === 'EXTENSION_UPDATED') {
    // ... existing code ...
  } else if (message.type === 'API_PROXY_REQUEST') {
    // ... existing code ...
  } else if (message.type === 'SEND_MESSAGE_ERROR') {
    // ... existing code ...
  }
  return true
})

// Request rate limiting configuration
const rateLimits = {
  maxRequests: 10,  // Maximum requests allowed per time window
  timeWindow: 1000, // Time window size (milliseconds)
  requests: new Map() // Record request timestamps
};

// Check request rate limit
function checkRateLimit(tabId) {
  const now = Date.now();
  const requests = rateLimits.requests.get(tabId) || [];

  // Clean up expired request records
  const validRequests = requests.filter(time => now - time < rateLimits.timeWindow);

  if (validRequests.length >= rateLimits.maxRequests) {
    const oldestRequest = validRequests[0];
    const waitTime = (rateLimits.timeWindow - (now - oldestRequest)) / 1000;
    throw new Error(`Too many requests, please wait ${waitTime.toFixed(2)} seconds`);
  }

  // Update request records
  validRequests.push(now);
  rateLimits.requests.set(tabId, validRequests);
}

// Handle trading page
async function handleTradingPage(data, tabId) {
  try {
    const { symbol } = data

    // Update current trading symbol
    if (symbol) {
      let formattedSymbol = symbol;

      // 检查是否是股票符号（常见的美股符号模式）
      const isStockSymbol = /^[A-Z]{1,5}$/.test(symbol) &&
        ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'BABA', 'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL', 'UBER', 'LYFT', 'SNAP', 'TWTR', 'FB', 'GOOG'].includes(symbol);

      // 只对加密货币符号添加USDT后缀，不对股票符号处理
      if (!isStockSymbol && symbol && !symbol.includes('USDT') && !symbol.includes('BTC') && symbol !== 'BTC') {
        formattedSymbol = symbol + 'USDT';
      } else if (isStockSymbol) {
      }

      currentTradingSymbol = formattedSymbol;

      // Notify all open extension pages to update trading symbol
      try {
        chrome.runtime.sendMessage({
          type: 'SYMBOL_UPDATED',
          data: { symbol: currentTradingSymbol }
        }, () => {
          // Handle response or ignore if no receiver
          if (chrome.runtime.lastError) {
            // This is normal if popup is not open
          }
        });
      } catch (error) {
      }
    }

    // Check request rate limit (only when tabId is available)
    if (tabId) {
      checkRateLimit(tabId);

      // Notify content script to update page
      try {
        chrome.tabs.sendMessage(tabId, {
          type: 'PAGE_UPDATED',
          data: { symbol }
        }, (response) => {
          if (chrome.runtime.lastError) {
            return;
          }
        });
      } catch (error) {
        // Failed to send update message
      }
    }

  } catch (error) {
    // If it's a rate limit error, notify frontend (only when tabId is available)
    if (error.message.includes('Too many requests') && tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: 'RATE_LIMIT_ERROR',
        data: { message: error.message }
      });
    }
  }
}

// Check if it's a supported exchange website
function isSupportedExchange(url) {
  const exchanges = [
    'binance.com',
    'okx.com',
    'gate.io',
    'gate.com',
    'kucoin.com',
    'huobi.com',
    'bybit.com',
    'mexc.com',
    'bitget.com',
    'bitfinex.com',
    'kraken.com',
    'htx.com',
    'bitmart.com',
    'coinbase.com',
    'bitstamp.net',
    'poloniex.com',
    'bithumb.com',
    'upbit.com',
    'bitflyer.com',
    'gemini.com',
    'lbank.com',
    'phemex.com'
  ];
  return exchanges.some(exchange => url.includes(exchange));
}

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // No longer setting CSP rules
  } else if (details.reason === 'update') {
    // Clear old cache
    chrome.storage.local.clear()
  }
})

// Handle API proxy request with retry mechanism
async function handleApiProxyRequest(data, sendResponse) {
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const baseApiUrl = 'https://www.cooltrade.xyz/api';
      const { url, method, headers, body, params } = data;

      if (attempt > 1) {
      }

      // Check if it's a force refresh request
      const isForceRefresh = url.includes('force_refresh=true');

      // 强制：params 拼接前先补全 baseApiUrl
      let fullUrl = url;
      // 先补全 baseApiUrl
      if (url.startsWith('/')) {
        fullUrl = baseApiUrl + url;
      } else if (!url.startsWith('http')) {
        fullUrl = baseApiUrl + '/' + url;
      }
      // 再拼 params
      if (params && (method === 'GET' || !method)) {
        const queryString = new URLSearchParams(params).toString();
        if (queryString) {
          fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
        }
      }

    // Build request options
    const options = {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      }
    };

    // Ensure authentication token is properly passed
    if (headers && headers.Authorization) {
      // Ensure token format is correct, add prefix if not starting with "Token " or "Bearer "
      if (headers.Authorization && !headers.Authorization.startsWith('Token ') && !headers.Authorization.startsWith('Bearer ')) {
        options.headers.Authorization = `Token ${headers.Authorization}`;
      } else {
        options.headers.Authorization = headers.Authorization;
      }
    } else {
      // If request doesn't contain authentication token, try to get from environment config
      if (envConfig.token) {
        // Ensure token format is correct
        if (!envConfig.token.startsWith('Token ') && !envConfig.token.startsWith('Bearer ')) {
          options.headers.Authorization = `Token ${envConfig.token}`;
        } else {
          options.headers.Authorization = envConfig.token;
        }
      }
    }

    // Add request body (if any)
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
      options.body = JSON.stringify(body);
    }

    // Set timeout
    const timeout = isForceRefresh ? 120000 : 60000; // 普通请求 60 秒，强制刷新 120 秒

    // Create timeout Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout (${timeout/1000} seconds)`)), timeout);
    });

    // Create fetch Promise with detailed error handling
    // Use built complete URL
    const fetchPromise = fetch(fullUrl, options).catch(error => {
      throw new Error(`Fetch failed: ${error.message}`);
    });

      // Use Promise.race, whoever completes first wins
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      // Get response headers
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Get response body, log original response text before sending back
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }

      // Success - send response and return
      // 对于某些API，404也应该被视为成功的响应
      const isSuccessfulResponse = response.ok ||
        (response.status === 404 && (
          fullUrl.includes('/favorites/') ||
          fullUrl.includes('/technical-indicators/')
        ));

      // 对于技术分析API的404，转换为not_found状态
      if (response.status === 404 && fullUrl.includes('/technical-indicators/')) {
        responseData = {
          status: 'not_found',
          message: 'Technical analysis report not found'
        };
      }

      const finalResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseData,
        success: isSuccessfulResponse
      };

      sendResponse(finalResponse);
      return; // Exit the retry loop on success

    } catch (error) {
      lastError = error;

      // If this is the last attempt, don't wait
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries failed
  sendResponse({
    success: false,
    error: lastError?.message || 'Request failed after retries',
    status: 500
  });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if it's a target website
    try {
      chrome.tabs.sendMessage(tabId, {
        type: 'PAGE_UPDATED',
        data: { url: tab.url }
      }, () => {
        if (chrome.runtime.lastError) {
          // content script may not be loaded yet, this is normal
          return;
        }
      });
    } catch (error) {
      // console.error('Failed to send message:', error);
    }
  }
})