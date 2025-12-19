import type { Metadata, Viewport } from 'next'
import './globals.css'
import { EmotionProvider } from '@/context/EmotionContext'

// Import handwriting font for journal components
import { Kalam } from 'next/font/google'

const kalam = Kalam({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  display: 'swap',
  variable: '--font-kalam'
})

export const metadata: Metadata = {
  title: 'EmoChild',
  description: 'Your emotional wellness companion',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={kalam.variable}>
        <EmotionProvider>
          {children}
        </EmotionProvider>
      </body>
    </html>
  )
}
