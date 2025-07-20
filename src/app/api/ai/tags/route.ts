import { NextRequest, NextResponse } from "next/server"
import { recommendTags } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, options } = body
    
    if (!title || !content || typeof title !== "string" || typeof content !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "标题和内容不能为空",
        },
        { status: 400 }
      )
    }
    
    // 推荐标签
    const result = await recommendTags(title, content, options)
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "标签推荐失败",
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
    console.error("AI tag recommendation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "标签推荐失败",
      },
      { status: 500 }
    )
  }
}
