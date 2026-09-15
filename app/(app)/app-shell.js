'use client';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase-client';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: IconHome },
  { href: '/students', label: 'Students', icon: IconUsers },
  { href: '/attendance', label: 'Attendance', icon: IconCalendar },
  { href: '/fees', label: 'Fees', icon: IconWallet },
];

function IconHome(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUsers(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.5 20c.2-2.3 1.6-4 3.7-4.3" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendar(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
      <path d="m8.5 13.5 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconWallet(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="6.5" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconLogout(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" strokeLinecap="round" />
      <path d="M16 16l4-4-4-4M20 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AppShell({ academyName, userEmail, children }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-gray-100 md:bg-white md:px-4 md:py-6">
        <a href="/dashboard" className="font-display text-xl font-bold text-brand-600 px-2 mb-8">
          AcadPK
        </a>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'text-brand-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-brand-50 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon width={18} height={18} className="relative shrink-0" />
                <span className="relative">{item.label}</span>
              </a>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <IconLogout width={18} height={18} />
          Log out
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 py-4 md:px-8 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <p className="text-xs text-gray-400">{userEmail}</p>
            <p className="font-display font-semibold text-gray-900">{academyName || 'Your academy'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="md:hidden text-sm text-gray-400"
          >
            <IconLogout width={20} height={20} />
          </button>
        </header>

        {/* Page content with transition */}
        <main className="flex-1 px-5 py-6 md:px-8 md:py-8 pb-24 md:pb-8 max-w-3xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 flex justify-around py-2 z-20">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                active ? 'text-brand-600' : 'text-gray-400'
              }`}
            >
              <Icon width={20} height={20} />
              {item.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
