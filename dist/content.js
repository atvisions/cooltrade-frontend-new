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
      /\/([A-Z0-9]+)_([A-Z0-9]+)/i
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
      /\/trade\/usdt\/([A-Z0-9]+)/i,                    
      /\/trade\/spot\/([A-Z0-9]+)\/USDT/i,              
      /\/[a-z]{2}\/trade\/spot\/([A-Z0-9]+)\/USDT/i,    
      /\/([A-Z0-9]+)\/USDT$/i                          
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
        for (const regex of ex.symbolRegexes) {
          const matches = url.match(regex);
          if (matches) {
            let symbol = matches.slice(1).map(s => s.toUpperCase()).join('');
            if (matches.length === 2 && !symbol.includes('USDT')) {
              symbol = symbol + 'USDT';
            } else if (matches.length === 3) {
              const base = matches[1].toUpperCase();
              const quote = matches[2].toUpperCase();
              if (quote === 'USDT') {
                symbol = base + 'USDT';
              } else {
                symbol = base + quote;
              }
            }
            return symbol;
          }
        }
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

function isExchangeUrl(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('mexc.com') && urlObj.pathname.includes('/futures/')) {
      return true;
    }

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


function isExchangeTradingPage() {
  return isExchangeUrl(window.location.href);
}


function getSymbolFromUrl() {
  return parseSymbolFromUrl(window.location.href);
}

let lastProcessedUrl = '';
let isProcessing = false;

async function initializePlugin(forceRefresh = false) {
  try {
    const currentUrl = window.location.href;

    if (!forceRefresh && (isProcessing || currentUrl === lastProcessedUrl)) {
      return;
    }

    isProcessing = true;
    const isExchangePage = isExchangeTradingPage();
    if (!isExchangePage) {
      isProcessing = false;
      return;
    }

    const symbol = getSymbolFromUrl();

    if (!symbol) {
      isProcessing = false;
      return;
    }
    chrome.runtime.sendMessage({
      type: 'TRADING_PAGE_LOADED',
      data: { symbol }
    }, (response) => {
      lastProcessedUrl = currentUrl;
      isProcessing = false;
    });

  } catch (error) {
    isProcessing = false;
  }
}

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

  setInterval(() => {
    handleUrlChange();
  }, 1000);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PAGE_UPDATED') {
    initializePlugin(true); 
    sendResponse({ status: 'success' });
    return true;
  }

  if (message.type === 'GET_SYMBOL_FROM_CONTENT') {
    const symbol = getSymbolFromUrl();
    sendResponse({ symbol });
    return true;
  }
  sendResponse({ status: 'success' });
  return true;
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializePlugin();
    setupPageChangeListener();
  });
} else {
  initializePlugin();
  setupPageChangeListener();
}
