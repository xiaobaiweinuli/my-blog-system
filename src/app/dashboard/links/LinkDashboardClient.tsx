 "use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/global-auth-context";
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface FriendLink {
  id: string;
  name: string;
  url: string;
  description: string;
  avatar: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function getToken() {
  const cacheStr = localStorage.getItem('global_session_cache');
  let token = '';
  if (cacheStr) {
    try {
      const cache = JSON.parse(cacheStr);
      token = cache?.user?.token || '';
    } catch {}
  }
  return token;
}

export default function LinkDashboardClient() {
  const { session } = useAuth();
  const [links, setLinks] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<{ open: boolean, link: FriendLink | null }>({ open: false, link: null });
  const [addDialog, setAddDialog] = useState(false);
  const [form, setForm] = useState<Partial<FriendLink>>({});
  const [message, setMessage] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });

  const statusMap: Record<string, string> = {
    approved: "已通过",
    pending: "待审核",
    rejected: "已拒绝",
    active: "已启用",
    inactive: "已禁用"
  };

  // 获取友链列表
  const fetchLinks = async () => {
    setLoading(true);
    setError(null);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const token = getToken();
    try {
      const res = await fetch(`${apiBase}/api/friend-links`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) setLinks(data.data || []);
      else setError("加载失败");
    } catch {
      setError("加载失败");
    }
    setLoading(false);
  };

  useEffect(() => { fetchLinks(); }, []);

  // 新增友链
  const handleAdd = async () => {
    setMessage("");
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const token = getToken();
    try {
      const res = await fetch(`${apiBase}/api/friend-links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(form),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setAddDialog(false);
        setForm({});
        fetchLinks();
      } else {
        setMessage("新增失败: " + (data.message || "未知错误"));
      }
    } catch {
      setMessage("新增失败");
    }
  };

  // 编辑友链
  const handleEdit = async () => {
    if (!editDialog.link) return;
    setMessage("");
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const token = getToken();
    try {
      const res = await fetch(`${apiBase}/api/friend-links/${editDialog.link.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(form),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setEditDialog({ open: false, link: null });
        setForm({});
        fetchLinks();
      } else {
        setMessage("编辑失败: " + (data.message || "未知错误"));
      }
    } catch {
      setMessage("编辑失败");
    }
  };

  // 删除友链
  const handleDelete = async (id: string) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const token = getToken();
    try {
      await fetch(`${apiBase}/api/friend-links/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      fetchLinks();
    } catch {}
    setDeleteDialog({ open: false, id: null });
  };

  // 审批友链
  const handleApprove = async (id: string) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const token = getToken();
    try {
      await fetch(`${apiBase}/api/friend-links/${id}/approve`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      fetchLinks();
    } catch {}
  };

  // 状态变更
  const handleStatus = async (id: string, status: string) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const token = getToken();
    try {
      await fetch(`${apiBase}/api/friend-links/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status }),
        credentials: 'include',
      });
      fetchLinks();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">友链管理</h1>
            <Button onClick={() => { setAddDialog(true); setForm({}); }}>新增友链</Button>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm table-auto">
              <thead>
                <tr>
                  <th className="min-w-[100px] text-center">名称</th>
                  <th className="min-w-[180px] text-center">URL</th>
                  <th className="min-w-[160px] text-center">描述</th>
                  <th className="min-w-[60px] text-center">头像</th>
                  <th className="min-w-[80px] text-center">分类</th>
                  <th className="min-w-[80px] text-center">状态</th>
                  <th className="min-w-[120px] text-center">创建时间</th>
                  <th className="min-w-[180px] text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {links.map(link => (
                  <tr key={link.id}>
                    <td className="text-center break-all">{link.name}</td>
                    <td className="text-center break-all">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{link.url}</a>
                    </td>
                    <td className="text-center break-all">{link.description}</td>
                    <td className="text-center">
                      <img
                        src={link.avatar}
                        alt="avatar"
                        className="w-8 h-8 rounded-full border mx-auto"
                        onError={e => {
                          if (e.currentTarget.src.indexOf('default-avatar.png') === -1) {
                            e.currentTarget.src = '/default-avatar.png';
                          } else {
                            e.currentTarget.style.display = 'none';
                          }
                        }}
                      />
                    </td>
                    <td className="text-center break-all">{link.category}</td>
                    <td className="text-center">{statusMap[link.status] || link.status}</td>
                    <td className="text-center">{link.created_at ? new Date(link.created_at).toLocaleString() : ''}</td>
                    <td className="text-center">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <Button size="sm">操作</Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="center" sideOffset={5} className="bg-white rounded shadow w-[72px] p-0 z-50">
                          <DropdownMenu.Item asChild>
                            <button className="block text-left px-2 py-1 hover:bg-gray-100" onClick={() => { setEditDialog({ open: true, link }); setForm(link); }}>编辑</button>
                          </DropdownMenu.Item>
                          <DropdownMenu.Item asChild>
                            <button className="block text-left px-2 py-1 hover:bg-gray-100 text-red-600" onClick={() => setDeleteDialog({ open: true, id: link.id })}>删除</button>
                          </DropdownMenu.Item>
                          <DropdownMenu.Item asChild>
                            <button className="block text-left px-2 py-1 hover:bg-gray-100" onClick={() => handleApprove(link.id)}>审批</button>
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* 新增友链弹窗 */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增友链</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input placeholder="名称" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="URL" value={form.url || ""} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            <Input placeholder="描述" value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Input placeholder="头像URL" value={form.avatar || ""} onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))} />
            <Input placeholder="分类" value={form.category || ""} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            <select
              className="w-full border rounded px-3 py-2"
              value={form.status || ""}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            >
              <option value="">请选择状态</option>
              <option value="approved">已通过</option>
              <option value="pending">待审核</option>
              <option value="rejected">已拒绝</option>
            </select>
            {message && <div className="text-red-500 text-xs">{message}</div>}
          </div>
          <DialogFooter>
            <Button onClick={handleAdd}>提交</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 编辑友链弹窗 */}
      <Dialog open={editDialog.open} onOpenChange={open => setEditDialog({ open, link: open ? editDialog.link : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑友链</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input placeholder="名称" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="URL" value={form.url || ""} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            <Input placeholder="描述" value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Input placeholder="头像URL" value={form.avatar || ""} onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))} />
            <Input placeholder="分类" value={form.category || ""} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            <select
              className="w-full border rounded px-3 py-2"
              value={form.status || ""}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            >
              <option value="">请选择状态</option>
              <option value="approved">已通过</option>
              <option value="pending">待审核</option>
              <option value="rejected">已拒绝</option>
            </select>
            {message && <div className="text-red-500 text-xs">{message}</div>}
          </div>
          <DialogFooter>
            <Button onClick={handleEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog({ open, id: open ? deleteDialog.id : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除该友链？</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={() => deleteDialog.id && handleDelete(deleteDialog.id)}>确认</Button>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, id: null })}>取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
