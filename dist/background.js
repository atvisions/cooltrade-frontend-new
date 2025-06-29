// Initialize environment variables
let envConfig = {
  baseApiUrl: 'http://127.0.0.1:8000/api', // 本地测试服务器地址
  env: 'development',
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
    console.log('Background script handling TRADING_PAGE_LOADED message:', message.data);
    const tabId = sender.tab?.id || null;
    console.log('Sender tab ID:', tabId);
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
    // Set environment configuration
    envConfig = { ...envConfig, ...message.data };
    sendResponse({ status: 'success' });
  } else if (message.type === 'GET_CURRENT_SYMBOL') {
    // Respond to get current trading symbol request
    console.log('Background script responding to GET_CURRENT_SYMBOL request:', currentTradingSymbol);
    sendResponse({ symbol: currentTradingSymbol });
  } else if (message.type === 'MANUAL_SET_SYMBOL') {
    // Manually set trading symbol (for debugging)
    const { symbol } = message.data;
    if (symbol) {
      console.log('Background script manually setting trading symbol:', symbol);
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
            console.log('No popup to receive SYMBOL_UPDATED message');
          }
        });
      } catch (error) {
        console.error('Failed to send SYMBOL_UPDATED message:', error);
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
    console.log(`Background script handling trading page: ${symbol}`);

    // Update current trading symbol
    if (symbol) {
      let formattedSymbol = symbol;

      // 检查是否是股票符号（常见的美股符号模式）
      const isStockSymbol = /^[A-Z]{1,5}$/.test(symbol) &&
        ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'BABA', 'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL', 'UBER', 'LYFT', 'SNAP', 'TWTR', 'FB', 'GOOG'].includes(symbol);

      // 只对加密货币符号添加USDT后缀，不对股票符号处理
      if (!isStockSymbol && symbol && !symbol.includes('USDT') && !symbol.includes('BTC') && symbol !== 'BTC') {
        formattedSymbol = symbol + 'USDT';
        console.log('Background script formatting crypto symbol:', symbol, '->', formattedSymbol);
      } else if (isStockSymbol) {
        console.log('Background script detected stock symbol, keeping as-is:', symbol);
      }

      currentTradingSymbol = formattedSymbol;
      console.log('Background script updating currentTradingSymbol:', currentTradingSymbol);

      // Notify all open extension pages to update trading symbol
      try {
        chrome.runtime.sendMessage({
          type: 'SYMBOL_UPDATED',
          data: { symbol: currentTradingSymbol }
        }, () => {
          // Handle response or ignore if no receiver
          if (chrome.runtime.lastError) {
            // This is normal if popup is not open
            console.log('No popup to receive SYMBOL_UPDATED message');
          } else {
            console.log('Background script sending SYMBOL_UPDATED message:', currentTradingSymbol);
          }
        });
      } catch (error) {
        console.error('Background script failed to send SYMBOL_UPDATED message:', error);
      }
    } else {
      console.log('Background script received empty trading symbol info');
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
    // console.error('Failed to handle trading page:', error)
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
    // console.log('Extension installed')
    // No longer setting CSP rules
  } else if (details.reason === 'update') {
    // console.log('Extension updated')
    // Clear old cache
    chrome.storage.local.clear()
  }
})

// Handle API proxy request with retry mechanism
async function handleApiProxyRequest(data, sendResponse) {
  const maxRetries = 3;
  let lastError = null;

  console.log('Background script: 开始处理API代理请求:', {
    url: data.url,
    method: data.method,
    hasHeaders: !!data.headers,
    hasBody: !!data.body
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const baseApiUrl = envConfig.baseApiUrl || '/api';
      const { url, method, headers, body } = data;

      if (attempt > 1) {
        console.log(`Background script API request retry attempt ${attempt}/${maxRetries} for URL: ${url}`);
      }

      // Check if it's a force refresh request
      const isForceRefresh = url.includes('force_refresh=true');

      // Build complete URL
      let fullUrl = url;

      // If it's a relative path, add base URL
      if (url.startsWith('/')) {
        fullUrl = baseApiUrl + url;
      } else if (!url.startsWith('http')) {
        fullUrl = baseApiUrl + '/' + url;
      }

      console.log('Background script: 完整URL:', fullUrl);

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
      console.log('Background script request contains authentication token:', headers.Authorization.substring(0, 20) + '...');

      // Ensure token format is correct, add prefix if not starting with "Token " or "Bearer "
      if (headers.Authorization && !headers.Authorization.startsWith('Token ') && !headers.Authorization.startsWith('Bearer ')) {
        options.headers.Authorization = `Token ${headers.Authorization}`;
        console.log('Background script added Token prefix to authorization header');
      } else {
        options.headers.Authorization = headers.Authorization;
        console.log('Background script using authorization header as-is');
      }
    } else {
      console.warn('Background script request does not contain authentication token, this may cause 401 error');

      // If request doesn't contain authentication token, try to get from environment config
      if (envConfig.token) {
        // Ensure token format is correct
        if (!envConfig.token.startsWith('Token ') && !envConfig.token.startsWith('Bearer ')) {
          options.headers.Authorization = `Token ${envConfig.token}`;
        } else {
          options.headers.Authorization = envConfig.token;
        }
        console.log('Background script using token from environment config');
      } else {
        console.warn('Background script environment config also has no token, request will not contain authentication info');
      }
    }

    // Add request body (if any)
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
      options.body = JSON.stringify(body);
    }

    // Set timeout
    const timeout = isForceRefresh ? 120000 : 60000; // 普通请求 60 秒，强制刷新 120 秒

    console.log('Background script: 发送请求:', {
      url: fullUrl,
      method: options.method,
      headers: options.headers,
      hasBody: !!options.body,
      timeout: timeout
    });

    // Create timeout Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout (${timeout/1000} seconds)`)), timeout);
    });

    // Create fetch Promise with detailed error handling
    // Use built complete URL
    const fetchPromise = fetch(fullUrl, options).catch(error => {
      console.error('Background script fetch error details:', {
        url: fullUrl,
        error: error.message,
        errorType: error.name,
        stack: error.stack
      });
      throw new Error(`Fetch failed: ${error.message}`);
    });

      // Use Promise.race, whoever completes first wins
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      console.log('Background script: 收到响应:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });

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
        console.log('Background script: 响应数据:', responseData);
      } catch (e) {
        console.warn('Background script response is not JSON format:', responseText);
        responseData = responseText;
      }

      // Success - send response and return
      // 对于收藏功能，即使是404也应该被视为成功的响应（只是收藏不存在）
      const isSuccessfulResponse = response.ok ||
        (response.status === 404 && fullUrl.includes('/favorites/'));

      const finalResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseData,
        success: isSuccessfulResponse
      };

      console.log('Background script: 发送最终响应:', finalResponse);
      console.log('Background script: 响应状态:', response.status, '成功:', isSuccessfulResponse);
      sendResponse(finalResponse);
      return; // Exit the retry loop on success

    } catch (error) {
      lastError = error;
      console.error(`Background script API request attempt ${attempt}/${maxRetries} failed:`, error.message);

      // If this is the last attempt, don't wait
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries failed
  console.error('Background script API proxy request failed after all retries:', lastError);
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