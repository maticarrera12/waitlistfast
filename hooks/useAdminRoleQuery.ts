import { useQuery } from "@tanstack/react-query";

export function useAdminRoleQuery(enabled = false) {
  return useQuery({
    queryKey: ["adminRole"],
    queryFn: async () => {
      const res = await fetch("/api/admin/check-role");
      if (!res.ok) throw new Error("Failed to verify role");
      return res.json() as Promise<{ isAdmin: boolean }>;
    },
    enabled,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
