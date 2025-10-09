// Workout plans configuration for Hawk Gym
export const WORKOUT_PLANS = {
  monday: {
    nameKey: 'hawkGym.plans.monday.name',
    exercises: [
      'hawkGym.plans.monday.exercises.0', // Squats / Kniebeugen
      'hawkGym.plans.monday.exercises.1', // Lunges / Ausfallschritte
      'hawkGym.plans.monday.exercises.2', // Calf Raises / Wadenheben
      'hawkGym.plans.monday.exercises.3', // Glute Bridge
      'hawkGym.plans.monday.exercises.4', // Squats with Dumbbells / Kniebeuge mit Hanteln
      'hawkGym.plans.monday.exercises.5'  // Stretching / Dehnung
    ]
  },
  tuesday: {
    nameKey: 'hawkGym.plans.tuesday.name',
    exercises: [
      'hawkGym.plans.tuesday.exercises.0', // Push-ups / Liegestütze
      'hawkGym.plans.tuesday.exercises.1', // Dumbbell Rows / Rudern mit Hanteln
      'hawkGym.plans.tuesday.exercises.2', // Shoulder Press / Schulterdrücken
      'hawkGym.plans.tuesday.exercises.3', // Bicep Curls / Bizepscurls
      'hawkGym.plans.tuesday.exercises.4', // Tricep Extensions / Trizepsstrecken
      'hawkGym.plans.tuesday.exercises.5'  // Stretching / Dehnung
    ]
  },
  wednesday: {
    nameKey: 'hawkGym.plans.wednesday.name',
    exercises: [
      'hawkGym.plans.wednesday.exercises.0', // Sit-ups
      'hawkGym.plans.wednesday.exercises.1', // Russian Twist
      'hawkGym.plans.wednesday.exercises.2', // Plank
      'hawkGym.plans.wednesday.exercises.3', // Leg Raises / Beinheben
      'hawkGym.plans.wednesday.exercises.4', // Superman
      'hawkGym.plans.wednesday.exercises.5'  // Stretching / Dehnung
    ]
  },
  thursday: {
    nameKey: 'hawkGym.plans.thursday.name',
    exercises: [
      'hawkGym.plans.thursday.exercises.0', // Squat + Shoulder Press
      'hawkGym.plans.thursday.exercises.1', // Push-up + Row
      'hawkGym.plans.thursday.exercises.2', // Glute Bridge + Leg Raises
      'hawkGym.plans.thursday.exercises.3', // Side Plank / Seitstütz
      'hawkGym.plans.thursday.exercises.4', // Jumping Jacks / Hampelmänner
      'hawkGym.plans.thursday.exercises.5'  // Stretching / Dehnung
    ]
  },
  friday: {
    nameKey: 'hawkGym.plans.friday.name',
    exercises: [
      'hawkGym.plans.friday.exercises.0', // Deadlifts / Kreuzheben
      'hawkGym.plans.friday.exercises.1', // Bent Over Rows / Rudern Vorgebeugt
      'hawkGym.plans.friday.exercises.2', // Push-ups / Liegestütze
      'hawkGym.plans.friday.exercises.3', // Slow Squats / Kniebeugen Langsam
      'hawkGym.plans.friday.exercises.4', // Plank + Shoulder Taps
      'hawkGym.plans.friday.exercises.5'  // Stretching / Dehnung
    ]
  },
  saturday: {
    nameKey: 'hawkGym.plans.saturday.name',
    exercises: [
      'hawkGym.plans.saturday.exercises.0', // Jumping Jacks
      'hawkGym.plans.saturday.exercises.1', // Sit-ups
      'hawkGym.plans.saturday.exercises.2', // Mountain Climbers
      'hawkGym.plans.saturday.exercises.3', // Superman Hold
      'hawkGym.plans.saturday.exercises.4', // Crunches with Twist
      'hawkGym.plans.saturday.exercises.5'  // Stretching / Dehnung
    ]
  },
  sunday: {
    nameKey: 'hawkGym.plans.sunday.name',
    exercises: [
      'hawkGym.plans.sunday.exercises.0', // Light Walking / Leichtes Gehen
      'hawkGym.plans.sunday.exercises.1', // Stretching / Dehnung
      'hawkGym.plans.sunday.exercises.2', // Deep Breathing / Tiefes Atmen
      'hawkGym.plans.sunday.exercises.3', // Foam Rolling
      'hawkGym.plans.sunday.exercises.4', // Yoga
      'hawkGym.plans.sunday.exercises.5'  // Meditation
    ]
  }
}

// Timer configuration
export const TIMER_CONFIG = {
  exerciseDuration: 40,    // seconds
  restDuration: 20,        // seconds
  breakDuration: 60,       // seconds between rounds
  rounds: 2,               // number of rounds
  getReadyDuration: 5      // seconds to get ready before starting
}

// Get today's workout plan
export const getTodaysWorkout = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const today = new Date().getDay()
  const dayKey = days[today]
  return {
    dayKey,
    plan: WORKOUT_PLANS[dayKey]
  }
}