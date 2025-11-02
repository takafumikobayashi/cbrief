import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';

interface PageProps {
  params: {
    slug: string;
  };
}

// 利用可能なドキュメントのリスト
const availableDocs = ['usage', 'faq', 'samples', 'api'];

export async function generateStaticParams() {
  return availableDocs.map((slug) => ({
    slug,
  }));
}

async function getDocContent(slug: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'docs', `${slug}.md`);
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Failed to read doc: ${slug}`, error);
    return null;
  }
}

export default async function DocsPage({ params }: PageProps) {
  const content = await getDocContent(params.slug);

  if (!content) {
    notFound();
  }

  return (
    <main className="p-8 dark:bg-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← ホームに戻る
          </Link>
          <ThemeToggle />
        </header>

        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <MarkdownViewer content={content} />
        </article>
      </div>
    </main>
  );
}
