'use client'

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface LogoProps {
  size?: LogoSize
  className?: string
  alt?: string
}

const SIZE_MAP: Record<LogoSize, number> = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 40,
  xl: 56,
}

const ROUNDED_MAP: Record<LogoSize, string> = {
  xs: 'rounded-lg',
  sm: 'rounded-xl',
  md: 'rounded-2xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
}

export function Logo({ size = 'md', className, alt = 'DevBug Tracker Logo' }: LogoProps) {
  const dimension = SIZE_MAP[size]
  const roundedClass = ROUNDED_MAP[size]

  return (
    <Image
      src="/logo.webp"
      alt={alt}
      width={dimension}
      height={dimension}
      className={cn(
        'object-contain shrink-0 select-none shadow-sm overflow-hidden',
        roundedClass,
        className
      )}
      priority
    />
  )
}
