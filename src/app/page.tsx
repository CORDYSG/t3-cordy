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
