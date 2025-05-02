'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  ArrowUpCircleIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  HelpCircleIcon,
  SearchIcon,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { getSessionFromCookies } from '@/lib/auth';

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */
interface Props
  extends React.ComponentProps<typeof Sidebar> {
  onLogout?: () => void;
}

export function AppSidebar({ variant, onLogout, ...props }: Props) {
  const pathname    = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard') || pathname === '/';

  // ── dynamic user for footer ────────────────────────────────────────────
  const [user, setUser] = useState({
    name:   'Guest',
    email:  '',
    avatar: '/logo/b2b.png',
  });

  useEffect(() => {
    const sess = getSessionFromCookies();
    if (sess?.user?.email) {
      const email = sess.user.email;
      const name  = email.split('@')[0];
      setUser({ name, email, avatar: '/logo/b2b.png' });
    }
  }, []);

  /* -------------------------------------------------------------------- */
  /* Static nav arrays (Dashboard gets dynamic active flag)               */
  /* -------------------------------------------------------------------- */
  const navMain = [
    {
      title: 'Dashboard',
      url:   '/dashboard',
      icon:  LayoutDashboardIcon,
      isActive: isDashboard,          // ← highlight control
    },
    // other items are commented out for now
  ];

  const navSecondary = [
    { title: 'Settings', url: '#', icon: SettingsIcon },
    { title: 'Get Help', url: '#', icon: HelpCircleIcon },
    { title: 'Search',   url: '#', icon: SearchIcon },
  ];

  /* -------------------------------------------------------------------- */
  /* JSX                                                                  */
  /* -------------------------------------------------------------------- */
  return (
    <Sidebar collapsible="offcanvas" variant={variant} {...props}>
      {/* ── Brand ─────────────────────────────────────────────────────── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">HOUSS.co.za</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <SidebarContent>
        <NavMain items={navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      {/* ── Footer user block ─────────────────────────────────────────── */}
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  );
}
