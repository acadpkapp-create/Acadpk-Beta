'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function AppShell({ 
  children, 
  academyName = 'AcadPK Portal', 
  instituteType = 'School / College', 
  userName = 'Administrator', 
  userEmail = '' 
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: institute } = await supabase
          .from('institutes')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (institute) {
          const alerts = [];

          const { count: unpaidCount } = await supabase
            .from('students')
            .select('id, full_name', { count: 'exact' })
            .eq('institute_id', institute.id)
            .neq('fee_status', 'Paid');

          if (unpaidCount && unpaidCount > 0) {
            alerts.push({
              id: 'fee-warning',
              title: 'Pending Fee Collections',
              desc: `${unpaidCount} student${unpaidCount > 1 ? 's have' : ' has'} pending fees.`,
              time: 'Action Required',
              unread: true,
              link: '/fees',
            });
          }

          setNotifications(alerts);
          setUnreadCount(alerts.filter(a => a.unread).length);
        }
      }
    }

    fetchNotifications();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function handleMarkAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    setUnreadCount(0);
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setShowSearchDropdown(true);
      const supabase = createClient();

      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, class_name')
        .ilike('full_name', `%${searchQuery}%`)
        .limit(4);

      setSearchResults(students || []);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const displayTitle = academyName !== 'AcadPK Portal' ? academyName : userName;
  const userInitial = displayTitle ? displayTitle[0].toUpperCase() : 'A';
  const badgeLabel = instituteType ? instituteType.split(' ')[0].toUpperCase() : 'SCHOOL';

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      name: 'Students & Classes',
      href: '/students',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-5.25 6.557c0 1.58 1.108 2.923 2.625 3.239.38.08.77.126 1.125.132" />
        </svg>
      ),
    },
    {
      name: 'Attendance',
      href: '/attendance',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
        </svg>
      ),
    },
    {
      name: 'Fees',
      href: '/fees',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5zM3 10.5h18" />
        </svg>
      ),
    },
    {
      name: 'Staff',
      href: '/staff',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const bottomNavItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      name: 'Students',
      href: '/students',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-5.25 6.557c0 1.58 1.108 2.923 2.625 3.239.38.08.77.126 1.125.132" />
        </svg>
      ),
    },
    {
      name: 'Fees',
      href: '/fees',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5zM3 10.5h18" />
        </svg>
      ),
    },
    {
      name: 'Staff',
      href: '/staff',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#f7f9fb] text-slate-900 font-sans antialiased pb-16 lg:pb-0">
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 lg:static ${
          sidebarCollapsed ? 'lg:w-[84px]' : 'lg:w-[280px]'
        } ${mobileMenuOpen ? 'translate-x-0 w-[280px] shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div>
          <div className={`h-[76px] px-4 border-b border-slate-100 flex items-center ${
            sidebarCollapsed && !mobileMenuOpen ? 'justify-center' : 'justify-between'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  sidebarCollapsed ? 'cursor-pointer hover:opacity-90' : ''
                }`}
              >
                <Image
                  src="/logo.png"
                  alt="AcadPK Logo"
                  width={36}
                  height={36}
                  className="object-contain"
                  priority
                />
              </button>

              {(!sidebarCollapsed || mobileMenuOpen) && (
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <h1 className="font-bold text-xl text-[#006c4d] leading-none tracking-tight">AcadPK</h1>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-[#006c4d] border border-emerald-200/80 px-2 py-0.5 rounded-full shrink-0">
                      {badgeLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-1 truncate">Management Portal</p>
                </div>
              )}
            </div>

            {(!sidebarCollapsed || mobileMenuOpen) && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h16" />
                </svg>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="p-3.5 space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium text-base transition-all ${
                    isActive
                      ? 'bg-[#eceef0] text-[#006c4d] font-bold border-r-4 border-[#006c4d]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={isActive ? 'text-[#006c4d]' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  {(!sidebarCollapsed || mobileMenuOpen) && (
                    <span className="truncate leading-tight">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {(!sidebarCollapsed || mobileMenuOpen) && (
          <div className="p-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span className="truncate font-medium">{academyName}</span>
            <span className="text-[10px] uppercase font-bold bg-emerald-50 text-[#006c4d] px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
              {badgeLabel}
            </span>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <header className="h-[76px] sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/70 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="relative flex-1">
              <div className="flex items-center bg-[#eceef0] rounded-full px-4 py-2.5 w-full focus-within:ring-2 focus-within:ring-[#006c4d]/30 transition-all">
                <svg className="w-5 h-5 text-slate-400 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students, classes..."
                  className="bg-transparent border-none outline-none w-full text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 max-h-60 overflow-y-auto">
                  {searching ? (
                    <div className="p-3 text-xs text-slate-400 text-center">Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">No students found</div>
                  ) : (
                    searchResults.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          router.push('/students');
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between text-xs cursor-pointer"
                      >
                        <span className="font-semibold text-slate-800">{st.full_name}</span>
                        <span className="text-slate-400">{st.class_name || 'Student'}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative text-slate-500 hover:text-[#006c4d] p-2.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 text-xs">
                    <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">Notifications</h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-[#006c4d] font-semibold hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-slate-400">
                          All caught up! No new notifications.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setNotificationsOpen(false);
                              if (n.link) router.push(n.link);
                            }}
                            className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                              n.unread ? 'bg-emerald-50/30' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-slate-800">{n.title}</span>
                              <span className="text-[10px] text-slate-400">{n.time}</span>
                            </div>
                            <p className="text-slate-500 leading-snug">{n.desc}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link href="/settings" className="text-slate-500 hover:text-[#006c4d] p-2.5 rounded-full hover:bg-slate-100 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[#004b30] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                  {userInitial}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-tight truncate max-w-[140px]">
                    {academyName}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium leading-tight mt-0.5">Administrator</p>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform hidden md:block ${
                    profileMenuOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-xs">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-bold text-slate-900 text-sm truncate">{academyName}</p>
                      <p className="text-slate-400 text-xs truncate mt-0.5">{userEmail}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Profile Settings</span>
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>Institute Settings</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-600 hover:bg-rose-50 font-semibold transition-colors cursor-pointer text-left"
                      >
                        <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile / hidden on md+) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/80 px-2 py-2 flex items-center justify-around shadow-lg">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-[#006c4d] font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span className={isActive ? 'text-[#006c4d]' : 'text-slate-400'}>
                {item.icon}
              </span>
              <span className="text-[10px] mt-1 font-medium tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}