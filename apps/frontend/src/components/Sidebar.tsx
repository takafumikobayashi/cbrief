'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import {
  FaGithub,
  FaLinkedin,
  FaGlobe,
  FaHome,
  FaBook,
  FaQuestionCircle,
  FaCode,
  FaCog,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    resolvedTheme === 'dark'
      ? 'https://d1mt09hgbl7gpz.cloudfront.net/cbrief/cbrief-logo-dark.png'
      : 'https://d1mt09hgbl7gpz.cloudfront.net/cbrief/cbrief-logo.png';

  const menuItems = [
    { href: '/', label: 'ホーム', icon: FaHome },
    { href: '/docs/usage', label: '使い方', icon: FaBook },
    { href: '/docs/faq', label: 'よくある質問', icon: FaQuestionCircle },
    { href: '/docs/samples', label: 'サンプルコード', icon: FaCode },
    { href: '/docs/api', label: 'API仕様', icon: FaCog },
  ];

  const socialLinks = [
    { href: 'https://tariki-code.tokyo', icon: FaGlobe, label: 'Website' },
    { href: 'https://github.com/takafumikobayashi', icon: FaGithub, label: 'GitHub' },
    { href: 'https://x.com/kobatch_tk', icon: FaXTwitter, label: 'X (Twitter)' },
    { href: 'https://www.linkedin.com/in/tariki-code/', icon: FaLinkedin, label: 'LinkedIn' },
  ];

  return (
    <>
      {/* ハンバーガーメニューボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label="メニュー"
      >
        <svg
          className="w-6 h-6 text-gray-900 dark:text-gray-100"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* サイドバー */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 pt-20 flex-grow">
            <div className="flex items-center gap-3 mb-6">
              {mounted ? (
                <Image
                  src={logoSrc}
                  alt="cbrief logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-md object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-700" aria-hidden />
              )}
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">cbrief</h2>
            </div>
            <nav>
              <ul className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Icon className="text-xl" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* リンクセクション */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <a
              href="https://tariki-code.tokyo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-500 active:text-primary-700 dark:active:text-primary-400 transition-colors"
            >
              <FaGlobe className="text-lg" />
              <span className="font-medium">tariki-code.tokyo</span>
            </a>

            <div className="flex gap-4 justify-center">
              {socialLinks.slice(1).map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-500 active:text-primary-700 dark:active:text-primary-400 transition-colors"
                    aria-label={link.label}
                  >
                    <Icon className="text-2xl" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
