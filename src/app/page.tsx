import Link from "next/link";

import { LatestPost } from "@/app/_components/post";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import Navbar from "./_components/Navbar";
import { redirect } from "next/navigation";

export default async function Home() {
  // const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (session?.user) {
    // void api.post.getLatest.prefetch();
  }
  redirect("/opportunities");
  return (
    <HydrateClient>
      {/* <Navbar session={session} /> */}
      <div></div>
    </HydrateClient>
  );
}
// {hello ? hello.greeting : "Loading tRPC query..."}
// </p>

// <div className="flex flex-col items-center justify-center gap-4">
//   <p className="text-center text-2xl text-white">
//     {session && <span>Logged in as {session.user?.name}</span>}
//   </p>
//   <Link
//     href={session ? "/api/auth/signout" : "/api/auth/signin"}
//     className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
//   >
//     {session ? "Sign out" : "Sign in"}
//   </Link>
// </div>
// </div>

// {session?.user && <LatestPost />}
