"use client";

import { Share2, Link, ClipboardCheck, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  EmailShareButton,
  EmailIcon,
  RedditIcon,
  RedditShareButton,
  WhatsappShareButton,
  WhatsappIcon,
  TelegramShareButton,
  TelegramIcon,
} from "next-share";
import { useState, useEffect } from "react";
import { api } from "@/trpc/react";

type ShareContent = {
  title?: string;
  text?: string;
  url?: string;
  oppId?: number | bigint;
};

const ShareButton = ({
  title = "Check this out! - Cordy",
  text = "I found an interesting opportunity!",
  url,
  oppId,
}: ShareContent) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const sharedUrl = url || window.location.href;

  const updateAction = api.userOpp.updateUserOppMetrics.useMutation();

  useEffect(() => {
    if (copiedLink) {
      setShowTooltip(true);
      const timer = setTimeout(() => {
        setCopiedLink(false);
        setShowTooltip(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedLink]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(sharedUrl);
      setCopiedLink(true);
      updateAction.mutate({
        oppId: oppId ? Number(oppId) : 0,
        guestId: localStorage.getItem("guestId") ?? "",
        action: "SHARE_LINK",
      });
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };
  const handleButtonClick = (type: string) => {
    switch (type) {
      case "telegram":
        updateAction.mutate({
          oppId: oppId ? Number(oppId) : 0,
          guestId: localStorage.getItem("guestId") ?? "",
          action: "SHARE_TELEGRAM",
        });
        break;
      case "email":
        updateAction.mutate({
          oppId: oppId ? Number(oppId) : 0,
          guestId: localStorage.getItem("guestId") ?? "",
          action: "SHARE_EMAIL",
        });
        break;
      case "whatsapp":
        updateAction.mutate({
          oppId: oppId ? Number(oppId) : 0,
          guestId: localStorage.getItem("guestId") ?? "",
          action: "SHARE_WHATSAPP",
        });
        break;
      default:
        console.warn("Unknown share type:", type);
    }
  };

  return (
    <Dialog>
      <DialogTrigger className="-mx-2 cursor-pointer rounded-md p-2 hover:bg-slate-100">
        <Share2 size={24} className="text-gray-400" />
      </DialogTrigger>
      <DialogContent
        className="border-2 bg-white"
        style={{ boxShadow: "4px 4px 0px 0px rgba(0, 0, 0, 1)" }}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Share this opportunity</DialogTitle>
          <div className="flex w-full gap-4">
            <TooltipProvider>
              <Tooltip open={showTooltip}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                      copiedLink
                        ? "scale-110 bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={handleCopyLink}
                    title="Copy link"
                  >
                    <div className="relative">
                      {copiedLink ? (
                        <Check
                          size={16}
                          className="animate-in zoom-in-50 duration-200"
                        />
                      ) : (
                        <Link
                          size={16}
                          className="animate-in zoom-in-50 duration-200"
                        />
                      )}
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="animate-in fade-in-50 zoom-in-95 bg-dark-muted"
                >
                  <p>Link copied!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TelegramShareButton
              url={sharedUrl}
              title={text}
              onClick={() => handleButtonClick("telegram")}
            >
              <TelegramIcon size={32} round />
            </TelegramShareButton>
            <WhatsappShareButton
              url={sharedUrl}
              title={text}
              onClick={() => handleButtonClick("whatsapp")}
            >
              <WhatsappIcon size={32} round />
            </WhatsappShareButton>
            <EmailShareButton
              url={sharedUrl}
              subject={title}
              body={text}
              onClick={() => handleButtonClick("email")}
            >
              <EmailIcon size={32} round />
            </EmailShareButton>

            <RedditShareButton url={sharedUrl} title={title}>
              <RedditIcon size={32} round />
            </RedditShareButton>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default ShareButton;
