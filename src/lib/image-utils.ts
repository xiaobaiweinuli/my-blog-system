/**
 * 图片工具函数
 * 提供图片处理相关的工具函数
 */

/**
 * 获取图片尺寸
 * @param src 图片地址
 * @returns Promise<{width: number, height: number}>
 */
export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      })
    }
    img.onerror = reject
    img.src = src
  })
}

/**
 * 计算图片宽高比
 * @param width 宽度
 * @param height 高度
 * @returns 宽高比
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height
}

/**
 * 根据宽高比计算高度
 * @param width 宽度
 * @param aspectRatio 宽高比
 * @returns 高度
 */
export function calculateHeight(width: number, aspectRatio: number): number {
  return Math.round(width / aspectRatio)
}

/**
 * 根据宽高比计算宽度
 * @param height 高度
 * @param aspectRatio 宽高比
 * @returns 宽度
 */
export function calculateWidth(height: number, aspectRatio: number): number {
  return Math.round(height * aspectRatio)
}

/**
 * 生成响应式图片 srcSet
 * @param src 原始图片地址
 * @param widths 宽度数组
 * @returns srcSet 字符串
 */
export function generateSrcSet(src: string, widths: number[]): string {
  // 移除扩展名
  const basePath = src.replace(/\.[^/.]+$/, "")
  const extension = src.split('.').pop() || "jpg"
  
  return widths
    .map((width) => `${basePath}-${width}w.${extension} ${width}w`)
    .join(", ")
}

/**
 * 生成响应式图片 sizes 属性
 * @param sizes 尺寸配置
 * @returns sizes 字符串
 */
export function generateSizes(sizes: { breakpoint: string; width: string }[]): string {
  return sizes
    .map(({ breakpoint, width }) => `(max-width: ${breakpoint}) ${width}`)
    .join(", ")
}

/**
 * 生成图片占位符
 * @param width 宽度
 * @param height 高度
 * @param color 颜色
 * @returns SVG 数据 URL
 */
export function generatePlaceholder(
  width: number = 100,
  height: number = 100,
  color: string = "#F3F4F6"
): string {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${color}"/>
      <path d="M${width * 0.4} ${height * 0.4}L${width * 0.6} ${height * 0.6}M${width * 0.6} ${
    height * 0.4
  }L${width * 0.4} ${height * 0.6}" stroke="#9B9BA0" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${btoa(svg.trim())}`
}

/**
 * 检查图片是否存在
 * @param src 图片地址
 * @returns Promise<boolean>
 */
export function checkImageExists(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })
}

/**
 * 获取图片的主色调
 * 注意：此函数需要在浏览器环境中运行
 * @param src 图片地址
 * @returns Promise<string> 十六进制颜色值
 */
export function getImageDominantColor(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("This function can only be run in browser environment"))
      return
    }
    
    const img = new Image()
    img.crossOrigin = "Anonymous"
    
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }
      
      canvas.width = img.width
      canvas.height = img.height
      
      ctx.drawImage(img, 0, 0, img.width, img.height)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      let r = 0
      let g = 0
      let b = 0
      
      // 简单平均法获取主色调
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
      }
      
      const pixelCount = data.length / 4
      r = Math.floor(r / pixelCount)
      g = Math.floor(g / pixelCount)
      b = Math.floor(b / pixelCount)
      
      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
      resolve(hex)
    }
    
    img.onerror = reject
    img.src = src
  })
}

/**
 * 生成模糊数据 URL
 * 注意：此函数需要在浏览器环境中运行
 * @param src 图片地址
 * @param size 尺寸
 * @returns Promise<string> 数据 URL
 */
export function generateBlurDataURL(src: string, size: number = 10): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("This function can only be run in browser environment"))
      return
    }
    
    const img = new Image()
    img.crossOrigin = "Anonymous"
    
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }
      
      // 设置小尺寸的画布
      canvas.width = size
      canvas.height = Math.round((size * img.height) / img.width)
      
      // 绘制缩小的图片
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      // 应用模糊效果
      ctx.filter = "blur(1px)"
      ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height)
      
      // 转换为数据 URL
      const dataURL = canvas.toDataURL("image/jpeg", 0.3)
      resolve(dataURL)
    }
    
    img.onerror = reject
    img.src = src
  })
}
