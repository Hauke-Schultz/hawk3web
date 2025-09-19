// Mystery Box system configuration
export const MYSTERY_BOX_CONFIG = {
  // Requirements
  requiredDailyRewards: 7,           // How many daily rewards needed

  // Rewards
  baseReward: {
    coins: 500,
    diamonds: 25
  },

  // Multipliers for consecutive mystery boxes
  multipliers: {
    1: 1.0,      // First box: base reward
    2: 1.2,      // Second box: 20% more
    3: 1.5,      // Third box: 50% more
    5: 2.0,      // Fifth box: 100% more
    10: 3.0      // Tenth box: 200% more
  },

  // Achievement thresholds
  achievementThresholds: [
    { count: 1, achievementId: 'mystery_box_first' },
    { count: 5, achievementId: 'mystery_box_collector' },
    { count: 10, achievementId: 'mystery_box_master' }
  ],

  // Visual settings
  animationDuration: 200,            // Opening animation duration
  sparkleCount: 4,                   // Number of sparkle effects

  // Special rewards for milestone boxes
  specialRewards: {
    5: {  // 5th box gets extra diamonds
      coins: 750,
      diamonds: 50,
      message: 'Special Milestone Reward!'
    },
    10: { // 10th box gets even more
      coins: 1500,
      diamonds: 100,
      message: 'Legendary Mystery Box!'
    }
  }
}

// Helper function to calculate mystery box reward
export const calculateMysteryBoxReward = (mysteryBoxNumber) => {
  const config = MYSTERY_BOX_CONFIG

  // Check for special rewards first
  if (config.specialRewards[mysteryBoxNumber]) {
    return {
      ...config.specialRewards[mysteryBoxNumber],
      type: 'mystery_box',
      mysteryBoxNumber,
      isSpecial: true
    }
  }

  // Calculate multiplier
  let multiplier = 1.0
  for (const [threshold, mult] of Object.entries(config.multipliers)) {
    if (mysteryBoxNumber >= parseInt(threshold)) {
      multiplier = mult
    }
  }

  return {
    coins: Math.floor(config.baseReward.coins * multiplier),
    diamonds: Math.floor(config.baseReward.diamonds * multiplier),
    type: 'mystery_box',
    mysteryBoxNumber,
    multiplier,
    isSpecial: false
  }
}

// Helper function to get next achievement threshold
export const getNextMysteryBoxAchievement = (currentCount) => {
  return MYSTERY_BOX_CONFIG.achievementThresholds
      .find(threshold => currentCount < threshold.count)
}

// Helper function to check if mystery box is ready
export const canClaimMysteryBox = (dailyRewardsCounter, lastClaimedCounter) => {
  // Must have enough daily rewards
  const hasEnoughRewards = dailyRewardsCounter > 0 &&
      dailyRewardsCounter % MYSTERY_BOX_CONFIG.requiredDailyRewards === 0

  // Must not have been claimed for this milestone
  const notAlreadyClaimed = dailyRewardsCounter > lastClaimedCounter

  console.log(`🎁 Mystery Box eligibility check:`, {
    dailyRewardsCounter,
    lastClaimedCounter,
    hasEnoughRewards,
    notAlreadyClaimed,
    canClaim: hasEnoughRewards && notAlreadyClaimed
  })

  return hasEnoughRewards && notAlreadyClaimed
}

// Helper function to get progress to next mystery box
export const getMysteryBoxProgress = (dailyRewardsCounter, lastClaimedCounter = 0) => {
  const required = MYSTERY_BOX_CONFIG.requiredDailyRewards
  const current = dailyRewardsCounter % required
  const remaining = required - current
  const percentage = (current / required) * 100

  const canClaim = canClaimMysteryBox(dailyRewardsCounter, lastClaimedCounter)
  const mysteryBoxNumber = Math.floor(dailyRewardsCounter / required)

  return {
    current,
    required,
    remaining,
    percentage: Math.round(percentage),
    isComplete: canClaim,
    mysteryBoxNumber,
    lastClaimedCounter,
    eligibleButClaimed: dailyRewardsCounter % required === 0 && !canClaim
  }
}