"use client";

import { GhostIcon } from "lucide-react";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const AdminPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Handle session state changes
  useEffect(() => {
    if (status === "unauthenticated" || session?.user?.role != "CORDY") {
      router.push("/api/auth/signin");
      return;
    }
  }, [status, session?.user?.id, router]);

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center gap-4 text-center font-bold">
      <GhostIcon size={72} className="opacity-50" />
      CORDY&apos;S deepest darkest secrets are here...
    </div>
  );
};

export default AdminPage;
