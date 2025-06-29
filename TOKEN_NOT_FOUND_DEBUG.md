# TokenNotFoundView 显示问题调试

## 问题描述
当API返回数据未找到时（如NVDA股票），控制台显示"loadAnalysisData: NVDA 的报告数据未找到"，但TokenNotFoundView组件没有显示。

## 问题分析

### 当前显示逻辑（HomeView.vue）
```vue
<!-- 骨架屏 - 优先级最高 -->
<div v-if="loading || analysisLoading">
  <ChartSkeleton />
</div>

<!-- 正常内容 - 有数据时显示 -->
<div v-else-if="analysisData">
  <!-- 正常内容 -->
</div>

<!-- TokenNotFoundView - 数据未找到时显示 -->
<template v-else-if="isTokenNotFound && !loading && !analysisLoading">
  <TokenNotFoundView />
</template>

<!-- 错误状态 -->
<template v-else-if="error && !loading && !analysisLoading">
  <!-- 错误内容 -->
</template>

<!-- 空状态 -->
<template v-else-if="!analysisData && !loading && !analysisLoading && !error">
  <!-- 空状态内容 -->
</template>
```

### 状态设置逻辑（loadAnalysisData函数）
```javascript
loadingPromise = getTechnicalAnalysis(currentSymbol.value, noCache, marketType)
  .then(data => {
    if (data && (data as any).status !== 'not_found') {
      // 有数据
      analysisData.value = formattedData
      isTokenNotFound.value = false
    } else {
      // 数据未找到
      isTokenNotFound.value = true
      analysisData.value = null
      error.value = null
    }
  })
  .finally(() => {
    loading.value = false
    analysisLoading.value = false
  })
```

## 可能的问题原因

### 1. 状态竞争条件
- `loading`和`analysisLoading`可能在`isTokenNotFound`设置之前就被设置为false
- 导致条件判断时机不对

### 2. 条件判断顺序
- 如果其他条件先匹配，TokenNotFoundView就不会显示
- 特别是空状态条件可能会先匹配

### 3. 异步状态更新
- Vue的响应式更新可能存在时序问题
- 多个状态同时更新时可能出现中间状态

## 调试方法

### 1. 添加调试信息
已在代码中添加调试信息：
```javascript
console.log('设置 isTokenNotFound = true, loading =', loading.value, 'analysisLoading =', analysisLoading.value)
```

### 2. 模板调试
在模板中添加状态显示：
```vue
<div class="mb-4 p-2 bg-red-500/20 rounded text-xs text-red-300">
  DEBUG: isTokenNotFound={{ isTokenNotFound }}, loading={{ loading }}, analysisLoading={{ analysisLoading }}
</div>
```

### 3. 测试页面
创建了`test-token-not-found.html`来模拟各种状态组合。

## 解决方案

### 方案1：调整条件判断顺序
确保TokenNotFoundView的条件在空状态之前：
```vue
<!-- 先检查TokenNotFoundView -->
<template v-else-if="isTokenNotFound && !loading && !analysisLoading">
  <TokenNotFoundView />
</template>

<!-- 再检查空状态 -->
<template v-else-if="!analysisData && !loading && !analysisLoading && !error">
  <!-- 空状态 -->
</template>
```

### 方案2：使用计算属性
创建计算属性来确保状态一致性：
```javascript
const shouldShowTokenNotFound = computed(() => {
  return isTokenNotFound.value && !loading.value && !analysisLoading.value && !analysisData.value
})
```

### 方案3：状态机模式
使用单一状态来管理显示逻辑：
```javascript
const displayState = computed(() => {
  if (loading.value || analysisLoading.value) return 'loading'
  if (analysisData.value) return 'hasData'
  if (isTokenNotFound.value) return 'notFound'
  if (error.value) return 'error'
  return 'empty'
})
```

## 测试步骤

1. 打开浏览器开发者工具
2. 切换到一个不存在的股票符号（如NVDA）
3. 观察控制台输出和页面显示
4. 检查调试信息中的状态值
5. 使用测试页面验证条件逻辑

## 预期结果

修复后，当数据未找到时应该：
1. 控制台显示"loadAnalysisData: XXX 的报告数据未找到"
2. 页面显示TokenNotFoundView组件
3. 调试信息显示正确的状态值
4. 用户可以点击"获取最新数据"按钮

## 注意事项

1. 确保所有状态更新都在正确的时机
2. 避免状态竞争条件
3. 保持条件判断的逻辑清晰
4. 测试各种边界情况
