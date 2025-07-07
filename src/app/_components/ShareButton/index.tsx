"use client";
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Share2, Link, ClipboardCheck, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import WavingCordyLottie from "../../../../public/lottie/waving_white.json";
import Lottie from "lottie-react";

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
import EventCard from "../EventCard";

type ShareContent = {
  title?: string;
  text?: string;
  opp_airtable_id?: string;
  oppId?: number | bigint;
  titleOnly?: boolean;
  disabled?: boolean;
  opp?: OppWithZoneType;
};

const ShareButton = ({
  title = "Check this out! - Cordy",
  text = "I found an interesting opportunity!",
  oppId,
  opp_airtable_id,
  titleOnly,
  disabled,
  opp,
}: ShareContent) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [sharedUrl, setSharedUrl] = useState<string>("");
  useEffect(() => {
    if (opp_airtable_id) {
      setSharedUrl(`https://app.cordy.sg/opportunities/${opp_airtable_id}`);
    } else {
      setSharedUrl(window.location.href);
    }
  }, []);

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
      {titleOnly ? (
        <DialogTrigger
          className={`btn-brand-white font-brand flex items-center gap-2 px-4 font-black uppercase transition-all duration-200 ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
          disabled={disabled}
        >
          SEND
        </DialogTrigger>
      ) : (
        <DialogTrigger className="-mx-2 cursor-pointer rounded-md p-2 hover:bg-slate-100">
          <Share2 size={24} className="text-gray-400" />
        </DialogTrigger>
      )}

      <DialogContent
        className="flex max-h-[90vh] flex-col items-center overflow-x-hidden border-2 bg-white"
        style={{ boxShadow: "4px 4px 0px 0px rgba(0, 0, 0, 1)" }}
      >
        <div className="w-1/3">
          <Lottie
            animationData={WavingCordyLottie}
            loop={false}
            autoplay={true}
            className="h-full w-full scale-110"
          />
        </div>

        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-center text-2xl">
            Share this opportunity!
          </DialogTitle>
          <div className="flex w-full flex-col gap-4 text-center">
            <p className="mx-auto w-5/6 text-sm text-gray-600 md:text-base">
              Tag your partner-in-crime &mdash; this one&apos;s too good to
              solo.
            </p>
            <div className="w-full scale-95 text-left">
              {opp && <EventCard opp={opp} listView />}
            </div>
            <div className="flex w-full flex-col items-center justify-center gap-4 px-2">
              <div className="flex w-full flex-1/4 items-center gap-2 rounded-lg border border-black bg-gray-50 px-4 py-2">
                <div className="w-full items-center overflow-hidden">
                  <span className="block w-[45vw] truncate text-xs text-gray-700 sm:pr-2 md:max-w-[300px] md:text-sm">
                    {sharedUrl}
                  </span>
                </div>

                <TooltipProvider>
                  <Tooltip open={showTooltip}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className={`ml-auto flex items-center justify-center gap-2 rounded-md border-2 border-black px-3 py-1 text-sm font-semibold uppercase transition-all duration-200 ${
                          copiedLink
                            ? "bg-green-100 text-green-600"
                            : "bg-white text-black hover:bg-gray-200"
                        }`}
                        style={{ minWidth: "70px" }}
                      >
                        <span className="flex flex-row-reverse items-center gap-2">
                          <span className="hidden md:mt-0.5 md:block">
                            {copiedLink ? "Copied" : "Copy"}
                          </span>
                          {copiedLink ? (
                            <ClipboardCheck size={16} />
                          ) : (
                            <Link size={16} />
                          )}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="animate-in fade-in-50 zoom-in-95 bg-dark-muted"
                    >
                      <p>Copied to clipboard!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <p className="text-md text-left font-bold">
                Share via your favorite platform:
              </p>
              <div className="flex gap-4">
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
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default ShareButton;
