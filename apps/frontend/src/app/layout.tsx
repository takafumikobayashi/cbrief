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
