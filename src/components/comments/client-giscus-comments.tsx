"use client"

import SimpleGiscusComments from './giscus-comments'

export default function ClientGiscusComments({
  mapping = "pathname",
  term,
}: {
  mapping?: "pathname" | "url" | "title" | "og:title" | "specific" | "number"
  term?: string
}) {
  return <SimpleGiscusComments mapping={mapping} term={term} />
}