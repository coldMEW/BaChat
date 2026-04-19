import type { Metadata } from 'next'
import { Geist, Geist_Mono, Lora } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Bachat',
  description: 'Behavioral finance + honest investment signals — your data, your browser.',
  icons: {
    icon: [{ url: '/icon.png', sizes: '480x520', type: 'image/png' }],
    apple: [{ url: '/icon.png', sizes: '480x520', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  )
}
