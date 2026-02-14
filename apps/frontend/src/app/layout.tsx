import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Footer } from '@/components/Footer';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'cbrief - コードブリーフ',
  description: 'AI生成コードを非エンジニアにも理解できる業務言語に翻訳',
  icons: {
    icon: 'https://d1mt09hgbl7gpz.cloudfront.net/cbrief/favicon.ico',
  },
  openGraph: {
    title: 'cbrief - コードブリーフ',
    description: 'AI生成コードを非エンジニアにも理解できる業務言語に翻訳',
    url: 'https://cbrief.tariki-code.tokyo',
    siteName: 'cbrief',
    images: [
      {
        url: 'https://d1mt09hgbl7gpz.cloudfront.net/cbrief/cbrief-logo-ogp.png',
        width: 1200,
        height: 630,
        alt: 'cbrief - コードブリーフ',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'cbrief - コードブリーフ',
    description: 'AI生成コードを非エンジニアにも理解できる業務言語に翻訳',
    images: ['https://d1mt09hgbl7gpz.cloudfront.net/cbrief/cbrief-logo-ogp.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Sidebar />
          <div className="flex-grow">{children}</div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
