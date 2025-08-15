"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FlagIcon } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
interface Opportunity {
  id: number;
  name: string;
  airtable_id?: string;
}

interface ReportModalProps {
  currentOpportunity: Opportunity | null;
  onReportSubmitted: () => void; // Callback to handle the swipe after report
  disabled?: boolean;
  flat?: boolean;
}

const ReportModal = ({
  currentOpportunity,
  onReportSubmitted,
  disabled = false,
  flat = false,
}: ReportModalProps) => {
  type ReportReason =
    | "SPAM"
    | "SCAM"
    | "INAPPROPRIATE"
    | "MISLEADING"
    | "DUPLICATE"
    | "OTHER_REPORT"
    | "";
  const [reportReason, setReportReason] = useState<ReportReason>("");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const reportMutation = api.userOpp.createReportOpp.useMutation({
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        toast.error("You must be logged in.");
      }
    },
  }); // Adjust endpoint name as needed

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportReason || !reportDetails || !currentOpportunity) return;

    setIsSubmittingReport(true);

    try {
      // Submit the report
      await reportMutation.mutateAsync({
        oppId: currentOpportunity.id,
        reason: reportReason,
        description: reportDetails,
      });

      // Reset form and close dialog
      setReportReason("");
      setReportDetails("");
      setDialogOpen(false);

      // Notify parent component to handle the swipe
      toast.success("Report has been submitted.");
      onReportSubmitted();
    } catch (error) {
      console.error("Error submitting report:", error);
      // You might want to show an error toast here
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const resetForm = () => {
    setReportReason("");
    setReportDetails("");
  };

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm(); // Reset form when dialog closes
      }}
    >
      {flat ? (
        <DialogTrigger className="-mx-2 cursor-pointer rounded-md p-2 hover:bg-slate-100">
          <FlagIcon size={24} className="text-gray-400" />
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <button
            className={`btn-brand-white flex items-center gap-2 px-4 font-semibold uppercase transition-all duration-200 ${
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            } }`}
            disabled={disabled}
          >
            <span className="sr-only">Report</span>
            <FlagIcon size={24} color="black" />
          </button>
        </DialogTrigger>
      )}

      <DialogContent
        className="shadow-brand rounded-lg border-2 bg-white"
        style={{ boxShadow: "0px 4px 0px 0px rgba(0, 0, 0, 1)" }}
      >
        <DialogHeader>
          <DialogTitle className="font-brand font-bold">
            Report Opportunity
          </DialogTitle>
          <DialogDescription>
            Tell us what&apos;s wrong — we&apos;ll review it as soon as we can.
          </DialogDescription>
        </DialogHeader>

        <h3 className="text-primary font-semibold">
          {currentOpportunity?.name || ""}
        </h3>
        <form onSubmit={handleReportSubmit} className="flex flex-col gap-4">
          <label className="text-sm font-medium">
            Reason
            <select
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value as ReportReason)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="" disabled>
                Select a reason
              </option>
              <option value="SPAM">Spam or irrelevant</option>
              <option value="SCAM">This is a scam</option>
              <option value="INAPPROPRIATE">Inappropriate content</option>
              <option value="MISLEADING">Misleading or false info</option>
              <option value="DUPLICATE">Duplicate listing</option>
              <option value="OTHER_REPORT">Other</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Please let us know more in detail:
            <textarea
              required
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Add any details you'd like to share..."
              className="mt-1 min-h-[100px] w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmittingReport || !reportReason || !reportDetails}
            className="btn-brand-primary self-end px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmittingReport ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;
