// app/dashboard/page.tsx
// -----------------------------------------------------------------------------
// HOUSS Dashboard – status cards, interactive chart, estate-plant grid,
// and live plant status table (each in a Card with responsive padding)
// -----------------------------------------------------------------------------
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import dynamic from 'next/dynamic';

// Hooks & helpers
import { useLogout } from '@/hooks/use-logout';
import { getSessionFromCookies } from '@/lib/auth';
import getPlantCount from '@/lib/api/plant_count';
import getInverterCount from '@/lib/api/inverters_count';

// UI
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StatusSectionCards from '@/components/status-section-cards';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';

// Dynamic-heavy client components
const EstatePlantsTable = dynamic(() => import('@/components/estate_plants_table'), { ssr: false });
const PlantsTable       = dynamic(() => import('@/components/plants-table'),       { ssr: false });
const EstateTotalsCard = dynamic(() => import('@/components/estate_totals_card'), { ssr: false });

export default function DashboardPage() {
  const router  = useRouter();
  const logout  = useLogout(router);
  const [loading, setLoading]   = useState(true);
  const [progress, setProgress] = useState(0);

  // ──────────────────────────────────────────────────────────────────────────
  // Session check + splash loader
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const session = getSessionFromCookies();
    const int     = setInterval(() => setProgress(p => (p < 100 ? p + 10 : p)), 200);

    if (!session) {
      setTimeout(() => router.push('/login'), 800);
    } else {
      setLoading(false);
    }
    return () => clearInterval(int);
  }, [router]);

  // ──────────────────────────────────────────────────────────────────────────
  // Real-time counts (refresh each minute)
  // ──────────────────────────────────────────────────────────────────────────
  const { data: plantSummary } = useSWR('plant-count',    () => getPlantCount().then(r => r.data),    { refreshInterval: 60_000 });
  const { data: inverterSummary } = useSWR('inverter-count', () => getInverterCount().then(r => r.data), { refreshInterval: 60_000 });

  // Splash screen
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Progress value={progress} max={100} className="w-1/2" />
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Main dashboard
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" onLogout={logout} />
      <SidebarInset>
        <SiteHeader />

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

              {/* Summary pies */}
              <StatusSectionCards plantSummary={plantSummary} inverterSummary={inverterSummary} />

              {/* Interactive area chart */}
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              
              <div className="px-4 lg:px-6">
                {/* Estate totals card */}
                <EstateTotalsCard />
              </div>

              {/* Estate × Plant grid */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Estate overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EstatePlantsTable />
                  </CardContent>
                </Card>
              </div>

              {/* Live plant status table */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Live plant status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PlantsTable />
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
