// Unified level utilities for all games
export const calculateLevelStars = (levelStats, level) => {
	if (!levelStats || !levelStats.completed) return 0

	const { score, moves } = levelStats.bestPerformance || levelStats
	if (!score || !moves) return 1 // Minimum 1 star for completion

	// Get star thresholds from the level configuration
	const thresholds = level.starThresholds
	if (!thresholds) return 1
	console.log(score, levelStats, level)

	// Check for 3 stars first (most demanding)
	if (score >= thresholds[3].score || moves <= thresholds[3].moves) {
		return 3
	}

	// Check for 2 stars
	if (score >= thresholds[2].score || moves <= thresholds[2].moves) {
		return 2
	}

	// Check for 1 star (basic completion)
	if (score >= thresholds[1].score || moves <= thresholds[1].moves) {
		return 1
	}

	return 0
}

export const getLevelTitle = (levelNumber, gameId, t) => {
	return t(`${gameId}.levels.${levelNumber}.title`) || `Level ${levelNumber}`
}

export const getLevelDescription = (levelNumber, gameId, t) => {
	return t(`${gameId}.levels.${levelNumber}.description`) || `Level ${levelNumber}`
}