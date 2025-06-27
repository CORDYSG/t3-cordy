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
                  ? [...profileData.interests, option.value as InterestCategory]
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
            onChange={(e) => updateProfileData({ goalsOther: e.target.value })}
            className="mt-2 w-full rounded-lg border p-3"
          />
        )}
      </div>
    ),
  },
];
