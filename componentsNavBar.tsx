import React from 'react';
import Link from 'next/link';

interface NavBarProps {
  current: '539' | 'f5' | 'marksix';
}

export default function NavBar({ current }: NavBarProps) {
  const routes = [
    {
      key: '539',
      title: '今彩539',
      schedule: '每週一至六 20:30',
      href: '/539',
    },
    {
      key: 'f5',
      title: '加州天天樂',
      schedule: '每日 09:30',
      href: '/f5',
    },
    {
      key: 'marksix',
      title: '六合彩',
      schedule: '二四六 21:30',
      href: '/marksix',
    },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-[#074a3a] border-b border-white/10 shadow-md">
      <div className="max-w-2xl mx-auto px-2 flex items-center justify-between h-14">
        {routes.map((r) => {
          const isActive = current === r.key;
          return (
            <Link
              key={r.key}
              href={r.href}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 mx-1 rounded-lg transition-all touch-manipulation active:scale-95 ${
                isActive
                  ? 'bg-white/15 text-white font-bold shadow-inner'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
              style={{ textDecoration: 'none' }}
            >
              <span className="text-xs sm:text-sm tracking-wide">{r.title}</span>
              <span className="text-[10px] text-emerald-200/80 scale-90 leading-tight">
                {r.schedule}
              </span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}