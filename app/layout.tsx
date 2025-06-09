
 
import { auth } from '@/auth'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/lib/provider'
import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
const inter = Inter({ subsets: ['latin'] })

 export const metadata: Metadata = {
  title: 'Enterprise Imprest Management',
  description: 'Internal enterprise software for managing imprest and expense transactions',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const session = await auth()
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} p-2`} >
        <SessionProvider session={session} >

        <ThemeProvider attribute="class" defaultTheme="light">
          <Providers>
            {children}
            <footer className="border-t">
              <div className="container flex h-14 items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} Enterprise Imprest Management
                </p>
                <p className="text-sm text-muted-foreground">
                  Built by{' '}
                  <Link
                    href="https://weppdev.tech"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    WeppDev Technologies
                  </Link>
                </p>
              </div>
            </footer>
            <Toaster />
          </Providers>
        </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
