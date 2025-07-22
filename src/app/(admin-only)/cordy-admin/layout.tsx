import { auth } from "@/server/auth";
import { notFound } from "next/navigation";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  if (session?.user.role !== "CORDY") {
    notFound();
  }

  return <>admin page</>;
};

export default AdminLayout;
