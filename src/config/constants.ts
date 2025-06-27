// API URLs and other constants
// 使用本地测试服务器地址
export const API_BASE_URL = 'http://127.0.0.1:8000/api';
export const WEBSITE_URL = 'http://127.0.0.1:8000';

// Environment specific configurations
export const getApiBaseUrl = () => {
    // 统一使用本地测试服务器地址
    return API_BASE_URL;
};

// Get main website domain for cookie operations
export const getMainWebsiteDomain = () => {
    // 目前开发和生产环境都使用相同的域名
    // 如果将来需要区分环境，可以在这里添加逻辑
    return WEBSITE_URL;
};

// Other constants can be added here 