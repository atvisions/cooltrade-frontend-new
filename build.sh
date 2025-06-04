#!/bin/bash

# CoolTrade Chrome Extension Build Script
# 构建并打包 Chrome 扩展

set -e  # 遇到错误时退出

echo "🚀 开始构建 CoolTrade Chrome 扩展..."

# 获取版本号和时间戳
VERSION=$(node -p "require('./package.json').version")
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
FILENAME="cooltrade-extension-v${VERSION}-${TIMESTAMP}.zip"

echo "📦 版本: v${VERSION}"
echo "⏰ 时间戳: ${TIMESTAMP}"
echo "📁 输出文件: ${FILENAME}"

# 清理之前的构建
echo "🧹 清理之前的构建文件..."
rm -rf dist/
rm -f cooltrade-extension*.zip

# 构建项目
echo "🔨 构建项目..."
npm run build:extension

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "❌ 构建失败：dist 目录不存在"
    exit 1
fi

# 创建带版本号的 ZIP 包
echo "📦 创建 ZIP 包..."
cd dist
zip -r "../${FILENAME}" .
cd ..

# 检查 ZIP 文件是否创建成功
if [ -f "${FILENAME}" ]; then
    echo "✅ 构建成功！"
    echo "📁 文件位置: $(pwd)/${FILENAME}"
    echo "📊 文件大小: $(du -h "${FILENAME}" | cut -f1)"
    
    # 显示 ZIP 包内容
    echo "📋 包含文件:"
    unzip -l "${FILENAME}" | tail -n +4 | head -n -2
else
    echo "❌ ZIP 包创建失败"
    exit 1
fi

echo "🎉 构建完成！"
