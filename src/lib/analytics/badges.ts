/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable  @typescript-eslint/no-unsafe-assignment */
/* eslint-disable  @typescript-eslint/no-unsafe-return */
/* eslint-disable  @typescript-eslint/no-explicit-any*/


import type { Badge } from "types/analytics";

export const BADGE_DEFINITIONS = {
  EXPLORER: {
    id: 'explorer',
    name: 'Explorer',
    description: '100+ opportunities viewed',
    icon: '🔍',
    threshold: 100,
    metric: 'views'
  },
  CURATOR: {
    id: 'curator',
    name: 'Curator',
    description: 'High like-to-explore ratio',
    icon: '🎯',
    threshold: 0.3,
    metric: 'likeRatio'
  },
  DESIGN_ENTHUSIAST: {
    id: 'design_enthusiast',
    name: 'Design Enthusiast',
    description: '50+ design opportunities',
    icon: '🎨',
    threshold: 50,
    metric: 'designViews'
  },
  WEEKEND_WARRIOR: {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Most active on weekends',
    icon: '⚡',
    threshold: 0.6,
    metric: 'weekendRatio'
  },
  STREAK_MASTER: {
    id: 'streak_master',
    name: 'Streak Master',
    description: '7+ day activity streak',
    icon: '🔥',
    threshold: 7,
    metric: 'streak'
  },
  APPLICANT: {
    id: 'applicant',
    name: 'Go-Getter',
    description: 'Applied to 10+ opportunities',
    icon: '🚀',
    threshold: 10,
    metric: 'applications'
  }
} as const;

export function calculateBadges(stats: any): Badge[] {
  const badges: Badge[] = [];

  Object.values(BADGE_DEFINITIONS).forEach(badge => {
    let earned = false;
    let progress = 0;
    let value = 0;

    switch (badge.metric) {
      case 'views':
        value = stats.totalViews;
        break;
      case 'likeRatio':
        value = stats.explorerRate;
        break;
      case 'designViews':
        value = stats.designViews ?? 0;
        break;
      case 'weekendRatio':
        value = stats.weekendRatio ?? 0;
        break;
      case 'streak':
        value = stats.currentStreak;
        break;
      case 'applications':
        value = stats.totalApplied;
        break;
    }

    earned = value >= badge.threshold;
    progress = Math.min(value, badge.threshold);

    badges.push({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      earned,
      progress,
      maxProgress: badge.threshold
    });
  });

  return badges;
}