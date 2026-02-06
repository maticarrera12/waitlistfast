"use client";
import { useQueryClient } from "@tanstack/react-query";
import { ZapIcon, Logout01Icon, Shield01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminRoleQuery } from "@/hooks/useAdminRoleQuery";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";


export default function UserMenu() {
  const { data: session } = useSessionQuery();
  const { data: adminData } = useAdminRoleQuery(!!session?.user);
  const queryClient = useQueryClient();
  const router = useRouter();

  if (!session?.user) return null;
  const isAdmin = adminData?.isAdmin ?? false;
  const userPlan = (session.user as { plan?: string })?.plan || "FREE";

  const handleSignOut = async () => {
    await authClient.signOut();
    queryClient.clear();
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
          <Avatar className="size-12">
            <AvatarImage src={session.user.image || ""} alt="Profile" />
            <AvatarFallback className="text-xl">
              {session.user.name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="max-w-64 min-w-56" align="end" sideOffset={8}>
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{session.user.name}</span>
          <span className="truncate text-xs font-semibold text-primary">{userPlan} Plan</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings/account/profile">
              <HugeiconsIcon icon={ZapIcon} strokeWidth={2} className="size-4" /> <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <HugeiconsIcon icon={Shield01Icon} strokeWidth={2} className="size-4" /> <span>Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} className="size-4" /> <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
