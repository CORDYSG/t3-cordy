"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileOppList from "./ProfileOppList";
import { useEffect, useState, type SetStateAction } from "react";

export default function ProfileTabs() {
  const [activeTab, setActiveTab] = useState("saved");

  useEffect(() => {
    // Check URL hash on component mount and when hash changes
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#liked-opportunity") {
        setActiveTab("liked");
      } else if (hash === "#saved-opportunity") {
        setActiveTab("saved");
      }
    };

    // Set initial tab based on current URL hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const handleTabChange = (value: SetStateAction<string>) => {
    setActiveTab(value);
    // Update URL hash when tab changes
    const newHash =
      value === "liked" ? "#liked-opportunity" : "#saved-opportunity";
    window.history.replaceState(null, "", newHash);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="flex w-full items-center gap-2 bg-transparent md:grid md:w-1/5 md:grid-cols-2">
        <TabsTrigger
          value="saved"
          className="data-[state=active]:text-primary border-2 border-black bg-white font-bold hover:cursor-pointer hover:bg-slate-100 data-[state=active]:bg-white"
          style={{ boxShadow: "4px 4px 0px 0px rgba(0, 0, 0, 1)" }}
        >
          Saved
        </TabsTrigger>
        <TabsTrigger
          value="liked"
          className="data-[state=active]:text-primary border-2 border-black bg-white font-bold hover:cursor-pointer hover:bg-slate-50 data-[state=active]:bg-white"
          style={{ boxShadow: "4px 4px 0px 0px rgba(0, 0, 0, 1)" }}
        >
          Liked
        </TabsTrigger>
      </TabsList>
      <div className="my-2 w-full border-b-4 border-dashed"></div>
      <TabsContent value="saved">
        <ProfileOppList savedOpps />
      </TabsContent>
      <TabsContent value="liked">
        <ProfileOppList likedOpps />
      </TabsContent>
    </Tabs>
  );
}
