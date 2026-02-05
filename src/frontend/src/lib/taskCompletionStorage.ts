/**
 * Local storage utilities for calendar task completion and blueprint preferences
 */

const BLUEPRINT_PREFS_KEY = 'calendar-blueprint-preferences';

export interface BlueprintPreferences {
  enabledBlueprints: string[];
}

/**
 * Get blueprint preferences from localStorage
 */
export function getBlueprintPreferences(): BlueprintPreferences {
  try {
    const stored = localStorage.getItem(BLUEPRINT_PREFS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to read blueprint preferences:', error);
  }
  return { enabledBlueprints: [] };
}

/**
 * Save blueprint preferences to localStorage
 */
export function saveBlueprintPreferences(prefs: BlueprintPreferences): void {
  try {
    localStorage.setItem(BLUEPRINT_PREFS_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save blueprint preferences:', error);
  }
}

/**
 * Toggle a blueprint in preferences
 */
export function toggleBlueprintEnabled(blueprintId: string): void {
  const prefs = getBlueprintPreferences();
  const index = prefs.enabledBlueprints.indexOf(blueprintId);
  
  if (index > -1) {
    prefs.enabledBlueprints.splice(index, 1);
  } else {
    prefs.enabledBlueprints.push(blueprintId);
  }
  
  saveBlueprintPreferences(prefs);
}
