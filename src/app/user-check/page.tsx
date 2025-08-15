"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";

export default function AfterLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from"); // page user tried to visit
  const { data: session, status } = useSession();

  const userCheck = api.user.getUserProfile.useQuery(undefined, {
    enabled: status === "authenticated" && !!session?.user,
  });

  useEffect(() => {
    if (status === "authenticated" && userCheck.status === "success") {
      if (userCheck.data?.id) {
        router.replace(from ?? "/opportunities/for-you");
      } else {
        router.replace("/new-user");
      }
    }

    if (status === "unauthenticated") {
      router.replace("/auth/signin");
    }
  }, [status, userCheck.status, userCheck.data, router, from]);

  return null;
}
