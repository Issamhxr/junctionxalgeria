"use client";

import { useAuth } from "@/contexts/auth-context";
import { DashboardHome } from "@/components/dashboard-home";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Page() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter(); //bkhb

  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     router.push("/login");
  //   }
  // }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <DashboardHome />;
}
