import type { ProjectBlueprintView, Block } from '../backend';

export interface DerivedTask {
  taskId: string;
  blueprintId: string;
  blueprintTitle: string;
  stepName: string;
  title: string;
  description?: string;
  blockType: 'dailyStep' | 'checklist';
  completed: boolean;
}

/**
 * Derives tasks from project blueprints for a specific date.
 * Tasks are generated from:
 * - dailyStep blocks: one task per block
 * - checklist blocks: one task per checklist item
 */
export function deriveTasksForDate(
  blueprints: ProjectBlueprintView[],
  date: Date
): DerivedTask[] {
  const tasks: DerivedTask[] = [];
  const dateKey = formatDateKey(date);

  // Get completion state from localStorage
  const completionState = getTaskCompletionForDate(dateKey);

  for (const blueprint of blueprints) {
    for (const step of blueprint.steps) {
      for (const block of step.blocks) {
        if (block.blockType === 'dailyStep') {
          // Parse dailyStep block
          const taskId = `${blueprint.id}-${block.id}`;
          const title = parseDailyStepTitle(block);
          const description = parseDailyStepDescription(block);

          tasks.push({
            taskId,
            blueprintId: blueprint.id,
            blueprintTitle: blueprint.title,
            stepName: step.name,
            title,
            description,
            blockType: 'dailyStep',
            completed: completionState[taskId] || false,
          });
        } else if (block.blockType === 'checklist') {
          // Parse checklist block
          const checklistItems = parseChecklistItems(block);
          const checklistTitle = parseChecklistTitle(block);

          checklistItems.forEach((item, index) => {
            const taskId = `${blueprint.id}-${block.id}-item-${index}`;
            
            tasks.push({
              taskId,
              blueprintId: blueprint.id,
              blueprintTitle: blueprint.title,
              stepName: step.name,
              title: `${checklistTitle}: ${item}`,
              blockType: 'checklist',
              completed: completionState[taskId] || false,
            });
          });
        }
      }
    }
  }

  return tasks;
}

/**
 * Parse dailyStep block to extract title
 */
function parseDailyStepTitle(block: Block): string {
  try {
    // Try to parse as JSON first (new format)
    const parsed = JSON.parse(block.content);
    if (parsed.title) return parsed.title;
  } catch {
    // Fallback: use content directly or extract from options
    if (block.content) return block.content;
  }

  // Check options array for title
  if (block.options && block.options.length > 0) {
    return block.options[0];
  }

  return 'Daily Activity';
}

/**
 * Parse dailyStep block to extract description
 */
function parseDailyStepDescription(block: Block): string | undefined {
  try {
    const parsed = JSON.parse(block.content);
    if (parsed.description) return parsed.description;
  } catch {
    // No JSON description
  }

  // Check options array for description
  if (block.options && block.options.length > 1) {
    return block.options[1];
  }

  return undefined;
}

/**
 * Parse checklist block to extract title
 */
function parseChecklistTitle(block: Block): string {
  try {
    const parsed = JSON.parse(block.content);
    if (parsed.title) return parsed.title;
  } catch {
    if (block.content) return block.content;
  }

  return 'Checklist';
}

/**
 * Parse checklist block to extract items
 */
function parseChecklistItems(block: Block): string[] {
  try {
    const parsed = JSON.parse(block.content);
    if (parsed.items && Array.isArray(parsed.items)) {
      return parsed.items;
    }
  } catch {
    // Fallback to options array
  }

  // Use options array as items
  if (block.options && block.options.length > 0) {
    return block.options;
  }

  return [];
}

/**
 * Format date as YYYY-MM-DD for localStorage key
 */
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get task completion state for a specific date from localStorage
 */
function getTaskCompletionForDate(dateKey: string): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(`calendar-tasks-${dateKey}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to read task completion from localStorage:', error);
  }
  return {};
}

/**
 * Save task completion state for a specific date to localStorage
 */
export function saveTaskCompletion(
  dateKey: string,
  taskId: string,
  completed: boolean
): void {
  try {
    const current = getTaskCompletionForDate(dateKey);
    current[taskId] = completed;
    localStorage.setItem(`calendar-tasks-${dateKey}`, JSON.stringify(current));
  } catch (error) {
    console.error('Failed to save task completion to localStorage:', error);
  }
}

/**
 * Format date for localStorage key (exported for use in hooks)
 */
export function getDateKey(date: Date): string {
  return formatDateKey(date);
}
