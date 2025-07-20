"use client"

import { ShareButton } from './share-button'

interface ClientShareButtonProps {
  url: string;
  title: string;
}

export function ClientShareButton({ url, title }: ClientShareButtonProps) {
  return <ShareButton url={url} title={title} />
}

// 同时提供默认导出和命名导出
export default ClientShareButton;