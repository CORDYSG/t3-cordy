import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function Home() {
  // const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (session?.user) {
    // void api.post.getLatest.prefetch();
  }
  redirect("/opportunities/for-you");
  return (
    <HydrateClient>
      {/* <Navbar session={session} /> */}
      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <Image
          src="https://images.ctfassets.net/ayry21z1dzn2/3PwwkABVqMG5SkuSMTCA19/f63c3b883bf2198314e43bd9aa91dfc9/CORDY_Face.svg"
          width={100} // Replace 100 with the desired numeric width
          height={100}
          alt="CORDY"
          className="aspect-square w-full max-w-56 rounded-md"
        />
      </div>
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
