/* eslint-disable */

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { questions, type ProfileData, type Question } from "./questions";
import Input from "../QuestionComponents/Input";
import SelectableInput from "../QuestionComponents/SelectableInput";
import ScrollablePicker from "../QuestionComponents/ScrollablePicker";
import { ChevronLeft, Check, Loader2 } from "lucide-react";
import { TypingText } from "../TypingText";
import { motion } from "framer-motion";
import SubmitAnimation from "../SubmitCheckAnimation/SubmitCheckAnimation";
import { useRouter } from "next/navigation";

import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";

const initialProfile: ProfileData = {
  interests: [],
  goals: [],
};

// Helper function to get API query hook
const getApiQuery = (queryString: string) => {
  const queryParts = queryString.split(".");

  if (queryParts.length === 2) {
    const [namespace, method] = queryParts;

    if (typeof namespace !== "string" || !namespace) {
      throw new Error(`Invalid namespace: ${namespace}`);
    }

    if (typeof method !== "string" || !method) {
      throw new Error(`Invalid method: ${method}`);
    }

    // Dynamically access the API method
    const apiNamespace = (api as any)[namespace as string];
    if (!apiNamespace) {
      throw new Error(`Unknown API namespace: ${namespace}`);
    }

    const apiMethod = apiNamespace[method];
    if (!apiMethod || typeof apiMethod.useQuery !== "function") {
      throw new Error(`Unknown API method: ${namespace}.${method}`);
    }

    return apiMethod;
  }

  throw new Error(
    `Invalid query format: ${queryString}. Expected format: "namespace.method"`,
  );
};

// Registry of all possible dynamic queries
// Add all your possible queries here to maintain stable hook order
const QUERY_REGISTRY = {
  "zone.getZonesForOptions": () => api.zone?.getZonesForOptions?.useQuery,
  // Add more queries as needed:
  // 'user.getAllUsers': () => api.user?.getAllUsers?.useQuery,
  // 'category.getAllCategories': () => api.category?.getAllCategories?.useQuery,
} as const;

// Custom hook that always calls the same hooks in the same order
const useQuestionData = (currentQuestion: Question | undefined) => {
  const shouldRunQuery =
    currentQuestion?.optionQuery && !currentQuestion?.options;

  // Always call ALL possible queries but conditionally enable them
  // This ensures hooks are called in the same order every time
  const queries = Object.entries(QUERY_REGISTRY).reduce(
    (acc, [key, getHook]) => {
      const hook = getHook();
      if (hook) {
        acc[key] = hook(undefined, {
          enabled: Boolean(
            shouldRunQuery && currentQuestion?.optionQuery === key,
          ),
        });
      } else {
        acc[key] = { data: null, isLoading: false, error: null };
      }
      return acc;
    },
    {} as Record<string, any>,
  );

  // Return the appropriate query based on the current question
  if (currentQuestion?.optionQuery && queries[currentQuestion.optionQuery]) {
    return queries[currentQuestion.optionQuery];
  }

  // Default return for when no query is needed or query not found
  return { data: null, isLoading: false, error: null };
};

const ProfileQuestionnaire: React.FC = () => {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData>(initialProfile);
  const [step, setStep] = useState(0);
  const [typingDone, setTypingDone] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    setTypingDone(false); // Reset when question changes
    setShowOptions(false);
  }, [step]);

  const updateProfileData = useCallback((updates: Partial<ProfileData>) => {
    setProfileData((prev) => ({ ...prev, ...updates }));
  }, []);

  const createUserProfileMutation = api.user.createUserProfile.useMutation({
    onSuccess: (data) => {
      setIsCompleted(true);
      setIsSubmitting(false);
    },
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        return router.push("/api/auth/signin"); // Or wherever your login page is
      }
      console.error("Error creating profile:", error);
      alert("Failed to submit profile. Please try again.");
      setIsSubmitting(false);
    },
  });

  const visibleQuestions = questions.filter((q) =>
    q.show ? q.show(profileData) : true,
  );

  const currentQuestion = visibleQuestions[step];

  // Always call the dynamic query hook, but conditionally enable it
  const dynamicQuery = useQuestionData(currentQuestion);

  const handleNext = () => {
    if (step < visibleQuestions.length - 1) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 20, behavior: "smooth" });
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    const prevQuestion = visibleQuestions[step - 1];
    if (step > 0 && !prevQuestion?.preventBack) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);

    createUserProfileMutation.mutate({
      ageRange: profileData.ageRange!,
      goals: profileData.goals!,
      goalsOther: profileData.goalsOther,
      hearAboutSource: profileData.hearAboutSource!,
      hearAboutOther: profileData.hearAboutOther,
      interests: profileData.interests!,
      interestsOther: profileData.interestsOther,
      isStudent: profileData.isStudent!,
      schoolName: profileData.schoolName,
      schoolType: profileData.schoolType!,
    });
  };

  // Get options from either static options or dynamic query
  const getQuestionOptions = () => {
    if (currentQuestion?.options) {
      return currentQuestion.options;
    }

    if (dynamicQuery?.data) {
      // Transform the data to match the expected option format
      // Assuming your API returns an array of objects with id and name/label
      return dynamicQuery.data.map((item: any) => ({
        value: item.id || item.value,
        label: item.name || item.label || item.title,
      }));
    }

    return [];
  };

  const questionOptions = getQuestionOptions();
  const shouldRunQuery =
    currentQuestion?.optionQuery && !currentQuestion?.options;
  const isLoadingOptions = shouldRunQuery && dynamicQuery?.isLoading;

  const isCurrentQuestionAnswered = (): boolean => {
    const { field, type } = currentQuestion ?? {};

    if (!field || !type) return false;

    const value = profileData[field];

    switch (type) {
      case "input":
        return typeof value === "string" && value.trim() !== "";

      case "scrollable-picker":
      case "radio":
      case "boolean":
        return value !== undefined && value !== null && value !== "";

      case "checkbox":
        return Array.isArray(value) && value.length > 0;

      case "static":
        return true;

      default:
        return false;
    }
  };

  const isBackBlocked = step === 0 || visibleQuestions[step - 1]?.preventBack;

  const renderComponent = () => {
    if (!currentQuestion) {
      return <div>No question available.</div>;
    }
    const { type, field, options, title, placeholder, max } = currentQuestion;

    if (isLoadingOptions) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading options...</span>
        </div>
      );
    }

    switch (type) {
      case "input":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 20,
              bounce: 0.4,
            }}
          >
            <Input
              placeholder={placeholder ?? title}
              value={
                typeof profileData[field] === "string" ? profileData[field] : ""
              }
              onChange={(e) => updateProfileData({ [field]: e.target.value })}
            />
          </motion.div>
        );

      case "scrollable-picker":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 20,
              bounce: 0.4,
            }}
            className=""
          >
            <ScrollablePicker
              items={questionOptions ?? []}
              selectedValue={
                typeof profileData[field] === "string" ||
                typeof profileData[field] === "number"
                  ? profileData[field]
                  : typeof profileData[field] === "boolean"
                    ? String(profileData[field])
                    : ""
              }
              onChange={(value) => updateProfileData({ [field]: value })}
            />
          </motion.div>
        );
        break;
      case "radio":
        return (
          <div className="flex w-full flex-wrap justify-center gap-4">
            {questionOptions?.map((opt: any, i: number) => (
              <motion.div
                key={opt.value}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: i * 0.1,
                  type: "spring",
                  stiffness: 500,
                  damping: 20,
                  bounce: 0.4,
                }}
              >
                <SelectableInput
                  inputType="radio"
                  groupName={field}
                  label={opt.label}
                  value={opt.value}
                  checked={profileData[field] === opt.value}
                  onChange={(e) =>
                    updateProfileData({ [field]: e.target.value })
                  }
                  onOtherChange={(e) =>
                    updateProfileData({ [`${field}Other`]: e.target.value })
                  }
                />
              </motion.div>
            ))}
          </div>
        );
        break;
      case "checkbox":
        return (
          <div className="flex w-full flex-wrap justify-center gap-4">
            {questionOptions?.map((opt: any, i: number) => (
              <motion.div
                key={opt.value}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: i * 0.1,
                  type: "spring",
                  stiffness: 500,
                  damping: 20,
                  bounce: 0.4,
                }}
              >
                <SelectableInput
                  inputType="checkbox"
                  label={opt.label}
                  value={opt.value}
                  checked={(profileData[field] as string[]).includes(opt.value)}
                  onChange={(e) => {
                    const current = profileData[field] as string[];
                    const updated = e.target.checked
                      ? [...current, opt.value]
                      : current.filter((val) => val !== opt.value);
                    updateProfileData({ [field]: updated });
                  }}
                  maxSelectable={max} // renamed from `max` to `maxSelectable`
                  currentSelectedCount={(profileData[field] as string[]).length}
                />
              </motion.div>
            ))}
          </div>
        );
        break;
      case "boolean":
        return (
          <div className="flex gap-4 space-y-3 md:block">
            {[true, false].map((bool, i) => (
              <motion.div
                key={String(bool)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: i * 0.1,
                  type: "spring",
                  stiffness: 500,
                  damping: 20,
                  bounce: 0.4,
                }}
                className="h-full w-full"
              >
                <button
                  key={String(bool)}
                  className={`shadow-brand h-full w-full cursor-pointer rounded-lg border p-4 text-left font-bold transition-colors ${
                    profileData[field] === bool
                      ? "bg-primary shadow-brand border-2 text-white"
                      : "border-2 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => updateProfileData({ [field]: bool })}
                >
                  {bool ? "Yes" : "No"}
                </button>
              </motion.div>
            ))}
          </div>
        );
      case "static":
        return <></>;

      default:
        return <div>Unsupported type: {type}</div>;
    }
  };
  const isLastStep = step === visibleQuestions.length - 1;
  const progressQuestions = visibleQuestions.filter((q) =>
    ["input", "scrollable-picker", "radio", "checkbox", "boolean"].includes(
      q.type,
    ),
  );

  const answeredSteps = progressQuestions.findIndex(
    (q) => q === currentQuestion,
  );

  const progressPercentage = Math.round(
    ((answeredSteps + 1) / progressQuestions.length) * 100,
  );
  const safeProgress = isNaN(progressPercentage) ? 0 : progressPercentage;

  const prevQuestionTypeRef = useRef<string | null>(null);

  useEffect(() => {
    if (currentQuestion) {
      prevQuestionTypeRef.current = currentQuestion.type;
    }
  }, [step]);

  const forceFresh = prevQuestionTypeRef.current === "static";

  return (
    <>
      {" "}
      <div className="mx-auto w-full max-w-xl p-6 md:w-xl">
        {!isSubmitting && !isCompleted && (
          <>
            {currentQuestion?.type != "static" && (
              <div className="mb-8 rounded-full border-2">
                <div className="h-3 w-full rounded-full bg-white">
                  <div
                    className="bg-accent-green h-3 rounded-full transition-all duration-300"
                    style={{ width: `${safeProgress}%`, minWidth: "10%" }}
                  />
                </div>
              </div>
            )}

            <div
              className={`flex items-center ${currentQuestion?.type == "static" ? "justify-center" : "justify-start"} gap-2`}
            >
              {currentQuestion?.type != "static" && (
                <div className="relative flex max-h-32 min-h-32 max-w-32 min-w-32 items-center justify-center">
                  <Image
                    src="https://images.ctfassets.net/ayry21z1dzn2/5IWC1tKjYnt7UBOOrfCbUx/57659036ea384b34e0afd4d87173c76d/Waving__2_.svg"
                    height={128}
                    width={128}
                    alt="Cordy asking a question"
                    className="inset-0 h-32 w-32 object-contain"
                  />
                </div>
              )}

              <h2
                className={`font-brand mb-4 text-2xl font-bold ${currentQuestion?.type == "static" ? "text-center text-2xl" : "text-xl font-bold"}`}
              >
                <TypingText
                  text={currentQuestion?.title ?? ""}
                  forceFresh={forceFresh}
                  onTypingEnd={() => {
                    setTypingDone(true);
                    setTimeout(() => setShowOptions(true), 200); // Wait 200ms after typing
                  }}
                />
              </h2>
            </div>

            <div className="mb-16">
              {currentQuestion?.type == "static" ? (
                <div className="relative flex h-full w-full items-center justify-center">
                  <Image
                    src="https://images.ctfassets.net/ayry21z1dzn2/5IWC1tKjYnt7UBOOrfCbUx/57659036ea384b34e0afd4d87173c76d/Waving__2_.svg"
                    height={100}
                    width={100}
                    alt="Cordy"
                    className="inset-0 h-54 w-54 object-contain"
                  />
                </div>
              ) : (
                <> {showOptions && renderComponent()}</>
              )}
            </div>

            <div
              className={`flex ${!isBackBlocked ? "justify-between" : currentQuestion?.type == "static" ? "w-full justify-center" : "w-full justify-end"} items-center`}
            >
              {!isBackBlocked && (
                <button
                  onClick={handlePrevious}
                  disabled={isBackBlocked ?? !typingDone}
                  className={`btn-brand-white flex items-center space-x-2 rounded-lg bg-white px-4 py-2 hover:bg-gray-100 ${
                    isBackBlocked
                      ? "cursor-not-allowed text-gray-400"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              <button
                disabled={!typingDone || !isCurrentQuestionAnswered()}
                onClick={handleNext}
                className={`btn-brand-primary flex min-w-fit ${currentQuestion?.type == "static" ? "w-2xs md:w-sm" : "w-1/4"} items-center justify-center gap-2`}
              >
                {isLastStep ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="mt-0.5">Complete</span>
                  </>
                ) : (
                  <>
                    <span className="font-brand mt-0.5 font-black text-white uppercase">
                      Next
                    </span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
        {(isSubmitting || isCompleted) && (
          <div className="flex w-full flex-col items-center justify-center gap-4">
            <div className="font-brand mb-4 text-center text-3xl font-bold">
              {isSubmitting && (
                <p className="mt-0.5">Cordy is taking notes...</p>
              )}{" "}
              {isCompleted && <p className="mt-0.5">Customisation complete!</p>}
            </div>
            <div className="my-8">
              <SubmitAnimation
                size={120}
                isSubmitting={isSubmitting}
                isComplete={isCompleted}
              />
            </div>

            {isCompleted && (
              <Link href="opportunities/for-you" className="mt-4">
                <button
                  className={`btn-brand-primary flex w-2xs min-w-fit items-center justify-center gap-2 md:w-sm`}
                >
                  <>
                    <span className="font-brand mt-0.5 font-black text-white uppercase">
                      LET&apos;S GO
                    </span>
                  </>
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ProfileQuestionnaire;
