interface ExchangeInfo {
  name: string;
  baseUrl: string;
  tradeUrlPatterns: string[];
  symbolRegexes: RegExp[];
}

const exchanges: ExchangeInfo[] = [
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
    tradeUrlPatterns: ['/trade/usdt/'],
    symbolRegexes: [
      /\/trade\/usdt\/([A-Z0-9]+)/i
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
      /\/futures\/([A-Z0-9_]+)/i  // 简化正则表达式，不依赖查询参数
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

/**
 * 从交易所URL中解析交易对符号
 * @param url 交易所URL
 * @returns 交易对符号，例如 'BTCUSDT'
 */
export const parseSymbolFromUrl = (url: string): string | null => {
  try {
    // 特殊处理MEXC期货URL
    if (url.includes('mexc.com') && url.includes('/futures/')) {
      // 尝试直接从URL路径中提取交易对
      const pathMatch = url.match(/\/futures\/([A-Z0-9_]+)/i);
      if (pathMatch) {
        // 从URL中提取交易对，格式为 /futures/BTC_USDT
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
            // 合并所有捕获组为 symbol
            const symbol = matches.slice(1).map(s => s.toUpperCase()).join('');
            return symbol;
          }
        }
      }
    }

    return null;
  } catch (e) {
    return null
  }
}

export function isExchangeUrl(url: string): boolean {
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

// 导出交易所信息，以便其他模块使用
export const supportedExchanges = exchanges.map(ex => ({
  name: ex.name,
  baseUrl: ex.baseUrl
}));
