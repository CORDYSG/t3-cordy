interface UserActionWithDate {
  createdAt: Date | string;
}

export function calculateStreak(userActions: UserActionWithDate[]): { current: number; longest: number; lastActiveDate: Date | null } {
  if (!userActions.length) {
    return { current: 0, longest: 0, lastActiveDate: null };
  }

  // Sort actions by date (most recent first)
  const sortedActions = userActions.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get unique active dates (filter out invalid dates)
  const activeDates = [...new Set(
    sortedActions
      .map(action => {
        try {
          const date = new Date(action.createdAt);
          if (isNaN(date.getTime())) return null;
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        } catch {
          return null;
        }
      })
      .filter((timestamp): timestamp is number => timestamp !== null)
  )].sort((a, b) => b - a);

  if (!activeDates.length) {
    return { current: 0, longest: 0, lastActiveDate: null };
  }



const lastActiveDate = activeDates[0] ? new Date(activeDates[0]) : new Date();

  const daysDiff = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));

  // If last activity was more than 1 day ago, streak is broken
  if (daysDiff > 1) {
    const longestStreak = calculateLongestStreak(activeDates);
    return { current: 0, longest: longestStreak, lastActiveDate };
  }

  // Calculate current streak
  let currentStreak = 0;
  let expectedDate = today.getTime();

  for (const activeDate of activeDates) {
    const diffDays = Math.floor((expectedDate - activeDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0 || diffDays === 1) {
      currentStreak++;
      expectedDate = activeDate - (1000 * 60 * 60 * 24);
    } else {
      break;
    }
  }

  const longestStreak = Math.max(currentStreak, calculateLongestStreak(activeDates));

  return { current: currentStreak, longest: longestStreak, lastActiveDate };
}
function calculateLongestStreak(activeDates: number[]): number {
  if (activeDates.length <= 1) return activeDates.length;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < activeDates.length; i++) {
    // activeDates is sorted in descending order (most recent first)
    // so activeDates[i-1] is more recent than activeDates[i]
    const moreRecent = activeDates[i - 1];
    const lessRecent = activeDates[i];
    
    // TypeScript safety check (though logically these should never be undefined)
    if (moreRecent === undefined || lessRecent === undefined) {
      current = 1;
      continue;
    }
    
    const daysDiff = Math.floor((moreRecent - lessRecent) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}
