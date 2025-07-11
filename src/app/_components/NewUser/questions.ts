import type { HearAboutSource, AgeRange, InterestCategory, GoalType, school_type } from "@prisma/client";

export type QuestionType = "radio" | "checkbox" | "input" | "scrollable-picker" | "boolean" | "text" | "static";


export interface Question {
  id: string;
  title: string;
  type: QuestionType;
  field: keyof ProfileData ;
  options?: { label: string; value: string }[];
  titleBold?: boolean;
  show?: (profile: ProfileData) => boolean;
  preventBack?: boolean;
  placeholder?: string
  max?:number
  optionQuery?: string; //
  // scro For checkbox/radio options, the Airtable table to fetch options from

}

export interface ProfileData {
  hearAboutSource?: HearAboutSource;
  hearAboutOther?: string;
  interests: string[];
  interestsOther?: string;
  ageRange?: AgeRange;
  isStudent?: boolean;
  schoolType?: school_type;
  schoolName?: string;
  goals: GoalType[];
  goalsOther?: string;

}

export const questions: Question[] = [
    {
  id: "intro",
  title: "Hey, I'm CORDY!",
  type: "static",
  field: "__static" as keyof ProfileData,
  titleBold: true,
  preventBack: true, // custom flag to block back button here
},
   {
  id: "intro2",
  title: "I'll ask you some questions so I can send opportunities that suit you.",
  type: "static",
  field: "__static" as keyof ProfileData,
  titleBold: true,
  preventBack: true, // custom flag to block back button here
},
  {
    id: "hearAbout",
    title: "How did you hear about me?",
    type: "radio",
    field: "hearAboutSource",
    options: [
      { value: "SOCIAL_MEDIA", label: "Social Media" },
      { value: "FRIEND_REFERRAL", label: "Friend Referral" },
      { value: "SEARCH_ENGINE", label: "Search Engine" },
      { value: "ADVERTISEMENT", label: "Advertisement" },
      { value: "SCHOOL", label: "School" },
      { value: "TEACHER", label: "Teacher" },
      { value: "PARENT", label: "Parent" },
      { value: "NEWS_ARTICLE", label: "News Article" },
      { value: "OTHER_HEARABOUT", label: "Other" },
    ],
  },
   {
    id: "goals",
    title: "What are your goals?",
    type: "checkbox",
    field: "goals",
    options: [
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
      { value: "OTHER_GOALS", label: "Other" },
    ],
    max: 4,
  },
  {
    id: "age",
    title: "What is your age? (this year)",
    type: "scrollable-picker",
    field: "ageRange",
    options: [
          { value: "BELOW_TWELVE", label: "Below 12" },
          { value: "TWELVE", label: "12" },
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
        ]
  },
  {
    id: "student",
    title: "Are you currently a student?",
    type: "boolean",
    field: "isStudent",
  },
  {
    id: "schoolType",
    title: "What type of school are you in? (this year)",
    type: "radio",
    field: "schoolType",
    options: [
      { value: "Secondary_School", label: "Secondary School" },
      { value: "Junior_College_MI", label: "Junior College/MI" },
      { value: "Polytechnic", label: "Polytechnic" },
      { value: "University", label: "University" },
      { value: "Institute_of_Technical_Education", label: "ITE" },
      { value: "International_School", label: "International School" },
      { value: "Others", label: "Others" },
    ],
    show: (profile) => profile.isStudent === true,
  },
  {
    id: "schoolName",
    title: "Which school do you attend?",
    type: "input",
    field: "schoolName",
    placeholder: "Cordy Junior College",
    show: (profile) => profile.isStudent === true,
  },
  {
    id: "interests",
    title: "What are your interests?",
    type: "checkbox",
    field: "interests",
    optionQuery: "zone.getZonesForOptions",
    max: 3,
  },
 
];
