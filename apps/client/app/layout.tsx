import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import { AppShell } from '@/components/layout/app-shell'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-theme',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Prism — Task Manager',
  description:
    'Gerenciador de tarefas moderno com Kanban, arrastar e soltar e temas dinâmicos.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#0b0f19',
  width: 'device-width',
  initialScale: 1,
}

const themeScript = `
(function() {
  try {
    var forced = ['/login', '/register'].indexOf(window.location.pathname) !== -1;
    var t = forced ? 'light' : (localStorage.getItem('prism-theme') || 'light');
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      data-theme="light"
      className={`${inter.variable} ${mono.variable} bg-background`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <div className="app-aura" aria-hidden />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
