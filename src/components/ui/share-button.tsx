"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

// 平台配置（保持不变）
const platforms = [
  {
    name: "微博",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M21.6 8.2c-.4-1.2-1.5-2-2.7-1.7-.4.1-.7-.2-.6-.6.3-1.2-.1-2.5-1.1-3.3-1.1-.9-2.7-.8-3.7.2-.3.3-.7.3-.9 0-.7-.8-1.8-1.1-2.8-.7-1.1.4-1.7 1.6-1.3 2.7.1.4-.2.7-.6.6-1.2-.3-2.5.1-3.3 1.1-.9 1.1-.8 2.7.2 3.7.3.3.3.7 0 .9-.8.7-1.1 1.8-.7 2.8.4 1.1 1.6 1.7 2.7 1.3.4-.1.7.2.6.6-.3 1.2.1 2.5 1.1 3.3 1.1.9 2.7.8 3.7-.2.3-.3.7-.3.9 0 .7.8 1.8 1.1 2.8.7 1.1-.4 1.7-1.6 1.3-2.7-.1-.4.2-.7.6-.6 1.2.3 2.5-.1 3.3-1.1.9-1.1.8-2.7-.2-3.7-.3-.3-.3-.7 0-.9.8-.7 1.1-1.8.7-2.8z"></path></svg>
    ),
    getUrl: (title: string, url: string) => `https://service.weibo.com/share/share.php?title=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: "微信",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><circle cx="12" cy="12" r="10" /></svg>
    ),
    getUrl: null, // 只复制
  },
  {
    name: "Telegram",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M9.04 16.62l-.39 3.47c.56 0 .8-.24 1.09-.53l2.62-2.5 5.44 3.98c1 .55 1.72.26 1.97-.92l3.58-16.77c.32-1.48-.54-2.06-1.5-1.7L2.2 9.47c-1.45.56-1.43 1.36-.25 1.72l4.6 1.44 10.7-6.74c.5-.32.96-.14.58.18z"></path></svg>
    ),
    getUrl: (title: string, url: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: "Twitter",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M22.46 5.94c-.77.35-1.6.59-2.47.7a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04A4.28 4.28 0 0 0 16.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.11.99C7.69 9.13 4.07 7.38 1.64 4.7c-.37.64-.58 1.38-.58 2.17 0 1.5.76 2.82 1.92 3.6-.7-.02-1.36-.21-1.94-.53v.05c0 2.1 1.5 3.85 3.5 4.25-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.68 2.1 2.9 3.95 2.93A8.6 8.6 0 0 1 2 19.54c-.29 0-.57-.02-.85-.05A12.13 12.13 0 0 0 8.29 21.5c7.55 0 11.69-6.26 11.69-11.69 0-.18-.01-.36-.02-.54.8-.58 1.5-1.3 2.05-2.13z"></path></svg>
    ),
    getUrl: (title: string, url: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
];

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const [showQr, setShowQr] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null); // 分享按钮的 ref
  const popupRef = useRef<HTMLDivElement>(null);     // 弹窗容器的 ref
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  // 点击“分享”按钮：计算位置并打开弹窗
  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // 阻止事件冒泡（避免触发外部点击关闭）
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setOpen(true);
      setButtonRect(rect); // 记录按钮位置，用于弹窗定位
    }
  };

  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  // 点击平台：复制链接 + 打开对应平台
  const handleShare = async (platform: any) => {
    await navigator.clipboard.writeText(`${title} ${url}`);
    setCopied(platform.name);
    setTimeout(() => setCopied(""), 1500); // 短暂显示“已复制”

    if (platform.getUrl) {
      window.open(platform.getUrl(title, url), "_blank"); // 打开第三方平台
    } else if (platform.name === "微信") {
      setShowQr(true); // 切换到微信二维码
    }
  };

  // 计算并设置弹窗位置（absolute 方案）
  const updatePopupPosition = () => {
    if (!buttonRef.current || !popupRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    // 取按钮的 offsetParent 作为参照物
    const parentRect = buttonRef.current.offsetParent?.getBoundingClientRect?.() || { left: 0, top: 0 };
    // 计算相对 offsetParent 的 left/top
    const left = rect.left - parentRect.left;
    const top = rect.bottom - parentRect.top + 8; // 8px gap
    // 弹窗宽度自适应
    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth < 640;
    const maxPopupWidth = isMobile ? Math.min(280, viewportWidth - 32) : 320;
    const popupWidth = Math.min(maxPopupWidth, viewportWidth - 32);
    setPopupStyle({
      left,
      top,
      width: popupWidth,
      position: 'absolute',
      zIndex: 50
    });
  };

  // 弹窗打开时和窗口变化时，实时更新弹窗位置
  useEffect(() => {
    if (open) {
      updatePopupPosition();
      window.addEventListener('scroll', updatePopupPosition);
      window.addEventListener('resize', updatePopupPosition);
      return () => {
        window.removeEventListener('scroll', updatePopupPosition);
        window.removeEventListener('resize', updatePopupPosition);
      };
    }
  }, [open, showQr]);

  // 点击弹窗外部：关闭弹窗
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        open && 
        popupRef.current && 
        !popupRef.current.contains(e.target as Node) && // 点击在弹窗外
        buttonRef.current && 
        !buttonRef.current.contains(e.target as Node)    // 点击不在分享按钮上
      ) {
        setOpen(false);
        setShowQr(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  // 统一图标容器：让图标垂直/水平居中
  const IconWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="w-8 h-8 flex items-center justify-center">
      {children}
    </div>
  );

  return (
    <>
      {/* 分享按钮：绑定 ref 用于定位 */}
      <div style={{ display: 'inline-block', position: 'relative' }}>
        <Button 
          ref={buttonRef}
          variant="outline" 
          size="sm" 
          onClick={handleOpen}
        >
          <Share2 className="w-4 h-4 mr-2" />
          分享
        </Button>
        {/* 分享弹窗：仅在 open 为 true 时渲染 */}
        {open && (
          <div 
            ref={popupRef}
            className="z-50"
            style={popupStyle}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 w-full flex flex-col items-center" 
              onClick={(e) => e.stopPropagation()} // 阻止事件冒泡到 document
            >
              {!showQr ? (
                // 1. 平台选择面板
                <>
                  <div className="text-lg font-bold mb-4">分享到</div>
                  <div className="flex flex-wrap gap-4 justify-center mb-4">
                    {platforms.map(platform => (
                      <button
                        key={platform.name}
                        className="flex flex-col items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                        onClick={() => handleShare(platform)}
                      >
                        <IconWrapper>{platform.icon}</IconWrapper>
                        <span className="mt-1 text-sm">{platform.name}</span>
                        {copied === platform.name && (
                          <span className="text-xs text-green-500 mt-1">已复制</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>
                    取消
                  </Button>
                </>
              ) : (
                // 2. 微信二维码面板
                <>
                  <div className="text-lg font-bold mb-4">微信扫码分享</div>
                  <div className="flex justify-center mb-4">
                    <QRCodeCanvas value={url} size={180} />
                  </div>
                  <div className="text-center text-sm text-gray-500 mb-4">请用微信扫一扫</div>
                  <Button variant="ghost" className="w-full" onClick={() => setShowQr(false)}>
                    返回
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ShareButton;