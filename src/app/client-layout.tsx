'use client'

import { fal } from "@fal-ai/client"
import { useEffect } from "react"

if (typeof window !== 'undefined') {
  fal.config({
    credentials: process.env.NEXT_PUBLIC_FAL_KEY,
  });
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}