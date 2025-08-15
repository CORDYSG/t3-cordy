"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileOppList from "./ProfileOppList";
import { useEffect, useState, type SetStateAction } from "react";

export default function ProfileTabs() {
  const [activeTab, setActiveTab] = useState("liked");

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      switch (hash) {
        case "#liked-opportunity":
          setActiveTab("liked");
          break;
        case "#saved-opportunity":
          setActiveTab("saved");
          break;
        case "#history":
          setActiveTab("history");
          break;
        default:
          setActiveTab("liked"); // fallback
      }
    };

    handleHashChange(); // initial load
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleTabChange = (value: SetStateAction<string>) => {
    setActiveTab(value);

    // Update URL hash for all tabs
    const hashMap: Record<string, string> = {
      liked: "#liked-opportunity",
      saved: "#saved-opportunity",
      history: "#history",
    };
    window.history.replaceState(null, "", hashMap[value as string]);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="flex w-full items-center gap-2 bg-transparent md:grid md:w-2/5 md:grid-cols-3">
        <TabsTrigger
          value="liked"
          className="data-[state=active]:text-primary data-[state=active]:bg-primary! border-2 border-black bg-white font-bold hover:cursor-pointer hover:bg-slate-100 data-[state=active]:border-2! data-[state=active]:border-black!"
          style={{ boxShadow: "4px 4px 0px 0px rgba(0, 0, 0, 1)" }}
        >
          Liked
        </TabsTrigger>
        <TabsTrigger
          value="saved"
          className="data-[state=active]:text-primary data-[state=active]:bg-primary! border-2 border-black bg-white font-bold hover:cursor-pointer hover:bg-slate-100 data-[state=active]:border-2! data-[state=active]:border-black!"
          style={{ boxShadow: "4px 4px 0px 0px rgba(0, 0, 0, 1)" }}
        >
          Saved
        </TabsTrigger>
        <TabsTrigger
          value="history"
          className="data-[state=active]:text-primary data-[state=active]:bg-primary! border-2 border-black bg-white font-bold hover:cursor-pointer hover:bg-slate-100 data-[state=active]:border-2! data-[state=active]:border-black!"
          style={{ boxShadow: "4px 4px 0px 0px rgba(0, 0, 0, 1)" }}
        >
          History
        </TabsTrigger>
      </TabsList>

      <div className="my-2 w-full border-b-4 border-dashed"></div>

      <TabsContent value="liked">
        <ProfileOppList likedOpps />
      </TabsContent>
      <TabsContent value="saved">
        <ProfileOppList savedOpps />
      </TabsContent>
      <TabsContent value="history">
        <ProfileOppList historyOpps />
      </TabsContent>
    </Tabs>
  );
}
