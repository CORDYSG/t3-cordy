import { auth } from "@/server/auth";
import ProfileQuestionnaire from "../_components/NewUser/ProfileQuestionnaire";
import LoadingComponent from "../_components/LoadingComponent";
import { redirect } from "next/navigation";
import { api } from "@/trpc/server";
import { Suspense } from "react";

const NewUserPage = async () => {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  // Get user profile - let any errors bubble up naturally
  let userProfile = null;
  try {
    userProfile = await api.user.getUserProfile();
  } catch (error) {
    // Only log non-redirect errors
    console.error("Error fetching user profile:", error);
  }

  // Redirect if user already has a profile
  if (userProfile?.id) {
    redirect("/opportunities/for-you");
  }

  return (
    <div className="my-8 flex min-h-[80vh] w-screen flex-col items-center justify-center py-8">
      <Suspense fallback={<LoadingComponent />}>
        <ProfileQuestionnaire />
      </Suspense>
    </div>
  );
};

export default NewUserPage;
