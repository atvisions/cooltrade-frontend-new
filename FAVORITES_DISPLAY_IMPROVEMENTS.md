# 收藏功能展现改进

## 问题描述
根据用户反馈，当前收藏功能存在以下问题：
1. 显示了不必要的USDT后缀（如DOGEUSDT、SOLUSDT等）
2. 删除按钮被遮挡或不够明显，用户体验不佳

## 改进方案

### 1. 移除USDT后缀显示
- **问题**：加密货币符号显示为DOGEUSDT、AVAXUSDT等，冗余且占用空间
- **解决方案**：创建`formatDisplaySymbol`函数，自动移除crypto类型资产的USDT后缀
- **效果**：DOGEUSDT → DOGE，AVAXUSDT → AVAX，界面更简洁

### 2. 改进删除按钮展现
- **问题**：删除按钮使用`opacity-0 group-hover:opacity-100`，只有hover时才显示，容易被遮挡
- **解决方案**：
  - 移除opacity控制，删除按钮始终可见
  - 增大按钮尺寸：从4x4增加到5x5像素
  - 改进视觉设计：使用红色背景和更明显的图标

## 具体修改

### 1. HomeView.vue
```javascript
// 新增格式化函数
const formatDisplaySymbol = (symbol: string, marketType: string) => {
  if (marketType === 'crypto' && symbol.endsWith('USDT')) {
    return symbol.replace('USDT', '')
  }
  return symbol
}
```

```html
<!-- 更新显示 -->
<div class="font-medium text-white text-xs">{{ formatDisplaySymbol(asset.symbol, asset.market_type) }}</div>

<!-- 改进删除按钮 -->
<button
  @click.stop="removeFavorite(asset.symbol, asset.market_type)"
  class="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 flex items-center justify-center transition-all duration-200"
  :title="t('favorites.remove')"
>
  <i class="ri-close-line text-xs"></i>
</button>
```

### 2. FavoritesModal.vue
- 同样添加`formatDisplaySymbol`函数
- 更新删除按钮样式，使用更明显的设计
- 保持功能一致性

## 改进效果

### 视觉效果
- **更简洁**：移除USDT后缀，减少视觉噪音
- **更清晰**：删除按钮始终可见，用户操作更直观
- **更一致**：所有收藏相关组件使用统一的展现标准

### 用户体验
- **易于识别**：符号更简短，一目了然
- **易于操作**：删除按钮更大更明显，不会被遮挡
- **响应迅速**：保持原有的交互逻辑和性能

### 兼容性
- **数据兼容**：后端存储仍使用完整符号（如BTCUSDT）
- **功能兼容**：所有API调用和业务逻辑保持不变
- **样式兼容**：适配现有的设计系统和主题

## 测试验证

### 1. 功能测试
- 收藏添加/移除功能正常
- 符号切换功能正常
- 状态同步功能正常

### 2. 视觉测试
- 使用`test-favorites-display.html`查看改进前后对比
- 验证不同市场类型的显示效果
- 确认删除按钮的可见性和可操作性

### 3. 兼容性测试
- Chrome插件环境测试
- localhost环境测试
- 不同屏幕尺寸测试

## 注意事项

1. **后端数据不变**：改进只影响前端显示，后端存储和API保持原有格式
2. **逐步应用**：可以先在部分组件测试，确认无问题后全面应用
3. **用户习惯**：如果用户习惯看到完整符号，可以考虑添加配置选项

## 后续优化建议

1. **添加tooltip**：hover时显示完整符号名称
2. **批量操作**：支持批量删除收藏
3. **拖拽排序**：支持收藏项的拖拽重排
4. **分组管理**：支持收藏的分组和标签管理
