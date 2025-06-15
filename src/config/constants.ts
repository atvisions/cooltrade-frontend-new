// API URLs and other constants
// 只在生产环境用完整域名，开发环境始终用 '/api' 让 Vite 代理
export const API_BASE_URL = 'http://192.168.3.56:8000/api';
export const WEBSITE_URL = 'http://192.168.3.56:8000';

// Environment specific configurations
export const getApiBaseUrl = () => {
    // 开发环境一律用 '/api'，不管是不是插件
    if (import.meta.env.DEV) {
        return '/api';
    }
    // 生产环境插件用线上
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        return API_BASE_URL;
    }
    // 生产环境网页用线上
    return API_BASE_URL;
};

// Get main website domain for cookie operations
export const getMainWebsiteDomain = () => {
    // 目前开发和生产环境都使用相同的域名
    // 如果将来需要区分环境，可以在这里添加逻辑
    return WEBSITE_URL;
};

// Other constants can be added here 