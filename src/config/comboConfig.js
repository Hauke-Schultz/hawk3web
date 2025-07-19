// Combo system configuration
export const COMBO_CONFIG = {
  // Base combo settings
  minComboLength: 3,        // Minimum matches for combo
  maxComboLength: 10,       // Maximum combo multiplier
  comboTimeout: 5000,       // Time before combo resets (ms)

  // Scoring multipliers
  baseMultiplier: 1.5,      // Base combo multiplier
  multiplierIncrement: 0.5, // Increment per combo level
  maxMultiplier: 5.0,       // Maximum possible multiplier

  // Visual feedback settings
  animationDuration: 1000,  // Animation duration (ms)
  pulseIntensity: 0.2,      // Pulse effect intensity

  // Combo messages for different levels
  comboMessage: {
    2: 'GO GO COMBO!',
    5: 'AMAZING COMBO!',
    10: 'INCREDIBLE COMBO!',
    15: 'LEGENDARY COMBO!'
  },

  // Combo colors for different levels
  comboColor: {
    0: '#6B7280',  // Gray when inactive
    1: '#6B7280',  // Gray
    2: '#fdcb6e',  // Yellow
    3: '#e17055',  // Orange
    4: '#e84393',  // Pink
    5: '#a29bfe',  // Purple
    6: '#6c5ce7',  // Deep purple
    7: '#fd79a8',  // Hot pink
    8: '#e84393',  // Magenta
    9: '#9b59b6',  // Royal purple
    10: '#8e44ad', // Deep purple
    11: '#2c3e50', // Dark blue
    12: '#34495e', // Navy blue
    13: '#16a085', // Teal
    14: '#27ae60', // Green
    15: '#2980b9'  // Blue
  }
}