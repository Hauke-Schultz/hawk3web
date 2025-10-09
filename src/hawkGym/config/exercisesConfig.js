// Central exercises configuration for Hawk Gym
// Each exercise can be reused across multiple workout days

export const EXERCISES = {
  // Lower Body Exercises
  squats: {
    id: 'squats',
    nameKey: 'hawkGym.exercises.squats.name',
    descriptionKey: 'hawkGym.exercises.squats.description',
    category: 'lower_body',
    image: null // Will be added later
  },
  lunges: {
    id: 'lunges',
    nameKey: 'hawkGym.exercises.lunges.name',
    descriptionKey: 'hawkGym.exercises.lunges.description',
    category: 'lower_body',
    image: null
  },
  calf_raises: {
    id: 'calf_raises',
    nameKey: 'hawkGym.exercises.calf_raises.name',
    descriptionKey: 'hawkGym.exercises.calf_raises.description',
    category: 'lower_body',
    image: null
  },
  glute_bridge: {
    id: 'glute_bridge',
    nameKey: 'hawkGym.exercises.glute_bridge.name',
    descriptionKey: 'hawkGym.exercises.glute_bridge.description',
    category: 'lower_body',
    image: null
  },
  squats_dumbbells: {
    id: 'squats_dumbbells',
    nameKey: 'hawkGym.exercises.squats_dumbbells.name',
    descriptionKey: 'hawkGym.exercises.squats_dumbbells.description',
    category: 'lower_body',
    image: null
  },
  slow_squats: {
    id: 'slow_squats',
    nameKey: 'hawkGym.exercises.slow_squats.name',
    descriptionKey: 'hawkGym.exercises.slow_squats.description',
    category: 'lower_body',
    image: null
  },

  // Upper Body Exercises
  push_ups: {
    id: 'push_ups',
    nameKey: 'hawkGym.exercises.push_ups.name',
    descriptionKey: 'hawkGym.exercises.push_ups.description',
    category: 'upper_body',
    image: null
  },
  dumbbell_rows: {
    id: 'dumbbell_rows',
    nameKey: 'hawkGym.exercises.dumbbell_rows.name',
    descriptionKey: 'hawkGym.exercises.dumbbell_rows.description',
    category: 'upper_body',
    image: null
  },
  shoulder_press: {
    id: 'shoulder_press',
    nameKey: 'hawkGym.exercises.shoulder_press.name',
    descriptionKey: 'hawkGym.exercises.shoulder_press.description',
    category: 'upper_body',
    image: null
  },
  bicep_curls: {
    id: 'bicep_curls',
    nameKey: 'hawkGym.exercises.bicep_curls.name',
    descriptionKey: 'hawkGym.exercises.bicep_curls.description',
    category: 'upper_body',
    image: null
  },
  tricep_extensions: {
    id: 'tricep_extensions',
    nameKey: 'hawkGym.exercises.tricep_extensions.name',
    descriptionKey: 'hawkGym.exercises.tricep_extensions.description',
    category: 'upper_body',
    image: null
  },
  bent_over_rows: {
    id: 'bent_over_rows',
    nameKey: 'hawkGym.exercises.bent_over_rows.name',
    descriptionKey: 'hawkGym.exercises.bent_over_rows.description',
    category: 'upper_body',
    image: null
  },
  deadlifts: {
    id: 'deadlifts',
    nameKey: 'hawkGym.exercises.deadlifts.name',
    descriptionKey: 'hawkGym.exercises.deadlifts.description',
    category: 'upper_body',
    image: null
  },

  // Core Exercises
  sit_ups: {
    id: 'sit_ups',
    nameKey: 'hawkGym.exercises.sit_ups.name',
    descriptionKey: 'hawkGym.exercises.sit_ups.description',
    category: 'core',
    image: null
  },
  russian_twist: {
    id: 'russian_twist',
    nameKey: 'hawkGym.exercises.russian_twist.name',
    descriptionKey: 'hawkGym.exercises.russian_twist.description',
    category: 'core',
    image: null
  },
  plank: {
    id: 'plank',
    nameKey: 'hawkGym.exercises.plank.name',
    descriptionKey: 'hawkGym.exercises.plank.description',
    category: 'core',
    image: null
  },
  leg_raises: {
    id: 'leg_raises',
    nameKey: 'hawkGym.exercises.leg_raises.name',
    descriptionKey: 'hawkGym.exercises.leg_raises.description',
    category: 'core',
    image: null
  },
  superman: {
    id: 'superman',
    nameKey: 'hawkGym.exercises.superman.name',
    descriptionKey: 'hawkGym.exercises.superman.description',
    category: 'core',
    image: null
  },
  side_plank: {
    id: 'side_plank',
    nameKey: 'hawkGym.exercises.side_plank.name',
    descriptionKey: 'hawkGym.exercises.side_plank.description',
    category: 'core',
    image: null
  },
  plank_shoulder_taps: {
    id: 'plank_shoulder_taps',
    nameKey: 'hawkGym.exercises.plank_shoulder_taps.name',
    descriptionKey: 'hawkGym.exercises.plank_shoulder_taps.description',
    category: 'core',
    image: null
  },
  superman_hold: {
    id: 'superman_hold',
    nameKey: 'hawkGym.exercises.superman_hold.name',
    descriptionKey: 'hawkGym.exercises.superman_hold.description',
    category: 'core',
    image: null
  },
  crunches_twist: {
    id: 'crunches_twist',
    nameKey: 'hawkGym.exercises.crunches_twist.name',
    descriptionKey: 'hawkGym.exercises.crunches_twist.description',
    category: 'core',
    image: null
  },

  // Cardio Exercises
  jumping_jacks: {
    id: 'jumping_jacks',
    nameKey: 'hawkGym.exercises.jumping_jacks.name',
    descriptionKey: 'hawkGym.exercises.jumping_jacks.description',
    category: 'cardio',
    image: null
  },
  mountain_climbers: {
    id: 'mountain_climbers',
    nameKey: 'hawkGym.exercises.mountain_climbers.name',
    descriptionKey: 'hawkGym.exercises.mountain_climbers.description',
    category: 'cardio',
    image: null
  },

  // Combination Exercises
  squat_shoulder_press: {
    id: 'squat_shoulder_press',
    nameKey: 'hawkGym.exercises.squat_shoulder_press.name',
    descriptionKey: 'hawkGym.exercises.squat_shoulder_press.description',
    category: 'combination',
    image: null
  },
  push_up_row: {
    id: 'push_up_row',
    nameKey: 'hawkGym.exercises.push_up_row.name',
    descriptionKey: 'hawkGym.exercises.push_up_row.description',
    category: 'combination',
    image: null
  },
  glute_bridge_leg_raises: {
    id: 'glute_bridge_leg_raises',
    nameKey: 'hawkGym.exercises.glute_bridge_leg_raises.name',
    descriptionKey: 'hawkGym.exercises.glute_bridge_leg_raises.description',
    category: 'combination',
    image: null
  },

  // Recovery Exercises
  stretching: {
    id: 'stretching',
    nameKey: 'hawkGym.exercises.stretching.name',
    descriptionKey: 'hawkGym.exercises.stretching.description',
    category: 'recovery',
    image: null
  },
  light_walking: {
    id: 'light_walking',
    nameKey: 'hawkGym.exercises.light_walking.name',
    descriptionKey: 'hawkGym.exercises.light_walking.description',
    category: 'recovery',
    image: null
  },
  deep_breathing: {
    id: 'deep_breathing',
    nameKey: 'hawkGym.exercises.deep_breathing.name',
    descriptionKey: 'hawkGym.exercises.deep_breathing.description',
    category: 'recovery',
    image: null
  },
  foam_rolling: {
    id: 'foam_rolling',
    nameKey: 'hawkGym.exercises.foam_rolling.name',
    descriptionKey: 'hawkGym.exercises.foam_rolling.description',
    category: 'recovery',
    image: null
  },
  yoga: {
    id: 'yoga',
    nameKey: 'hawkGym.exercises.yoga.name',
    descriptionKey: 'hawkGym.exercises.yoga.description',
    category: 'recovery',
    image: null
  },
  meditation: {
    id: 'meditation',
    nameKey: 'hawkGym.exercises.meditation.name',
    descriptionKey: 'hawkGym.exercises.meditation.description',
    category: 'recovery',
    image: null
  }
}

// Helper function to get exercise by ID
export const getExercise = (exerciseId) => {
  return EXERCISES[exerciseId] || null
}

// Get all exercises in a category
export const getExercisesByCategory = (category) => {
  return Object.values(EXERCISES).filter(exercise => exercise.category === category)
}

// Exercise categories
export const EXERCISE_CATEGORIES = {
  lower_body: 'Lower Body',
  upper_body: 'Upper Body',
  core: 'Core',
  cardio: 'Cardio',
  combination: 'Combination',
  recovery: 'Recovery'
}