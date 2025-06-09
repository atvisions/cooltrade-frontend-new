// 初始化环境变量
let envConfig = {
  baseApiUrl: 'http://192.168.3.56:8000/api',
  env: 'development',
  token: null
};

// 存储当前交易对信息
let currentTradingSymbol = 'BTCUSDT'; // 默认值

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script 收到消息:', message.type, message.data);

  if (message.type === 'RELOAD_RESOURCES') {
    // 重新加载扩展资源
    chrome.runtime.reload()
  } else if (message.type === 'TRADING_PAGE_LOADED') {
    console.log('Background script 处理 TRADING_PAGE_LOADED 消息:', message.data);
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
    // 设置环境配置
    envConfig = { ...envConfig, ...message.data };
    sendResponse({ status: 'success' });
  } else if (message.type === 'GET_CURRENT_SYMBOL') {
    // 响应获取当前交易对的请求
    console.log('Background script 响应 GET_CURRENT_SYMBOL 请求:', currentTradingSymbol);
    sendResponse({ symbol: currentTradingSymbol });
  } else if (message.type === 'MANUAL_SET_SYMBOL') {
    // 手动设置交易对（用于调试）
    const { symbol } = message.data;
    if (symbol) {
      console.log('Background script 手动设置交易对:', symbol);
      currentTradingSymbol = symbol;
      // 通知前端更新
      try {
        chrome.runtime.sendMessage({
          type: 'SYMBOL_UPDATED',
          data: { symbol: currentTradingSymbol }
        });
      } catch (error) {
        console.error('发送 SYMBOL_UPDATED 消息失败:', error);
      }
    }
    sendResponse({ status: 'success', symbol: currentTradingSymbol });
  } else if (message.type === 'PROXY_API_REQUEST') {
    // 处理API代理请求
    handleApiProxyRequest(message.data, sendResponse)
    return true // 保持连接打开，等待异步响应
  } else if (message.type === 'getCookie') {
    // 处理获取 cookie 的请求
    const { url, name } = message.data
    chrome.cookies.get({ url: url, name: name }, (cookie) => {
      sendResponse({ cookie: cookie })
    })
    return true // 保持连接打开，等待异步响应
  } else if (message.type === 'removeCookie') {
    // 处理删除 cookie 的请求
    const { url, name } = message.data
    chrome.cookies.remove({ url: url, name: name }, (details) => {
      if (details) {
        // console.log(`Cookie ${name} from ${url} removed successfully.`, details)
      } else {
        // console.log(`Could not remove cookie ${name} from ${url}.`)
      }
    })
    return false // 不需要异步响应
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

// 请求限制配置
const rateLimits = {
  maxRequests: 10,  // 每个时间窗口允许的最大请求数
  timeWindow: 1000, // 时间窗口大小（毫秒）
  requests: new Map() // 记录请求时间戳
};

// 检查请求限制
function checkRateLimit(tabId) {
  const now = Date.now();
  const requests = rateLimits.requests.get(tabId) || [];

  // 清理过期的请求记录
  const validRequests = requests.filter(time => now - time < rateLimits.timeWindow);

  if (validRequests.length >= rateLimits.maxRequests) {
    const oldestRequest = validRequests[0];
    const waitTime = (rateLimits.timeWindow - (now - oldestRequest)) / 1000;
    throw new Error(`请求过于频繁，请等待 ${waitTime.toFixed(2)} 秒`);
  }

  // 更新请求记录
  validRequests.push(now);
  rateLimits.requests.set(tabId, validRequests);
}

// 处理交易页面
async function handleTradingPage(data, tabId) {
  try {
    const { symbol } = data
    console.log(`Background script 处理交易页面: ${symbol}`);

    // 更新当前交易对
    if (symbol) {
      let formattedSymbol = symbol;
      if (symbol && !symbol.includes('USDT') && !symbol.includes('BTC') && symbol !== 'BTC') {
        formattedSymbol = symbol + 'USDT';
        console.log('Background script 格式化交易对:', symbol, '->', formattedSymbol);
      }
      currentTradingSymbol = formattedSymbol;
      console.log('Background script 更新 currentTradingSymbol:', currentTradingSymbol);

      // 通知所有打开的扩展页面更新交易对
      try {
        chrome.runtime.sendMessage({
          type: 'SYMBOL_UPDATED',
          data: { symbol: currentTradingSymbol }
        });
        console.log('Background script 发送 SYMBOL_UPDATED 消息:', currentTradingSymbol);
      } catch (error) {
        console.error('Background script 发送 SYMBOL_UPDATED 消息失败:', error);
      }
    } else {
      console.log('Background script 收到空的交易对信息');
    }

    // 检查请求限制（只有在有 tabId 时才检查）
    if (tabId) {
      checkRateLimit(tabId);

      // 通知content script更新页面
      try {
        chrome.tabs.sendMessage(tabId, {
          type: 'PAGE_UPDATED',
          data: { symbol }
        }, (response) => {
          if (chrome.runtime.lastError) {
            // console.log('发送更新消息时出错:', chrome.runtime.lastError.message);
            return;
          }

          if (response) {
            // console.log('更新消息已接收:', response);
          }
        });
      } catch (error) {
        // console.error('发送更新消息失败:', error);
      }
    } else {
      console.log('没有 tabId，跳过 content script 通知');
    }

  } catch (error) {
    // console.error('处理交易页面失败:', error)
    // 如果是请求限制错误，通知前端（只有在有 tabId 时）
    if (error.message.includes('请求过于频繁') && tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: 'RATE_LIMIT_ERROR',
        data: { message: error.message }
      });
    }
  }
}

// 检查是否是支持的交易所网站
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

// 监听扩展安装或更新
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // console.log('扩展已安装')
    // 不再设置 CSP 规则
  } else if (details.reason === 'update') {
    // console.log('扩展已更新')
    // 清理旧的缓存
    chrome.storage.local.clear()
  }
})

// 处理API代理请求
async function handleApiProxyRequest(data, sendResponse) {
  try {
    const { url, method, headers, body } = data;
    // console.log('Background script收到API代理请求:', {
    //   url: url,
    //   method: method,
    //   headers: headers ? { ...headers, Authorization: headers.Authorization ? '已设置' : '未设置' } : '未设置',
    //   body: body ? '已设置' : '未设置'
    // });

    // 检查是否是强制刷新请求
    const isForceRefresh = url.includes('force_refresh=true');

    // 构建完整的URL
    let fullUrl = url;

    // 使用环境配置中的 baseApiUrl
    const baseApiUrl = envConfig.baseApiUrl || 'https://www.cooltrade.xyz/api';

    // console.log('Background script使用基础API URL:', baseApiUrl);

    // 如果是相对路径，添加基础URL
    if (url.startsWith('/')) {
      fullUrl = baseApiUrl + url;
    } else if (!url.startsWith('http')) {
      fullUrl = baseApiUrl + '/' + url;
    }

    // console.log('Background script使用完整URL:', fullUrl);

    // 构建请求选项
    const options = {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      }
    };

    // 确保认证令牌被正确传递
    if (headers && headers.Authorization) {
      // console.log('Background script 请求包含认证令牌:', headers.Authorization);

      // 确保令牌格式正确，如果不是以 "Token " 开头，则添加前缀
      if (headers.Authorization && !headers.Authorization.startsWith('Token ') && !headers.Authorization.startsWith('Bearer ')) {
        // console.log('Background script 修正认证令牌格式，添加 Token 前缀');
        options.headers.Authorization = `Token ${headers.Authorization}`;
      }
    } else {
      // 如果请求中没有包含认证令牌，尝试从 localStorage 获取
      try {
        // 从 localStorage 获取 token
        chrome.storage.local.get(['token'], function(result) {
          if (result.token) {
            // console.log('Background script 从 storage 获取认证令牌');

            // 确保令牌格式正确
            if (!result.token.startsWith('Token ') && !result.token.startsWith('Bearer ')) {
              options.headers.Authorization = `Token ${result.token}`;
            } else {
              options.headers.Authorization = result.token;
            }
          } else if (envConfig.token) {
            // console.log('Background script 使用环境配置中的认证令牌');

            // 确保令牌格式正确
            if (!envConfig.token.startsWith('Token ') && !envConfig.token.startsWith('Bearer ')) {
              options.headers.Authorization = `Token ${envConfig.token}`;
            } else {
              options.headers.Authorization = envConfig.token;
            }
          } else {
            // console.warn('Background script 请求不包含认证令牌，无法从任何来源获取 token');
          }
        });
      } catch (error) {
        // console.error('Background script 获取认证令牌失败:', error);

        // 如果从 localStorage 获取失败，尝试使用环境配置中的 token
        if (envConfig.token) {
          // console.log('Background script 使用环境配置中的认证令牌');

          // 确保令牌格式正确
          if (!envConfig.token.startsWith('Token ') && !envConfig.token.startsWith('Bearer ')) {
            options.headers.Authorization = `Token ${envConfig.token}`;
          } else {
            options.headers.Authorization = envConfig.token;
          }
        } else {
          // console.warn('Background script 请求不包含认证令牌，环境配置中也没有 token');
        }
      }
    }

    // 添加请求体（如果有）
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    // 设置超时
    const timeout = isForceRefresh ? 120000 : 30000; // 强制刷新使用更长的超时时间

    // console.log('Background script发送请求:', {
    //   url: fullUrl,
    //   options: {
    //     method: options.method,
    //     headers: options.headers ? { ...options.headers, Authorization: options.headers.Authorization ? '已设置' : '未设置' } : '未设置',
    //     body: options.body ? '已设置' : '未设置'
    //   }
    // });

    // 创建超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`请求超时 (${timeout/1000}秒)`)), timeout);
    });

    // 创建fetch Promise
    // 使用构建的完整URL
    const fetchPromise = fetch(fullUrl, options).catch(error => {
      // console.error('Fetch error:', error);
      throw new Error(`Fetch failed: ${error.message}`);
    });

    // 使用Promise.race竞争，谁先完成就用谁的结果
    const response = await Promise.race([fetchPromise, timeoutPromise]);

    // console.log('Background script收到响应:', {
    //   status: response.status,
    //   statusText: response.statusText,
    //   headers: response.headers
    // });

    // 获取响应头
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // 获取响应体在发送响应回去之前，先记录一下原始的响应文本
    const responseText = await response.text();
    // console.log('Background script原始响应文本:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      // console.warn('Background script响应不是JSON格式:', responseText);
      responseData = responseText;
    }

    // console.log('Background script处理后的响应数据:', responseData);

    // 发送响应回去
    sendResponse({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: responseData,
      success: response.ok
    });
  } catch (error) {
    // console.error('Background script API代理请求失败:', error);
    sendResponse({
      success: false,
      error: error.message || '请求失败',
      errorDetail: error.toString()
    });
  }
}

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // 检查是否是目标网站
    try {
      chrome.tabs.sendMessage(tabId, {
        type: 'PAGE_UPDATED',
        data: { url: tab.url }
      }, () => {
        if (chrome.runtime.lastError) {
          // content script 可能尚未加载，这是正常的
          return;
        }
      });
    } catch (error) {
      // console.error('发送消息失败:', error);
    }
  }
})