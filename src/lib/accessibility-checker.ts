/**
 * 无障碍访问性检查工具
 * 提供自动化的无障碍访问性检查功能
 */

export interface AccessibilityIssue {
  type: "error" | "warning" | "info"
  rule: string
  message: string
  element?: HTMLElement
  selector?: string
  impact: "critical" | "serious" | "moderate" | "minor"
}

export interface AccessibilityReport {
  issues: AccessibilityIssue[]
  score: number
  summary: {
    errors: number
    warnings: number
    infos: number
  }
}

class AccessibilityChecker {
  private issues: AccessibilityIssue[] = []

  /**
   * 检查页面的无障碍访问性
   */
  public checkPage(): AccessibilityReport {
    this.issues = []
    
    // 检查各种无障碍访问性规则
    this.checkImages()
    this.checkHeadings()
    this.checkLinks()
    this.checkForms()
    this.checkButtons()
    this.checkColors()
    this.checkKeyboardNavigation()
    this.checkAriaLabels()
    this.checkLandmarks()
    this.checkFocus()

    return this.generateReport()
  }

  /**
   * 检查图片的 alt 属性
   */
  private checkImages() {
    const images = document.querySelectorAll("img")
    
    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute("aria-label")) {
        this.addIssue({
          type: "error",
          rule: "img-alt",
          message: "图片缺少 alt 属性或 aria-label",
          element: img,
          selector: `img:nth-child(${index + 1})`,
          impact: "serious",
        })
      }
      
      if (img.alt && img.alt.length > 125) {
        this.addIssue({
          type: "warning",
          rule: "img-alt-length",
          message: "图片 alt 属性过长（建议不超过125个字符）",
          element: img,
          selector: `img:nth-child(${index + 1})`,
          impact: "minor",
        })
      }
    })
  }

  /**
   * 检查标题层级
   */
  private checkHeadings() {
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    let previousLevel = 0
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1))
      
      // 检查是否跳过了标题层级
      if (level > previousLevel + 1) {
        this.addIssue({
          type: "warning",
          rule: "heading-order",
          message: `标题层级跳跃：从 h${previousLevel} 跳到 h${level}`,
          element: heading as HTMLElement,
          selector: `${heading.tagName.toLowerCase()}:nth-child(${index + 1})`,
          impact: "moderate",
        })
      }
      
      previousLevel = level
    })
    
    // 检查是否有 h1
    const h1Elements = document.querySelectorAll("h1")
    if (h1Elements.length === 0) {
      this.addIssue({
        type: "error",
        rule: "page-has-heading-one",
        message: "页面缺少 h1 标题",
        impact: "serious",
      })
    } else if (h1Elements.length > 1) {
      this.addIssue({
        type: "warning",
        rule: "page-has-heading-one",
        message: "页面有多个 h1 标题",
        impact: "moderate",
      })
    }
  }

  /**
   * 检查链接
   */
  private checkLinks() {
    const links = document.querySelectorAll("a")
    
    links.forEach((link, index) => {
      const text = link.textContent?.trim()
      const ariaLabel = link.getAttribute("aria-label")
      
      if (!text && !ariaLabel) {
        this.addIssue({
          type: "error",
          rule: "link-name",
          message: "链接缺少可访问的名称",
          element: link,
          selector: `a:nth-child(${index + 1})`,
          impact: "serious",
        })
      }
      
      if (text && ["点击这里", "更多", "阅读更多", "链接"].includes(text.toLowerCase())) {
        this.addIssue({
          type: "warning",
          rule: "link-name",
          message: "链接文本不够描述性",
          element: link,
          selector: `a:nth-child(${index + 1})`,
          impact: "moderate",
        })
      }
      
      // 检查外部链接是否有适当的标识
      if (link.hostname && link.hostname !== window.location.hostname) {
        if (!link.getAttribute("aria-label")?.includes("外部链接")) {
          this.addIssue({
            type: "info",
            rule: "external-link",
            message: "外部链接建议添加标识",
            element: link,
            selector: `a:nth-child(${index + 1})`,
            impact: "minor",
          })
        }
      }
    })
  }

  /**
   * 检查表单
   */
  private checkForms() {
    const inputs = document.querySelectorAll("input, textarea, select")
    
    inputs.forEach((input, index) => {
      const label = document.querySelector(`label[for="${input.id}"]`)
      const ariaLabel = input.getAttribute("aria-label")
      const ariaLabelledby = input.getAttribute("aria-labelledby")
      
      if (!label && !ariaLabel && !ariaLabelledby) {
        this.addIssue({
          type: "error",
          rule: "label",
          message: "表单控件缺少标签",
          element: input as HTMLElement,
          selector: `${input.tagName.toLowerCase()}:nth-child(${index + 1})`,
          impact: "critical",
        })
      }
    })
  }

  /**
   * 检查按钮
   */
  private checkButtons() {
    const buttons = document.querySelectorAll("button, input[type='button'], input[type='submit']")
    
    buttons.forEach((button, index) => {
      const text = button.textContent?.trim()
      const ariaLabel = button.getAttribute("aria-label")
      const value = (button as HTMLInputElement).value
      
      if (!text && !ariaLabel && !value) {
        this.addIssue({
          type: "error",
          rule: "button-name",
          message: "按钮缺少可访问的名称",
          element: button as HTMLElement,
          selector: `button:nth-child(${index + 1})`,
          impact: "serious",
        })
      }
    })
  }

  /**
   * 检查颜色对比度（简化版）
   */
  private checkColors() {
    const textElements = document.querySelectorAll("p, span, div, h1, h2, h3, h4, h5, h6, a, button")
    
    textElements.forEach((element) => {
      const styles = window.getComputedStyle(element)
      const fontSize = parseFloat(styles.fontSize)
      const fontWeight = styles.fontWeight
      
      // 简化的对比度检查（实际应用中需要更复杂的算法）
      if (fontSize < 14 || (fontSize < 18 && fontWeight !== "bold")) {
        this.addIssue({
          type: "info",
          rule: "color-contrast",
          message: "建议检查文本颜色对比度",
          element: element as HTMLElement,
          impact: "moderate",
        })
      }
    })
  }

  /**
   * 检查键盘导航
   */
  private checkKeyboardNavigation() {
    const focusableElements = document.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    )
    
    focusableElements.forEach((element, index) => {
      const tabIndex = element.getAttribute("tabindex")
      
      if (tabIndex && parseInt(tabIndex) > 0) {
        this.addIssue({
          type: "warning",
          rule: "tabindex",
          message: "避免使用正数 tabindex",
          element: element as HTMLElement,
          selector: `[tabindex="${tabIndex}"]:nth-child(${index + 1})`,
          impact: "moderate",
        })
      }
    })
  }

  /**
   * 检查 ARIA 标签
   */
  private checkAriaLabels() {
    const elementsWithAriaLabel = document.querySelectorAll("[aria-label]")
    
    elementsWithAriaLabel.forEach((element) => {
      const ariaLabel = element.getAttribute("aria-label")
      
      if (!ariaLabel || ariaLabel.trim().length === 0) {
        this.addIssue({
          type: "warning",
          rule: "aria-label",
          message: "aria-label 属性为空",
          element: element as HTMLElement,
          impact: "moderate",
        })
      }
    })
  }

  /**
   * 检查地标元素
   */
  private checkLandmarks() {
    const main = document.querySelector("main")
    const nav = document.querySelector("nav")
    const header = document.querySelector("header")
    const footer = document.querySelector("footer")
    
    if (!main) {
      this.addIssue({
        type: "warning",
        rule: "landmark-main",
        message: "页面缺少 main 地标元素",
        impact: "moderate",
      })
    }
    
    if (!nav) {
      this.addIssue({
        type: "info",
        rule: "landmark-nav",
        message: "页面缺少 nav 地标元素",
        impact: "minor",
      })
    }
  }

  /**
   * 检查焦点管理
   */
  private checkFocus() {
    const focusableElements = document.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    )
    
    let hasFocusIndicator = true
    
    focusableElements.forEach((element) => {
      const styles = window.getComputedStyle(element, ":focus")
      const outline = styles.outline
      const boxShadow = styles.boxShadow
      
      if (outline === "none" && !boxShadow.includes("inset")) {
        hasFocusIndicator = false
      }
    })
    
    if (!hasFocusIndicator) {
      this.addIssue({
        type: "warning",
        rule: "focus-indicator",
        message: "某些可聚焦元素缺少焦点指示器",
        impact: "serious",
      })
    }
  }

  /**
   * 添加问题
   */
  private addIssue(issue: AccessibilityIssue) {
    this.issues.push(issue)
  }

  /**
   * 生成报告
   */
  private generateReport(): AccessibilityReport {
    const summary = {
      errors: this.issues.filter(issue => issue.type === "error").length,
      warnings: this.issues.filter(issue => issue.type === "warning").length,
      infos: this.issues.filter(issue => issue.type === "info").length,
    }
    
    // 计算分数（简化算法）
    const totalIssues = summary.errors + summary.warnings + summary.infos
    const score = Math.max(0, 100 - (summary.errors * 10 + summary.warnings * 5 + summary.infos * 1))
    
    return {
      issues: this.issues,
      score,
      summary,
    }
  }
}

// 创建全局实例
export const accessibilityChecker = new AccessibilityChecker()

/**
 * 无障碍访问性检查 Hook
 */
export function useAccessibilityChecker() {
  const checkCurrentPage = () => {
    return accessibilityChecker.checkPage()
  }
  
  return {
    checkCurrentPage,
  }
}
