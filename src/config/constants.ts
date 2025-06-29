// API URLs and other constants
export const API_BASE_URL = 'http://127.0.0.1:8000/api';
export const WEBSITE_URL = 'http://127.0.0.1:8000';

// Environment specific configurations
export const getApiBaseUrl = () => {
    return API_BASE_URL;
};

// Get main website domain for cookie operations
export const getMainWebsiteDomain = () => {
    return WEBSITE_URL;
};

// Other constants can be added here 