"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";

export default function AfterLogin() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const userCheck = api.user.getUserProfile.useQuery(undefined, {
    enabled: status === "authenticated" && !!session?.user,
  });

  useEffect(() => {
    // Wait for session + tRPC result
    if (status === "authenticated") {
      if (userCheck.status === "success") {
        if (userCheck.data?.id) {
          router.replace("/opportunities/for-you");
        } else {
          router.replace("/new-user");
        }
      }
    }

    // If not logged in, push to login
    if (status === "unauthenticated") {
      router.replace("/auth/signin");
    }
  }, [status, userCheck.status, userCheck.data, router]);

  return null;
}
