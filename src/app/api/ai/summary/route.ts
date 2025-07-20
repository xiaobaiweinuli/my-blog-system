import { NextRequest, NextResponse } from "next/server"
import { generateSummary } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, options } = body
    
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "内容不能为空",
        },
        { status: 400 }
      )
    }
    
    // 生成摘要
    const result = await generateSummary(content, options)
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "摘要生成失败",
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      usage: result.usage,
    })
  } catch (error) {
    console.error("AI summary generation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "摘要生成失败",
      },
      { status: 500 }
    )
  }
}
