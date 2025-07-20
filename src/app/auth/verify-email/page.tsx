"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading"|"success"|"error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const code = searchParams.get("code") || searchParams.get("token")
    //console.log('[verify-email] code/token:', code)
    if (!code) {
      setStatus("error")
      setMessage("无效的认证链接")
      return
    }
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email?token=${code}`
    //console.log('[verify-email] 请求地址:', url)
    fetch(url)
      .then(res => res.json())
      .then(async data => {
       // console.log('[verify-email] 响应内容:', data)
        if (data.success) {
          setStatus("success")
          setMessage("邮箱验证成功，正在自动登录…")
          if (data.token && data.data) {
            localStorage.setItem("token", data.token)
            localStorage.setItem("userInfo", JSON.stringify(data.data))
            //console.log('[verify-email] 自动登录，已存储 token 和 userInfo，跳转首页')
            setTimeout(() => router.push("/"), 1200)
            return
          }
          if (data.data && data.data.username && data.data.password) {
            await signIn("credentials", {
              username: data.data.username,
              password: data.data.password,
              redirect: false,
            })
            //console.log('[verify-email] 自动 signIn，跳转首页')
            setTimeout(() => router.push("/"), 1200)
            return
          }
          setTimeout(() => router.push("/"), 1200)
        } else {
          setStatus("error")
          setMessage(data.error || "邮箱验证失败")
        }
      })
      .catch((err) => {
        console.error('[verify-email] 捕获异常:', err)
        setStatus("error")
        setMessage("网络错误")
      })
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <div>正在验证邮箱，请稍候…</div>
          </div>
        )}
        {status !== "loading" && (
          <Alert variant={status === "success" ? "default" : "destructive"}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
} 