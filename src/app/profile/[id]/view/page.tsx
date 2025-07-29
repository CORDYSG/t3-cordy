/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import PublicProfileCard from "@/app/_components/ProfilePage/PublicProfileCard";
import { api } from "@/trpc/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `User Profile - ${id}`,
    openGraph: {
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/og/profile/${id}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

const ProfilePublicView = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  let user;
  try {
    user = await api.user.getUserViewById({ userId: id });
  } catch (err: any) {
    if (err?.data?.code === "NOT_FOUND") {
      console.log("User not found");
    }
    return notFound();
  }

  return (
    <div>
      <PublicProfileCard user={user ?? null} />
    </div>
  );
};

export default ProfilePublicView;
