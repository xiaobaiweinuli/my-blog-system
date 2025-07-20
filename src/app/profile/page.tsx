import { getCurrentUser } from "@/lib/auth-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MainLayout } from "@/components/layout/main-layout"
import { PageContainer } from "@/components/layout/page-container"
import { formatDate } from "@/lib/utils"

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    return null // 中间件会处理重定向
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">管理员</Badge>
      case 'collaborator':
        return <Badge variant="secondary">协作者</Badge>
      default:
        return <Badge variant="outline">用户</Badge>
    }
  }

  const initials = user.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?'

  return (
    <MainLayout>
      <PageContainer maxWidth="lg">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">个人资料</h1>
            <p className="text-muted-foreground">
              管理您的账户信息和偏好设置
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>
                您的账户基本信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.image || ''} alt={user.name || ''} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{user.name}</h3>
                  <p className="text-muted-foreground">{user.email}</p>
                  {getRoleBadge(user.role)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    用户 ID
                  </label>
                  <p className="font-mono text-sm bg-muted p-2 rounded">
                    {user.id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    角色
                  </label>
                  <p className="capitalize">{user.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>权限信息</CardTitle>
              <CardDescription>
                您在系统中的权限级别
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>查看文章</span>
                  <Badge variant="outline">✓ 允许</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>创建文章</span>
                  <Badge variant={user.role === 'admin' || user.role === 'collaborator' ? 'outline' : 'secondary'}>
                    {user.role === 'admin' || user.role === 'collaborator' ? '✓ 允许' : '✗ 禁止'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>删除文章</span>
                  <Badge variant={user.role === 'admin' ? 'outline' : 'secondary'}>
                    {user.role === 'admin' ? '✓ 允许' : '✗ 禁止'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>文件管理</span>
                  <Badge variant={user.role === 'admin' || user.role === 'collaborator' ? 'outline' : 'secondary'}>
                    {user.role === 'admin' || user.role === 'collaborator' ? '✓ 允许' : '✗ 禁止'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>系统管理</span>
                  <Badge variant={user.role === 'admin' ? 'outline' : 'secondary'}>
                    {user.role === 'admin' ? '✓ 允许' : '✗ 禁止'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </MainLayout>
  )
}
