"use client"

import { ReactNode } from 'react'

interface ChartProps {
  children?: ReactNode
  className?: string
  data?: any[]
  type?: 'line' | 'bar' | 'pie' | 'area'
  width?: number
  height?: number
}

/**
 * 基础图表组件
 * 这是一个占位符组件，在实际项目中应该使用 recharts 或其他图表库
 */
export function Chart({
  children,
  className = '',
  data = [],
  type = 'line',
  width = 400,
  height = 300
}: ChartProps) {
  return (
    <div 
      className={`flex items-center justify-center border rounded-lg bg-muted/50 ${className}`}
      style={{ width, height }}
    >
      <div className="text-center text-muted-foreground">
        <div className="text-lg font-medium mb-2">图表组件</div>
        <div className="text-sm">
          类型: {type} | 数据点: {data.length}
        </div>
        <div className="text-xs mt-2">
          请安装 recharts 或其他图表库来显示实际图表
        </div>
        {children}
      </div>
    </div>
  )
}

// 导出一些常用的图表类型组件
export function LineChart(props: ChartProps) {
  return <Chart {...props} type="line" />
}

export function BarChart(props: ChartProps) {
  return <Chart {...props} type="bar" />
}

export function PieChart(props: ChartProps) {
  return <Chart {...props} type="pie" />
}

export function AreaChart(props: ChartProps) {
  return <Chart {...props} type="area" />
}
