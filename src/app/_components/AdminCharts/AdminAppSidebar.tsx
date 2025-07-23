"use client";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu, ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils"; // optional utility for class merging

const NavLinks = () => (
  <nav className="space-y-4">
    <Link
      href="/cordy-admin/dashboard"
      className="block text-gray-800 hover:text-black"
    >
      Dashboard
    </Link>
    <Link href="/admin/users" className="block text-gray-800 hover:text-black">
      Users
    </Link>
    <Link
      href="/admin/opportunities"
      className="block text-gray-800 hover:text-black"
    >
      Opportunities
    </Link>
  </nav>
);

export const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="relative w-full md:absolute">
        <Sheet>
          <SheetTrigger className="flex w-full justify-center border-b-2 bg-white p-2 pt-8 md:hidden">
            <Menu className="h-6 w-10" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-6">
            <SheetTitle className="mb-8 text-xl font-bold">
              Admin Panel
            </SheetTitle>

            <NavLinks />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden flex-col border-r bg-gray-100 p-6 transition-all duration-300 md:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          {!collapsed && <span className="text-xl font-bold">Admin Panel</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-gray-600 hover:text-black"
          >
            {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
          </button>
        </div>
        {!collapsed && <NavLinks />}
      </aside>
    </>
  );
};
