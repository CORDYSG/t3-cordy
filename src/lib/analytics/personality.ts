import type { PersonalityInsight } from "types/analytics";

interface PersonalityStats {
  explorerRate: number;
  pickiness: number;
  interestDiversity: number;
  topInterest: {
    category: string;
    percentage: number;
  };
  activityPattern?: {
    mostActiveTime: string;
    pattern: 'weekdays' | 'weekends' | 'mixed';
  };
}

export function analyzePersonality(stats: PersonalityStats): PersonalityInsight {
  const { explorerRate, pickiness, interestDiversity, topInterest, activityPattern } = stats;

  // Determine personality type based on behavior patterns
  if (explorerRate > 0.7 && pickiness < 0.3) {
    return {
      type: 'THE_CURIOUS_EXPLORER',
      title: 'The Curious Explorer',
      description: `You're always discovering new opportunities but aren't too selective. You love exploring possibilities in ${topInterest.category.toLowerCase()}.`,
      traits: ['Curious', 'Open-minded', 'Adventurous']
    };
  }

  if (explorerRate > 0.5 && pickiness > 0.6) {
    return {
      type: 'THE_SELECTIVE_CURATOR',
      title: 'The Selective Curator',
      description: `You explore widely but are highly selective about what you pursue. You're building expertise in ${topInterest.category.toLowerCase()}.`,
      traits: ['Discerning', 'Strategic', 'Quality-focused']
    };
  }

  if (pickiness > 0.7 && interestDiversity < 0.4) {
    return {
      type: 'THE_FOCUSED_SPECIALIST',
      title: 'The Focused Specialist',
      description: `You know exactly what you want and focus intensely on ${topInterest.category.toLowerCase()}. Quality over quantity is your motto.`,
      traits: ['Focused', 'Determined', 'Expert-minded']
    };
  }

  if (interestDiversity > 0.7) {
    return {
      type: 'THE_VERSATILE_POLYMATH',
      title: 'The Versatile Polymath',
      description: `You're interested in everything! While ${topInterest.category.toLowerCase()} leads, you're building a diverse skill portfolio.`,
      traits: ['Versatile', 'Multi-talented', 'Broad-minded']
    };
  }

  // Default personality
  return {
    type: 'THE_BALANCED_LEARNER',
    title: 'The Balanced Learner',
    description: `You have a balanced approach to opportunities, showing steady interest in ${topInterest.category.toLowerCase()} while exploring other areas.`,
    traits: ['Balanced', 'Steady', 'Growth-minded']
  };
}