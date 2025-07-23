import { auth } from "@/server/auth";
import { notFound } from "next/navigation";

import { AdminSidebar } from "@/app/_components/AdminCharts/AdminAppSidebar";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  if (session?.user.role !== "CORDY") {
    notFound();
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminSidebar />

      {/* Main Content */}
      <main className="w-full flex-1 p-2 md:p-8">{children}</main>
    </div>
  );
};

export default AdminLayout;
