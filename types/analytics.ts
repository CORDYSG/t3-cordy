export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

export interface PersonalityInsight {
  type: string;
  title: string;
  description: string;
  traits: string[];
}

export interface UserAnalytics {
  streak: {
    current: number;
    longest: number;
    lastActiveDate: Date | null;
  };
  explorerRate: number;
  topInterest: {
    category: string;
    percentage: number;
  };
  activityPattern: {
    mostActiveTime: string;
    pattern: 'weekdays' | 'weekends' | 'mixed';
  };
  badges: Badge[];
  personality: PersonalityInsight;
  stats: {
    totalViews: number;
    totalLikes: number;
    totalSaves: number;
    totalApplied: number;
    pickiness: number;
    interestDiversity: number;
  };
}
