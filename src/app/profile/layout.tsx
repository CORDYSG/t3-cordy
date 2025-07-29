import { auth } from "@/server/auth";
import { notFound, redirect } from "next/navigation";

const ProfileLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  if (!session) return null;

  return (
    <main className="container mx-auto flex flex-col items-center justify-center gap-4 p-8 md:w-5/6">
      {children}
    </main>
  );
};

export default ProfileLayout;
