"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type {
  HearAboutSource,
  GoalType,
  AgeRange,
  InterestCategory,
  school_type,
} from "@prisma/client";

// Age Scroll Wheel Component
const AgeScrollWheel: React.FC<{
  selectedAge?: AgeRange;
  onAgeChange: (age: AgeRange) => void;
}> = ({ selectedAge, onAgeChange }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const ageOptions = [
    { value: "12_BELOW", label: "12 and Below" },
    { value: "THIRTEEN", label: "13" },
    { value: "FOURTEEN", label: "14" },
    { value: "FIFTEEN", label: "15" },
    { value: "SIXTEEN", label: "16" },
    { value: "SEVENTEEN", label: "17" },
    { value: "EIGHTEEN", label: "18" },
    { value: "NINETEEN", label: "19" },
    { value: "TWENTY", label: "20" },
    { value: "TWENTY_ONE", label: "21" },
    { value: "TWENTY_TWO", label: "22" },
    { value: "TWENTY_THREE", label: "23" },
    { value: "TWENTY_FOUR", label: "24" },
    { value: "TWENTY_FIVE", label: "25" },
    { value: "ABOVE_25", label: "Above 25" },
  ];

  const itemHeight = 60;
  const visibleItems = 5;
  const containerHeight = visibleItems * itemHeight;

  useEffect(() => {
    if (selectedAge && scrollRef.current) {
      const selectedIndex = ageOptions.findIndex(
        (option) => option.value === selectedAge,
      );
      if (selectedIndex !== -1) {
        const scrollTop =
          selectedIndex * itemHeight - containerHeight / 2 + itemHeight / 2;
        scrollRef.current.scrollTop = Math.max(0, scrollTop);
      }
    }
  }, [selectedAge]);

  const handleScroll = () => {
    if (!scrollRef.current || isDragging) return;

    const scrollTop = scrollRef.current.scrollTop;
    const centerPosition = scrollTop + containerHeight / 2;
    const selectedIndex = Math.round(
      (centerPosition - itemHeight / 2) / itemHeight,
    );
    const clampedIndex = Math.max(
      0,
      Math.min(selectedIndex, ageOptions.length - 1),
    );

    if (
      ageOptions[clampedIndex] &&
      ageOptions[clampedIndex].value !== selectedAge
    ) {
      onAgeChange(ageOptions[clampedIndex].value as AgeRange);
    }
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(handleScroll, 100);
  };

  const handleTouchStart = () => setIsDragging(true);
  const handleTouchEnd = () => {
    setIsDragging(false);
    setTimeout(handleScroll, 100);
  };

  return (
    <div className="relative mx-auto w-48">
      {/* Selection indicator */}
      <div
        className="pointer-events-none absolute right-0 left-0 z-10 rounded-lg border-2 border-blue-300 bg-blue-100"
        style={{
          top: `${containerHeight / 2 - itemHeight / 2}px`,
          height: `${itemHeight}px`,
        }}
      />

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="scrollbar-hide overflow-y-scroll"
        style={{ height: `${containerHeight}px` }}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top padding */}
        <div style={{ height: `${containerHeight / 2 - itemHeight / 2}px` }} />

        {/* Age options */}
        {ageOptions.map((option, index) => (
          <div
            key={option.value}
            className={`flex cursor-pointer items-center justify-center text-lg font-medium transition-all duration-200 ${
              selectedAge === option.value
                ? "scale-110 text-blue-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
            style={{ height: `${itemHeight}px` }}
            onClick={() => onAgeChange(option.value as AgeRange)}
          >
            {option.label}
          </div>
        ))}

        {/* Bottom padding */}
        <div style={{ height: `${containerHeight / 2 - itemHeight / 2}px` }} />
      </div>

      {/* Fade effects */}
      <div className="pointer-events-none absolute top-0 right-0 left-0 h-16 bg-gradient-to-b from-white to-transparent" />
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-16 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
};

// Types based on your Prisma schema

interface ProfileData {
  hearAboutSource?: HearAboutSource;
  hearAboutOther?: string;
  interests: InterestCategory[];
  interestsOther?: string;
  ageRange?: AgeRange;
  isStudent?: boolean;
  schoolType?: school_type;
  schoolName?: string;
  goals: GoalType[];
  goalsOther?: string;
}

const ProfileQuestionnaire: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState<ProfileData>({
    interests: [],
    goals: [],
  });

  const updateProfileData = useCallback((updates: Partial<ProfileData>) => {
    setProfileData((prev) => ({ ...prev, ...updates }));
  }, []);

  const questions = [
    {
      id: "hearAbout",
      title: "How did you hear about us?",
      component: (
        <div className="space-y-3">
          {[
            { value: "SOCIAL_MEDIA", label: "Social Media" },
            { value: "FRIEND_REFERRAL", label: "Friend Referral" },
            { value: "SEARCH_ENGINE", label: "Search Engine" },
            { value: "ADVERTISEMENT", label: "Advertisement" },
            { value: "SCHOOL", label: "School" },
            { value: "TEACHER", label: "Teacher" },
            { value: "PARENT", label: "Parent" },
            { value: "NEWS_ARTICLE", label: "News Article" },
            { value: "OTHER", label: "Other" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
            >
              <input
                type="radio"
                name="hearAbout"
                value={option.value}
                checked={profileData.hearAboutSource === option.value}
                onChange={(e) =>
                  updateProfileData({
                    hearAboutSource: e.target.value as HearAboutSource,
                  })
                }
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-gray-700">{option.label}</span>
            </label>
          ))}
          {profileData.hearAboutSource === "OTHER" && (
            <input
              type="text"
              placeholder="Please specify..."
              value={profileData.hearAboutOther || ""}
              onChange={(e) =>
                updateProfileData({ hearAboutOther: e.target.value })
              }
              className="mt-2 w-full rounded-lg border p-3"
            />
          )}
        </div>
      ),
    },
    {
      id: "age",
      title: "What is your age?",
      component: (
        <AgeScrollWheel
          selectedAge={profileData.ageRange}
          onAgeChange={(age) => updateProfileData({ ageRange: age })}
        />
      ),
    },
    {
      id: "student",
      title: "Are you currently a student?",
      component: (
        <div className="space-y-3">
          {[
            { value: true, label: "Yes, I am a student" },
            { value: false, label: "No, I am not a student" },
          ].map((option) => (
            <button
              key={option.value.toString()}
              onClick={() => updateProfileData({ isStudent: option.value })}
              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                profileData.isStudent === option.value
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "schoolType",
      title: "What type of school are you in?",
      show: profileData.isStudent === true,
      component: (
        <div className="space-y-3">
          {[
            { value: "Secondary_School", label: "Secondary School" },
            { value: "Junior_College_MI", label: "Junior College/MI" },
            { value: "Polytechnic", label: "Polytechnic" },
            { value: "University", label: "University" },
            {
              value: "Institute_of_Technical_Education",
              label: "Institute of Technical Education",
            },
            { value: "International_School", label: "International School" },
            { value: "Others", label: "Others" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() =>
                updateProfileData({ schoolType: option.value as school_type })
              }
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                profileData.schoolType === option.value
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "schoolName",
      title: "Which school do you attend?",
      show: profileData.isStudent === true,
      component: (
        <input
          type="text"
          placeholder="Enter your school name..."
          value={profileData.schoolName || ""}
          onChange={(e) => updateProfileData({ schoolName: e.target.value })}
          className="w-full rounded-lg border p-4 text-lg"
        />
      ),
    },
    {
      id: "interests",
      title: "What are your interests? (Select all that apply)",
      component: (
        <div className="space-y-3">
          {[
            { value: "SOCIAL_IMPACT", label: "Social Impact" },
            { value: "ENTREPRENEURSHIP", label: "Entrepreneurship" },
            { value: "MUSIC", label: "Music" },
            { value: "CODING", label: "Coding" },
            { value: "SPORTS", label: "Sports" },
            { value: "EXERCISE", label: "Exercise" },
            { value: "OTHER", label: "Other" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={profileData.interests.includes(
                  option.value as InterestCategory,
                )}
                onChange={(e) => {
                  const interests = e.target.checked
                    ? [
                        ...profileData.interests,
                        option.value as InterestCategory,
                      ]
                    : profileData.interests.filter((i) => i !== option.value);
                  updateProfileData({ interests });
                }}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-gray-700">{option.label}</span>
            </label>
          ))}
          {profileData.interests.includes("OTHER") && (
            <input
              type="text"
              placeholder="Please specify other interests..."
              value={profileData.interestsOther || ""}
              onChange={(e) =>
                updateProfileData({ interestsOther: e.target.value })
              }
              className="mt-2 w-full rounded-lg border p-3"
            />
          )}
        </div>
      ),
    },
    {
      id: "goals",
      title: "What are your goals? (Select all that apply)",
      component: (
        <div className="space-y-3">
          {[
            { value: "ACADEMIC_EXCELLENCE", label: "Academic Excellence" },
            { value: "CAREER_PREPARATION", label: "Career Preparation" },
            { value: "SKILL_DEVELOPMENT", label: "Skill Development" },
            { value: "NETWORKING", label: "Networking" },
            { value: "SCHOLARSHIPS", label: "Scholarships" },
            { value: "UNIVERSITY_ADMISSION", label: "University Admission" },
            { value: "INTERNSHIPS", label: "Internships" },
            { value: "COMPETITIONS", label: "Competitions" },
            { value: "LEADERSHIP_EXPERIENCE", label: "Leadership Experience" },
            { value: "COMMUNITY_SERVICE", label: "Community Service" },
            { value: "PERSONAL_GROWTH", label: "Personal Growth" },
            { value: "OTHER", label: "Other" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={profileData.goals.includes(option.value as GoalType)}
                onChange={(e) => {
                  const goals = e.target.checked
                    ? [...profileData.goals, option.value as GoalType]
                    : profileData.goals.filter((g) => g !== option.value);
                  updateProfileData({ goals });
                }}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-gray-700">{option.label}</span>
            </label>
          ))}
          {profileData.goals.includes("OTHER") && (
            <input
              type="text"
              placeholder="Please specify other goals..."
              value={profileData.goalsOther || ""}
              onChange={(e) =>
                updateProfileData({ goalsOther: e.target.value })
              }
              className="mt-2 w-full rounded-lg border p-3"
            />
          )}
        </div>
      ),
    },
  ];

  const visibleQuestions = questions.filter((q) => q.show !== false);
  const totalSteps = visibleQuestions.length;
  const currentQuestion = visibleQuestions[currentStep];

  const canGoNext = () => {
    const question = currentQuestion;
    if (!question) return false;

    switch (question.id) {
      case "hearAbout":
        return (
          profileData.hearAboutSource &&
          (profileData.hearAboutSource !== "OTHER" ||
            profileData.hearAboutOther)
        );
      case "age":
        return !!profileData.ageRange;
      case "student":
        return profileData.isStudent !== undefined;
      case "schoolType":
        return !!profileData.schoolType;
      case "schoolName":
        return !!profileData.schoolName?.trim();
      case "interests":
        return (
          profileData.interests.length > 0 &&
          (!profileData.interests.includes("OTHER") ||
            profileData.interestsOther)
        );
      case "goals":
        return (
          profileData.goals.length > 0 &&
          (!profileData.goals.includes("OTHER") || profileData.goalsOther)
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Here you would typically send the data to your API
      console.log("Submitting profile data:", profileData);

      // Example API call:
      // const response = await fetch('/api/profile', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(profileData)
      // });

      alert("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile. Please try again.");
    }
  };

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <>
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="mx-auto max-w-2xl bg-white p-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / totalSteps) * 100)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            {currentQuestion?.title}
          </h2>
          <div className="flex min-h-[400px] items-center justify-center">
            {currentQuestion?.component}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center space-x-2 rounded-lg px-4 py-2 transition-colors ${
              currentStep === 0
                ? "cursor-not-allowed text-gray-400"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            disabled={!canGoNext()}
            className={`flex items-center space-x-2 rounded-lg px-6 py-3 font-medium transition-colors ${
              canGoNext()
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "cursor-not-allowed bg-gray-300 text-gray-500"
            }`}
          >
            {isLastStep ? (
              <>
                <Check className="h-4 w-4" />
                <span>Complete</span>
              </>
            ) : (
              <>
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfileQuestionnaire;
