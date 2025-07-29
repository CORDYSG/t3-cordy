/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import PublicProfileCard from "@/app/_components/ProfilePage/PublicProfileCard";
import { api } from "@/trpc/server";
import { notFound } from "next/navigation";

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
