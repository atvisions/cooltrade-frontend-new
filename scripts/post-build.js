import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const distDir = path.resolve(__dirname, '../dist')
const manifestPath = path.join(distDir, 'manifest.json')

console.log('🔧 开始后处理构建文件...')

// 读取 manifest.json
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

// 读取构建后的 index.html
const indexPath = path.join(distDir, 'index.html')
let indexContent = fs.readFileSync(indexPath, 'utf8')

// 提取 CSS 和 JS 文件名
const cssMatch = indexContent.match(/href="([^"]*\.css)"/g)
const jsMatch = indexContent.match(/src="([^"]*\.js)"/g)

if (cssMatch) {
  console.log('📄 找到 CSS 文件:', cssMatch)
}

if (jsMatch) {
  console.log('📄 找到 JS 文件:', jsMatch)
}

// 更新 manifest.json 中的 CSP 以允许内联样式
manifest.content_security_policy = {
  extension_pages: "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline';"
}

// 写回 manifest.json
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

console.log('✅ 后处理完成!')
console.log('📦 Chrome 插件文件已准备就绪，位于 dist/ 目录')
console.log('🚀 运行 npm run package 来创建 .zip 文件')
