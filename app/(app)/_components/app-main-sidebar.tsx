"use client";

import {
  // Configuration01Icon,
  DashboardSquare02Icon,
  // AnalyticsUpIcon,
  // LeftToRightListBulletIcon
} from "@hugeicons/core-free-icons";

import AppSidebar, { SidebarSection } from "@/components/ui/app-sidebar";
import { useSessionQuery } from "@/hooks/useSessionQuery";

export default function AppMainSidebar() {
  const { data: session } = useSessionQuery();

  const sidebarSections = [
    {
      label: "Main",
      items: [
        {
          name: "DASHBOARD",
          href: "/dashboard",
          icon: DashboardSquare02Icon,
        },
    //     {
    //       name: "WAITLISTS",
    //       href: "/dashboard/waitlists",
    //       icon: LeftToRightListBulletIcon,
    //     },
    //     {
    //       name: "ANALYTICS",
    //       href: "/dashboard/analytics",
    //       icon: AnalyticsUpIcon,
    //     },
    //   ],
    // },
    // {
    //   label: "Account",
    //   items: [
    //     {
    //       name: "SETTINGS",
    //       href: "/settings/account/profile",
    //       icon: Configuration01Icon,
    //       matchPrefixes: ["/app/settings"],
    //     },
     ],
    },

  ];

  return (
    <AppSidebar
      title="App"
      sections={sidebarSections as SidebarSection[]}
      logoutLabel="Logout"
      topContentHeightClass="h-44"
    />
  );
}
