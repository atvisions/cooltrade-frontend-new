import type {
  TechnicalAnalysisResponse,
  TechnicalAnalysisData,
  ForceRefreshResponse,
  ForceRefreshData,
  FormattedTechnicalAnalysisData,
  BaseApiResponse
} from '@/types/technical-analysis'

// 类型守卫：检查是否是基础API响应
function isBaseApiResponse(response: unknown): response is BaseApiResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    typeof (response as BaseApiResponse).status === 'string'
  )
}

// 类型守卫：检查是否是强制刷新数据
function isForceRefreshData(data: unknown): data is ForceRefreshData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'trend_up_probability' in data &&
    'trend_sideways_probability' in data &&
    'trend_down_probability' in data
  )
}

// 类型守卫：检查是否是技术分析数据
function isTechnicalAnalysisData(data: unknown): data is TechnicalAnalysisData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'trend_analysis' in data &&
    'indicators_analysis' in data &&
    'trading_advice' in data
    // 移除 risk_assessment 检查，因为后端可能不返回这个字段
  )
}

/**
 * 格式化技术分析数据
 * @param response 可能是常规分析响应或强制刷新响应，或直接返回的数据
 * @param targetLanguage 目标语言，默认为当前语言
 * @returns 格式化后的数据
 */
export function formatTechnicalAnalysisData(
  response: TechnicalAnalysisData | TechnicalAnalysisResponse | ForceRefreshResponse | ForceRefreshData | unknown,
  _targetLanguage?: string
): FormattedTechnicalAnalysisData {
  // 获取当前语言，如果没有指定则使用localStorage中的语言或默认英文
  // const currentLanguage = targetLanguage || localStorage.getItem('language') || 'en-US'; // (removed unused variable)
  try {
    // 如果响应为空，抛出明确的错误
    if (!response) {
      throw new Error('技术分析数据为空')
    }

    // 处理API响应
    if (isBaseApiResponse(response) && 'data' in response) {
      if (response.status !== 'success') {
        throw new Error(`API响应错误: ${response.status}`)
      }

      if (!response.data) {
        throw new Error('API响应中data为空')
      }

      // 检查是否是新的reports数组格式
      if (typeof response.data === 'object' && 'reports' in response.data && Array.isArray((response.data as any).reports)) {
        const reports = (response.data as any).reports
        if (reports.length > 0) {
          // 使用第一个报告（通常是最新的）
          response = reports[0]
        } else {
          throw new Error('reports数组为空')
        }
      } else {
        response = response.data
      }
    }

    // 处理强制刷新数据
    if (isForceRefreshData(response)) {
      try {
        // 创建格式化后的数据对象，添加默认值和类型检查
        const formattedData: FormattedTechnicalAnalysisData = {
          current_price: typeof response.current_price === 'number' ? response.current_price : 0,
          snapshot_price: typeof response.snapshot_price === 'number' ? response.snapshot_price : 0,
          trend_analysis: {
            probabilities: {
              up: typeof response.trend_up_probability === 'number' ? response.trend_up_probability : 0,
              sideways: typeof response.trend_sideways_probability === 'number' ? response.trend_sideways_probability : 0,
              down: typeof response.trend_down_probability === 'number' ? response.trend_down_probability : 0
            },
            summary: typeof response.trend_summary === 'string' ? response.trend_summary : '无数据'
          },
          indicators_analysis: response.indicators_analysis || {},
          trading_advice: {
            action: typeof response.trading_action === 'string' ? response.trading_action : '无建议',
            reason: typeof response.trading_reason === 'string' ? response.trading_reason : '无数据',
            entry_price: typeof response.entry_price === 'number' ? response.entry_price : 0,
            stop_loss: typeof response.stop_loss === 'number' ? response.stop_loss : 0,
            take_profit: typeof response.take_profit === 'number' ? response.take_profit : 0
          },
          risk_assessment: {
            level: typeof (response as any).risk_level === 'string' ? (response as any).risk_level : '中',
            score: typeof (response as any).risk_score === 'number' ? (response as any).risk_score : 50,
            details: Array.isArray((response as any).risk_details) ? (response as any).risk_details : []
          },
          last_update_time: typeof response.last_update_time === 'string' ? response.last_update_time : new Date().toISOString()
        }

        // 直接返回格式化后的数据
        return formattedData
      } catch (error) {
        throw new Error(`格式化强制刷新数据失败: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // 处理技术分析数据
    if (isTechnicalAnalysisData(response)) {
      try {
        // 只在调试模式下添加调试信息
        if (process.env.NODE_ENV === 'development' || localStorage.getItem('i18n_debug') === 'true') {
          console.log('格式化技术分析数据:', response);
          console.log('价格字段检查:', {
            current_price: response.current_price,
            snapshot_price: response.snapshot_price,
            price: (response as any).price
          });
        }

        // 创建格式化后的数据对象，添加默认值和类型检查
        const price = typeof (response as any).price === 'number' ? (response as any).price :
                     (typeof response.current_price === 'number' ? response.current_price : 0);

        // 处理indicators_analysis，确保兼容新旧格式
        let indicators_analysis = response.indicators_analysis || {};

        // 添加调试信息
        if (process.env.NODE_ENV === 'development') {
          console.log('原始indicators_analysis:', indicators_analysis);
        }

        // 如果indicators_analysis中的指标没有value字段，需要添加默认值
        const processedIndicators: any = {};
        for (const [key, indicator] of Object.entries(indicators_analysis)) {
          if (indicator && typeof indicator === 'object') {
            const indicatorObj = indicator as any;

            // 为没有value字段的指标添加默认value
            if (!('value' in indicatorObj)) {
              // 尝试从原始数据中提取value
              let extractedValue: any = null;
              
              // 检查是否有原始技术指标数据
              if ((response as any).indicators) {
                const rawIndicators = (response as any).indicators;
                
                // 根据指标类型提取对应的值
                if (key.toLowerCase() === 'rsi') {
                  extractedValue = rawIndicators.rsi || 0;
                } else if (key.toLowerCase() === 'macd') {
                  extractedValue = {
                    line: rawIndicators.macd_line || 0,
                    signal: rawIndicators.macd_signal || 0,
                    histogram: rawIndicators.macd_histogram || 0
                  };
                } else if (key.toLowerCase() === 'bollingerbands') {
                  extractedValue = {
                    upper: rawIndicators.bollinger_upper || 0,
                    middle: rawIndicators.bollinger_middle || 0,
                    lower: rawIndicators.bollinger_lower || 0
                  };
                } else if (key.toLowerCase() === 'bias') {
                  extractedValue = rawIndicators.bias || 0;
                } else if (key.toLowerCase() === 'psy') {
                  extractedValue = rawIndicators.psy || 0;
                } else if (key.toLowerCase() === 'dmi') {
                  extractedValue = {
                    plus_di: rawIndicators.dmi_plus || 0,
                    minus_di: rawIndicators.dmi_minus || 0,
                    adx: rawIndicators.dmi_adx || 0
                  };
                } else if (key.toLowerCase() === 'vwap') {
                  extractedValue = rawIndicators.vwap || 0;
                } else if (key.toLowerCase() === 'fundingrate') {
                  extractedValue = rawIndicators.funding_rate || 0;
                } else if (key.toLowerCase() === 'exchangenetflow') {
                  extractedValue = rawIndicators.exchange_netflow || 0;
                } else if (key.toLowerCase() === 'nupl') {
                  extractedValue = rawIndicators.nupl || 0;
                } else if (key.toLowerCase() === 'mayermultiple') {
                  extractedValue = rawIndicators.mayer_multiple || 0;
                }
              }
              
              // 如果无法从原始数据中提取，则使用默认值
              if (extractedValue === null) {
                if (key.toLowerCase() === 'macd') {
                  extractedValue = { line: 0, signal: 0, histogram: 0 };
                } else if (key.toLowerCase() === 'bollingerbands') {
                  extractedValue = { upper: 0, middle: 0, lower: 0 };
                } else if (key.toLowerCase() === 'dmi') {
                  extractedValue = { plus_di: 0, minus_di: 0, adx: 0 };
                } else {
                  extractedValue = 0;
                }
              }
              
              processedIndicators[key] = {
                ...indicatorObj,
                value: extractedValue
              };
            } else {
              processedIndicators[key] = indicatorObj;
            }
          }
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('处理后的indicators_analysis:', processedIndicators);
        }

        // 兼容：如果 risk_assessment 字段不存在，则从 trading_advice 拷贝风险字段
        let risk_assessment = (response as any).risk_assessment;
        if (!risk_assessment && response.trading_advice) {
          risk_assessment = {
            level: response.trading_advice.risk_level ?? '中',
            score: response.trading_advice.risk_score ?? 50,
            details: Array.isArray(response.trading_advice.risk_details) ? response.trading_advice.risk_details : []
          }
        }
        const formattedData: FormattedTechnicalAnalysisData = {
          current_price: typeof response.current_price === 'number' ? response.current_price : price,
          snapshot_price: typeof response.snapshot_price === 'number' ? response.snapshot_price : price,
          trend_analysis: {
            probabilities: {
              up: typeof response.trend_analysis?.probabilities?.up === 'number' ? response.trend_analysis.probabilities.up : 0,
              sideways: typeof response.trend_analysis?.probabilities?.sideways === 'number' ? response.trend_analysis.probabilities.sideways : 0,
              down: typeof response.trend_analysis?.probabilities?.down === 'number' ? response.trend_analysis.probabilities.down : 0
            },
            summary: typeof response.trend_analysis?.summary === 'string' ? response.trend_analysis.summary : '无数据'
          },
          indicators_analysis: processedIndicators,
          trading_advice: {
            action: typeof response.trading_advice?.action === 'string' ? response.trading_advice.action : '无建议',
            reason: typeof response.trading_advice?.reason === 'string' ? response.trading_advice.reason : '无数据',
            entry_price: typeof response.trading_advice?.entry_price === 'number' ? response.trading_advice.entry_price : 0,
            stop_loss: typeof response.trading_advice?.stop_loss === 'number' ? response.trading_advice.stop_loss : 0,
            take_profit: typeof response.trading_advice?.take_profit === 'number' ? response.trading_advice.take_profit : 0
          },
          risk_assessment: {
            level: typeof risk_assessment?.level === 'string' ? risk_assessment.level : '中',
            score: typeof risk_assessment?.score === 'number' ? risk_assessment.score : 50,
            details: Array.isArray(risk_assessment?.details) ? risk_assessment.details : []
          },
          last_update_time: typeof response.last_update_time === 'string' ? response.last_update_time :
                        (typeof (response as any).timestamp === 'string' ? (response as any).timestamp : new Date().toISOString())
        }

        // 直接返回格式化后的数据
        return formattedData
      } catch (error) {
        throw new Error(`格式化技术分析数据失败: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // 如果无法识别数据格式
    throw new Error('无法识别的数据格式')
  } catch (error) {
    // 创建默认的数据结构
    const defaultData = {
      current_price: 0,
      snapshot_price: 0,
      trend_analysis: {
        probabilities: { up: 0.33, sideways: 0.34, down: 0.33 },
        summary: 'Data loading failed, please refresh and try again'
      },
      indicators_analysis: {
        RSI: { value: 0, analysis: 'Data loading failed', support_trend: 'neutral' },
        MACD: { value: { line: 0, signal: 0, histogram: 0 }, analysis: 'Data loading failed', support_trend: 'neutral' },
        BollingerBands: { value: { upper: 0, middle: 0, lower: 0 }, analysis: 'Data loading failed', support_trend: 'neutral' },
        BIAS: { value: 0, analysis: 'Data loading failed', support_trend: 'neutral' },
        PSY: { value: 0, analysis: 'Data loading failed', support_trend: 'neutral' },
        DMI: { value: { plus_di: 0, minus_di: 0, adx: 0 }, analysis: 'Data loading failed', support_trend: 'neutral' },
        VWAP: { value: 0, analysis: 'Data loading failed', support_trend: 'neutral' },
        FundingRate: { value: 0, analysis: 'Data loading failed', support_trend: 'neutral' },
        ExchangeNetflow: { value: 0, analysis: 'Data loading failed', support_trend: 'neutral' },
        NUPL: { value: 0, analysis: 'Data loading failed', support_trend: 'neutral' },
        MayerMultiple: { value: 0, analysis: 'Data loading failed', support_trend: 'neutral' }
      },
      trading_advice: {
        action: 'No advice',
        reason: 'Data loading failed',
        entry_price: 0,
        stop_loss: 0,
        take_profit: 0
      },
      risk_assessment: {
        level: 'medium',
        score: 50,
        details: ['Data loading failed, unable to assess risk']
      },
      last_update_time: new Date().toISOString()
    };

    // 直接返回默认数据
    return defaultData
  }
}
