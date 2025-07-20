import { NextRequest, NextResponse } from "next/server"
import { analyzeContentQuality } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content } = body
    
    if (!title || !content || typeof title !== "string" || typeof content !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "标题和内容不能为空",
        },
        { status: 400 }
      )
    }
    
    // 分析内容质量
    const result = await analyzeContentQuality(title, content)
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "内容分析失败",
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
    console.error("AI content analysis error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "内容分析失败",
      },
      { status: 500 }
    )
  }
}
