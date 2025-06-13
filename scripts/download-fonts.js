#!/usr/bin/env node

/**
 * 下载 Google Fonts 到本地
 * 用于解决 Chrome 扩展的 CSP 限制问题
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

// 创建字体目录
const fontsDir = path.join(__dirname, '../public/fonts')
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true })
}

// Inter 字体的 woff2 文件 URLs (从 Google Fonts CSS 中提取)
const fontUrls = {
  'inter-300.woff2': 'https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2JL7W0Q5n-wU.woff2',
  'inter-400.woff2': 'https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5n-wU.woff2',
  'inter-500.woff2': 'https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa15L7W0Q5n-wU.woff2',
  'inter-600.woff2': 'https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa3pL7W0Q5n-wU.woff2',
  'inter-700.woff2': 'https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2pL7W0Q5n-wU.woff2'
}

// 下载字体文件
async function downloadFont(filename, url) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(fontsDir, filename)
    const file = fs.createWriteStream(filePath)
    
    https.get(url, (response) => {
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        console.log(`✅ 下载完成: ${filename}`)
        resolve()
      })
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}) // 删除不完整的文件
      console.error(`❌ 下载失败: ${filename}`, err.message)
      reject(err)
    })
  })
}

// 生成本地字体 CSS
function generateFontCSS() {
  const css = `
/* Inter Font - Local Version */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url('./fonts/inter-300.woff2') format('woff2');
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('./fonts/inter-400.woff2') format('woff2');
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('./fonts/inter-500.woff2') format('woff2');
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('./fonts/inter-600.woff2') format('woff2');
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('./fonts/inter-700.woff2') format('woff2');
}
`
  
  const cssPath = path.join(__dirname, '../public/fonts/inter.css')
  fs.writeFileSync(cssPath, css.trim())
  console.log('✅ 生成本地字体 CSS: fonts/inter.css')
}

// 主函数
async function main() {
  console.log('🚀 开始下载 Inter 字体文件...')
  
  try {
    // 下载所有字体文件
    for (const [filename, url] of Object.entries(fontUrls)) {
      await downloadFont(filename, url)
    }
    
    // 生成 CSS 文件
    generateFontCSS()
    
    console.log('✅ 所有字体文件下载完成!')
    console.log('📝 请在 index.html 中将 Google Fonts 链接替换为:')
    console.log('   <link rel="stylesheet" href="/fonts/inter.css">')
    
  } catch (error) {
    console.error('❌ 下载过程中出现错误:', error)
    process.exit(1)
  }
}

// 运行脚本
if (require.main === module) {
  main()
}

module.exports = { main }
