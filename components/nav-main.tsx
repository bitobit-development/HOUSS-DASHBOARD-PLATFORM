'use client';

import Link from 'next/link';
import {
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

interface MainItem {
  title:     string;
  url:       string;
  icon?:     LucideIcon;
  isActive?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Main-navigation sidebar section                                             */
/* -------------------------------------------------------------------------- */
export function NavMain({ items }: { items: MainItem[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map(({ title, url, icon: Icon, isActive }) => (
            <SidebarMenuItem key={title}>
              <SidebarMenuButton
                asChild
                tooltip={title}
                isActive={isActive}
                className={cn(
                  'gap-2 duration-200 ease-linear',
                  isActive
                    ? '!bg-black !text-white hover:!bg-neutral-600'
                    : 'hover:bg-muted hover:text-foreground'
                )}
              >
                <Link href={url}>
                  {Icon && <Icon />}
                  <span>{title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
