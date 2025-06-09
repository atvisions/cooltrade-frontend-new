// 注入到交易所页面的脚本
// console.log('K线军师插件已加载');

// 导入交易对解析函数
// 由于 content script 无法直接导入 ES 模块，我们需要内联这些函数

// 交易所配置
const exchanges = [
  {
    name: 'Gate.io',
    baseUrl: 'gate.io',
    tradeUrlPatterns: ['/zh/trade/', '/en/trade/', '/trade/'],
    symbolRegexes: [
      /\/trade\/([A-Z0-9]+)_USDT/i,
      /\/[a-z]{2}\/trade\/([A-Z0-9]+)_USDT/i,
      /\/([A-Z0-9]+)_USDT$/i
    ]
  },
  {
    name: 'Gate.com',
    baseUrl: 'gate.com',
    tradeUrlPatterns: ['/zh/trade/', '/en/trade/', '/trade/'],
    symbolRegexes: [
      /\/trade\/([A-Z0-9]+)_USDT/i,
      /\/[a-z]{2}\/trade\/([A-Z0-9]+)_USDT/i,
      /\/([A-Z0-9]+)_USDT$/i,
      /\/([A-Z0-9]+)_([A-Z0-9]+)/i  // 添加通用的交易对格式
    ]
  },
  {
    name: 'Binance',
    baseUrl: 'binance.com',
    tradeUrlPatterns: ['/*/trade/', '/trade/'],
    symbolRegexes: [
      /\/([A-Z0-9]+)USDT$/i,
      /\/trade\/([A-Z0-9]+)_USDT/i,
      /\/trading\/([A-Z0-9]+)USDT/i
    ]
  },
  {
    name: 'OKX',
    baseUrl: 'okx.com',
    tradeUrlPatterns: ['/*/trade-spot/', '/*/trade/', '/trade-spot/', '/trade/'],
    symbolRegexes: [
      /\/([A-Z0-9]+)-USDT$/i,
      /\/trade\/([A-Z0-9]+)-USDT/i,
      /\/spot\/([A-Z0-9]+)-USDT/i
    ]
  },
  {
    name: 'HTX',
    baseUrl: 'htx.com',
    tradeUrlPatterns: ['/trade/'],
    symbolRegexes: [
      /\/trade\/([a-zA-Z0-9]+)_([a-zA-Z0-9]+)/i
    ]
  },
  {
    name: 'Bybit',
    baseUrl: 'bybit.com',
    tradeUrlPatterns: ['/trade/usdt/', '/trade/spot/', '/en/trade/', '/zh/trade/'],
    symbolRegexes: [
      /\/trade\/usdt\/([A-Z0-9]+)/i,                    // 旧格式: /trade/usdt/BTC
      /\/trade\/spot\/([A-Z0-9]+)\/USDT/i,              // 新格式: /trade/spot/ETH/USDT
      /\/[a-z]{2}\/trade\/spot\/([A-Z0-9]+)\/USDT/i,    // 带语言: /en/trade/spot/ETH/USDT
      /\/([A-Z0-9]+)\/USDT$/i                           // 简化格式: /ETH/USDT
    ]
  },
  {
    name: 'Bitmart',
    baseUrl: 'bitmart.com',
    tradeUrlPatterns: ['/trade/en'],
    symbolRegexes: [
      /\/trade\/en\?symbol=([A-Z0-9_]+)/i
    ]
  },
  {
    name: 'Coinbase',
    baseUrl: 'coinbase.com',
    tradeUrlPatterns: ['/trade/'],
    symbolRegexes: [
      /\/trade\/([A-Z0-9-]+)/i
    ]
  },
  {
    name: 'Bitstamp',
    baseUrl: 'bitstamp.net',
    tradeUrlPatterns: ['/markets/'],
    symbolRegexes: [
      /\/markets\/([a-z0-9]+)\/([a-z0-9]+)/i
    ]
  },
  {
    name: 'Kucoin',
    baseUrl: 'kucoin.com',
    tradeUrlPatterns: ['/trade/'],
    symbolRegexes: [
      /\/trade\/(\w+)-(\w+)/i
    ]
  },
  {
    name: 'Poloniex',
    baseUrl: 'poloniex.com',
    tradeUrlPatterns: ['/spot/'],
    symbolRegexes: [
      /\/spot\/([A-Z0-9_]+)/i
    ]
  },
  {
    name: 'Bithumb',
    baseUrl: 'bithumb.com',
    tradeUrlPatterns: ['/trade/'],
    symbolRegexes: [
      /\/trade\/([A-Z0-9_]+)/i
    ]
  },
  {
    name: 'Upbit',
    baseUrl: 'upbit.com',
    tradeUrlPatterns: ['/trade/'],
    symbolRegexes: [
      /\/trade\?code=CRIX.UPBIT.([A-Z0-9]+)-([A-Z0-9]+)/i
    ]
  },
  {
    name: 'Bitflyer',
    baseUrl: 'bitflyer.com',
    tradeUrlPatterns: ['/trade/'],
    symbolRegexes: [
      /\/trade\/([A-Z0-9_]+)/i
    ]
  },
  {
    name: 'Gemini',
    baseUrl: 'gemini.com',
    tradeUrlPatterns: ['/trade/'],
    symbolRegexes: [
      /\/trade\/([A-Z0-9]+)[-_/]([A-Z0-9]+)/i
    ]
  },
  {
    name: 'LBank',
    baseUrl: 'lbank.com',
    tradeUrlPatterns: ['/trade/'],
    symbolRegexes: [
      /\/trade\/([A-Z0-9_]+)/i
    ]
  },
  {
    name: 'Phemex',
    baseUrl: 'phemex.com',
    tradeUrlPatterns: ['/spot/trade'],
    symbolRegexes: [
      /\/spot\/trade\?symbol=([A-Z0-9_]+)/i
    ]
  },
  {
    name: 'MEXC',
    baseUrl: 'mexc.com',
    tradeUrlPatterns: ['/exchange/', '/futures/'],
    symbolRegexes: [
      /\/exchange\/([A-Z0-9_]+)/i,
      /\/futures\/([A-Z0-9_]+)/i
    ]
  },
  {
    name: 'Bitget',
    baseUrl: 'bitget.com',
    tradeUrlPatterns: ['/spot/'],
    symbolRegexes: [
      /\/spot\/([A-Z0-9_]+)/i
    ]
  },
  {
    name: 'Bitfinex',
    baseUrl: 'bitfinex.com',
    tradeUrlPatterns: ['/t/'],
    symbolRegexes: [
      /\/t\/([A-Z0-9:]+)/i
    ]
  },
  {
    name: 'Kraken',
    baseUrl: 'kraken.com',
    tradeUrlPatterns: ['/trade/'],
    symbolRegexes: [
      /\/trade\/([A-Z0-9]+)-([A-Z0-9]+)/i
    ]
  },
  {
    name: 'Huobi',
    baseUrl: 'huobi.com',
    tradeUrlPatterns: ['/en-us/exchange/'],
    symbolRegexes: [
      /\/exchange\/([a-z0-9]+)\/\?type=spot/i
    ]
  }
];

// 从交易所URL中解析交易对符号
function parseSymbolFromUrl(url) {
  try {
    console.log('解析 URL:', url);

    // 特殊处理MEXC期货URL
    if (url.includes('mexc.com') && url.includes('/futures/')) {
      const pathMatch = url.match(/\/futures\/([A-Z0-9_]+)/i);
      if (pathMatch) {
        const tradingPair = pathMatch[1];
        if (tradingPair.includes('_')) {
          const symbol = tradingPair.split('_')[0].toUpperCase();
          return symbol + 'USDT';
        }
      }
    }

    // 常规处理逻辑
    for (const ex of exchanges) {
      if (url.includes(ex.baseUrl)) {
        console.log('匹配到交易所:', ex.name, ex.baseUrl);
        for (const regex of ex.symbolRegexes) {
          console.log('尝试正则:', regex);
          const matches = url.match(regex);
          if (matches) {
            console.log('正则匹配成功:', matches);
            // 合并所有捕获组为 symbol
            let symbol = matches.slice(1).map(s => s.toUpperCase()).join('');

            // 特殊处理不同的匹配情况
            if (matches.length === 2 && !symbol.includes('USDT')) {
              // 只有一个捕获组且不包含USDT，添加USDT后缀
              symbol = symbol + 'USDT';
            } else if (matches.length === 3) {
              // 两个捕获组，通常是 BASE/QUOTE 格式
              const base = matches[1].toUpperCase();
              const quote = matches[2].toUpperCase();
              if (quote === 'USDT') {
                symbol = base + 'USDT';
              } else {
                symbol = base + quote;
              }
            }

            console.log('解析出的交易对:', symbol);
            return symbol;
          }
        }
      }
    }

    console.log('未能解析出交易对');
    return null;
  } catch (e) {
    console.error('解析交易对时出错:', e);
    return null;
  }
}

// 检查URL是否是交易所页面
function isExchangeUrl(url) {
  try {
    const urlObj = new URL(url);

    // 特殊处理MEXC期货URL
    if (urlObj.hostname.includes('mexc.com') && urlObj.pathname.includes('/futures/')) {
      return true;
    }

    // 检查URL是否包含常见的交易所关键词
    const commonTradeKeywords = ['trade', 'trading', 'exchange', 'spot', 'futures', 'market'];
    if (commonTradeKeywords.some(keyword => urlObj.pathname.toLowerCase().includes(keyword))) {
      return true;
    }

    const result = exchanges.some(exchange => {
      const hostnameMatch = urlObj.hostname.includes(exchange.baseUrl);
      if (hostnameMatch) {
        const patternMatch = exchange.tradeUrlPatterns.some(pattern =>
          urlObj.pathname.includes(pattern)
        );
        if (patternMatch) {
          return true;
        }
      }
      return false;
    });

    return result;
  } catch (error) {
    return false;
  }
}

// 检查当前页面是否是交易所的交易页面
function isExchangeTradingPage() {
  return isExchangeUrl(window.location.href);
}

// 从URL中获取交易对信息
function getSymbolFromUrl() {
  return parseSymbolFromUrl(window.location.href);
}

// 防止重复执行
let lastProcessedUrl = '';
let isProcessing = false;

// 简化后的初始化函数
async function initializePlugin(forceRefresh = false) {
  try {
    const currentUrl = window.location.href;

    // 防止重复处理相同的URL（除非强制刷新）
    if (!forceRefresh && (isProcessing || currentUrl === lastProcessedUrl)) {
      console.log('跳过重复处理，URL:', currentUrl, 'lastProcessedUrl:', lastProcessedUrl);
      return;
    }

    isProcessing = true;
    console.log('=== Content Script 初始化 ===');
    console.log('当前 URL:', currentUrl);
    console.log('强制刷新:', forceRefresh);

    const isExchangePage = isExchangeTradingPage();
    console.log('是否为交易所页面:', isExchangePage);

    if (!isExchangePage) {
      console.log('不是交易所页面，跳过初始化');
      isProcessing = false;
      return;
    }

    const symbol = getSymbolFromUrl();
    console.log('解析到的交易对:', symbol, '当前URL:', window.location.href);

    if (!symbol) {
      console.log('未能解析到交易对，跳过初始化');
      isProcessing = false;
      return;
    }

    console.log('发送交易对信息到 background script:', symbol);
    chrome.runtime.sendMessage({
      type: 'TRADING_PAGE_LOADED',
      data: { symbol }
    }, (response) => {
      console.log('Background script 响应:', response);
      lastProcessedUrl = currentUrl;
      isProcessing = false;
    });

  } catch (error) {
    console.error('插件初始化失败:', error);
    isProcessing = false;
  }
}

// 简化的URL变化监听
function setupPageChangeListener() {
  let lastUrl = window.location.href;
  
  const handleUrlChange = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      if (isExchangeTradingPage()) {
        initializePlugin();
      }
    }
  };

  window.addEventListener('popstate', handleUrlChange);
  window.addEventListener('hashchange', handleUrlChange);

  // 新增：定时检测 URL 变化，兼容前端路由和局部刷新
  setInterval(() => {
    handleUrlChange();
  }, 1000);
}

// 监听来自background script和popup的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PAGE_UPDATED') {
    console.log('收到 PAGE_UPDATED 消息，强制重新检测页面...');
    initializePlugin(true); // 强制刷新
    sendResponse({ status: 'success' });
    return true;
  }
  // 新增：响应 popup 主动请求 symbol
  if (message.type === 'GET_SYMBOL_FROM_CONTENT') {
    const symbol = getSymbolFromUrl();
    console.log('Content script 收到 GET_SYMBOL_FROM_CONTENT，返回 symbol:', symbol);
    sendResponse({ symbol });
    return true;
  }
  sendResponse({ status: 'success' });
  return true;
});

// 在页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializePlugin();
    setupPageChangeListener();
  });
} else {
  initializePlugin();
  setupPageChangeListener();
}
