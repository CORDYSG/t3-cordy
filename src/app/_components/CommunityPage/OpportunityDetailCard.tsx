"use client";
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import React, { useState, useEffect } from "react";
import Image from "next/image";
import EventZone from "../EventZone";
import Link from "next/link";
import { api } from "@/trpc/react";
import { Info, InfoIcon } from "lucide-react";

import { LikeButton } from "../LikeButton";
import { BookmarkButton } from "../BookmarkButton";
import ShareButton from "../ShareButton";
import { useSession } from "next-auth/react";
import LoginPopup from "../LoginModal";

import ReportModal from "../Swipe/ReportModal";
import { useGuest } from "@/contexts/GuestContext";

type Props = {
  opp: OppWithZoneType;
  types: TagType[];
};
const OpportunityDetailCard = ({ opp, types }: Readonly<Props>) => {
  const { data: session } = useSession();
  const [showSwipeLogin, setShowSwipeLogin] = useState(false);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const calculateDaysLeft = (deadline: Date): number => {
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)); // Convert milliseconds to days
  };

  const daysLeft = opp?.deadline ? calculateDaysLeft(opp.deadline) : null;
  const updateAction = api.userOpp.updateUserOppMetrics.useMutation();

  const initialData = api.userOpp.getUserOppMetrics.useQuery(
    {
      oppId: parseFloat(opp.id),
    },
    {
      enabled: !!session?.user?.id,
    },
  );
  const [mockLike, setMockLke] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const { guestId, guestHistory } = useGuest();

  useEffect(() => {
    updateAction.mutate({
      oppId: opp.id,
      guestId: guestId ?? "",
      action: "VIEW",
    });

    if (!session?.user.id) {
      setShowLogin(true);
    }
  }, [opp.id]);

  useEffect(() => {
    if (initialData.data) {
      setMockLke(initialData.data.liked);
      setIsBookmarked(initialData.data.saved);
    }
  }, [initialData.data]);

  const mutation = api.userOpp.createOrUpdate.useMutation();

  const handleLike = () => {
    const currentLikeStatus = !mockLike;
    setMockLke(currentLikeStatus);

    mutation.mutate({
      oppId: opp.id,
      liked: currentLikeStatus,
    });

    updateAction.mutate({
      oppId: opp.id,
      guestId: guestId ?? "",
      action: currentLikeStatus ? "LIKE" : "UNLIKE",
    });
  };

  const handleSave = () => {
    const currentBookmarkStatus = !isBookmarked;
    setIsBookmarked(currentBookmarkStatus);

    mutation.mutate({
      oppId: opp.id,
      saved: currentBookmarkStatus,
    });

    updateAction.mutate({
      oppId: opp.id,
      guestId: guestId ?? "",
      action: currentBookmarkStatus ? "SAVE" : "UNSAVE",
    });
  };

  return (
    <div className="shadow-brand w-full rounded-lg border-2 bg-white p-5 text-black">
      <div className="flex flex-col gap-8 md:flex-row md:items-center">
        <div className="relative min-h-56 w-full rounded-md border-2 md:max-w-[500px]">
          {opp.thumbnail_url && (
            <Image
              src={opp.thumbnail_url}
              width={400}
              height={400}
              blurDataURL={opp.thumbnail_url}
              placeholder="blur"
              alt={opp.name}
              className="absolute inset-0 h-full w-full rounded-md object-cover"
            />
          )}
          {!opp.thumbnail_url && (
            <div className="bg-background absolute inset-0 flex items-center justify-center rounded-lg px-24 py-24">
              <Image
                src={
                  "https://images.ctfassets.net/ayry21z1dzn2/3PwwkABVqMG5SkuSMTCA19/f63c3b883bf2198314e43bd9aa91dfc9/CORDY_Face.svg"
                }
                width={1000}
                height={1000}
                blurDataURL={
                  "https://images.ctfassets.net/ayry21z1dzn2/3PwwkABVqMG5SkuSMTCA19/f63c3b883bf2198314e43bd9aa91dfc9/CORDY_Face.svg"
                }
                placeholder="blur"
                alt="Cordy Face"
                className="object-cover"
              />
            </div>
          )}
        </div>
        <div className="mb-2 space-y-4 md:mb-0">
          <h1
            className="text-4xl font-extrabold text-black"
            style={{
              overflowWrap: "break-word",
              wordBreak: "break-word",
              hyphens: "auto",
            }}
          >
            {opp.name}
          </h1>
          <p
            className="text-lg leading-tight text-black"
            style={{
              overflowWrap: "break-word",
              wordBreak: "break-word",
              hyphens: "auto",
            }}
          >
            {opp.organisation}
          </p>
          <div className="flex flex-wrap gap-2">
            {opp.zones &&
              opp.zones.length > 0 &&
              opp.zones.map((zone: ZoneType) => (
                <EventZone key={zone.id} zone={zone} />
              ))}
          </div>

          <div className="">
            <p className="text-md font-medium">
              {opp.deadline ? formatDate(opp.deadline) : "Forever"}
            </p>
            {daysLeft !== null ? (
              <p className="text-primary text-md font-bold">
                {daysLeft > 0 ? `${daysLeft} days left` : "Deadline has passed"}
              </p>
            ) : (
              <p className="text-sm font-bold text-gray-700">No deadline</p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 mb-8 w-full border-2 border-dashed"></div>
      <div className="space-y-4">
        <h2 className="text-slate hidden text-3xl font-extrabold text-black md:block">
          Details
        </h2>
        <div className="flex w-full gap-2">
          {types.map((type) => (
            <span
              key={type.id}
              className="border-2 px-2 py-1 text-sm font-semibold"
            >
              {type.name}
            </span>
          ))}
        </div>
        <p
          className="w-full text-lg break-words hyphens-auto whitespace-pre-line"
          style={{
            overflowWrap: "break-word",
            wordBreak: "break-word",
            hyphens: "auto",
          }}
        >
          {" "}
          {opp.information}
        </p>
        <div>
          {opp.eligibility && (
            <div className="shadow-brand mt-4 overflow-hidden rounded-lg border-2">
              <h3 className="flex items-center gap-4 border-b-2 bg-slate-200 p-5 text-3xl font-semibold text-black">
                <InfoIcon size={36} />{" "}
                <span className="mt-0.5">Eligibility</span>
              </h3>
              <p
                className="text-md p-5 break-words hyphens-auto whitespace-pre-line"
                style={{
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                  hyphens: "auto",
                }}
              >
                {opp.eligibility}
              </p>
            </div>
          )}
        </div>
        <div className="flex w-full items-center justify-between">
          <ReportModal
            currentOpportunity={opp}
            onReportSubmitted={() => {
              // Optionally handle report submission, e.g., show a toast or update UI
            }}
            flat
          />
          <div className="flex items-center gap-x-8">
            <ShareButton
              opp_airtable_id={opp.airtable_id}
              oppId={opp.id}
              opp={opp}
            />
            <BookmarkButton
              isBookmarked={isBookmarked}
              handleBookmark={handleSave}
            />
            {/* <LikeButton isLiked={mockLike} handleLike={handleLike} /> */}
            <Link
              className=""
              href={opp.url_source}
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="btn-brand-primary">Find out more!</button>
            </Link>
          </div>
        </div>
      </div>
      <LoginPopup
        isLoginModalOpen={showLogin}
        onCloseLoginModal={() => setShowLogin(false)}
        showSwipeLogin={showSwipeLogin}
      />
    </div>
  );
};
export default OpportunityDetailCard;
