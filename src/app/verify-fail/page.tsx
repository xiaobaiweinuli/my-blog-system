"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function VerifyFailPage() {
  const router = useRouter()
  useEffect(() => {
    document.title = "邮箱验证失败"
  }, [])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">邮箱验证失败</CardTitle>
          <CardDescription className="text-center">
            很抱歉，您的邮箱验证未能通过。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              验证链接无效、已过期，或已被使用。请重新注册或联系管理员。
            </AlertDescription>
          </Alert>
          <Button className="w-full mt-4" onClick={() => router.push("/auth/signin")}>返回登录</Button>
        </CardContent>
      </Card>
    </div>
  )
} 