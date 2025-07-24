# 环境配置说明

## 快速切换API环境

### 方法1：修改前端环境变量
编辑 `.env` 文件：

```bash
# 本地开发环境
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WEBSITE_URL=http://localhost:8000

# 生产环境
# VITE_API_BASE_URL=https://www.cooltrade.xyz/api
# VITE_WEBSITE_URL=https://www.cooltrade.xyz
```

### 方法2：修改插件background.js
编辑 `public/background.js` 第4行：

```javascript
// 本地开发环境
baseApiUrl: 'http://localhost:8000/api',

// 生产环境
// baseApiUrl: 'https://www.cooltrade.xyz/api',
```

## 构建和部署

1. **修改环境配置**：根据需要修改上述配置文件
2. **重新构建**：`./build.sh`
3. **重新加载插件**：在Chrome扩展管理页面重新加载

## 注意事项

- 前端和插件需要使用相同的API地址
- 修改配置后需要重新构建
- 确保后端CORS配置包含对应的域名
