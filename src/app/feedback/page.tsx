"use client";

import FeedbackForm from "./../_components/Feedback/FeedbackForm";
import { useSession } from "next-auth/react";

export default function ReportPage() {
  const session = useSession();

  return (
    <main className="p-8 text-center">
      {!session.data?.user && (
        <div className="bg-red-300 p-2 font-medium text-black">
          Please login to submit a report.
        </div>
      )}
      <FeedbackForm />
    </main>
  );
}
