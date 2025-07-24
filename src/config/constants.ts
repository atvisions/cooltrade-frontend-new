// API URLs and other constants
// 统一从环境变量读取，手动修改.env文件即可切换环境

/**
 * API基础URL - 从环境变量读取
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * 网站基础URL - 从环境变量读取
 */
export const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:8000';

/**
 * 获取API基础URL
 */
export const getApiBaseUrl = (): string => {
  return API_BASE_URL;
};

/**
 * 获取网站基础URL
 */
export const getWebsiteUrl = (): string => {
  return WEBSITE_URL;
};

// Get main website domain for cookie operations
export const getMainWebsiteDomain = () => {
    return getWebsiteUrl();
};

/**
 * 检查是否在Chrome扩展环境中
 */
export const isExtensionEnvironment = (): boolean => {
  try {
    return typeof chrome !== 'undefined' &&
           chrome.runtime &&
           chrome.runtime.id &&
           (window.location.protocol === 'chrome-extension:' ||
            window.location.protocol === 'moz-extension:');
  } catch (e) {
    return false;
  }
};

/**
 * 获取当前环境信息（用于调试）
 */
export const getEnvironmentInfo = () => {
  return {
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    mode: import.meta.env.MODE,
    apiBaseUrl: getApiBaseUrl(),
    websiteUrl: getWebsiteUrl(),
    isExtension: isExtensionEnvironment(),
    envVars: {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_WEBSITE_URL: import.meta.env.VITE_WEBSITE_URL
    }
  };
};

// Other constants can be added here