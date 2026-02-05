import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, CheckCircle2, Circle } from 'lucide-react';
import { useGetCallerProjectBlueprints, useToggleTaskCompletion } from '../hooks/useCalendarData';
import { deriveTasksForDate } from '../lib/calendarTasks';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [enabledBlueprints, setEnabledBlueprints] = useState<Set<string>>(new Set());

  const { data: blueprints = [], isLoading: blueprintsLoading } = useGetCallerProjectBlueprints();
  const toggleTaskCompletion = useToggleTaskCompletion();

  // Initialize enabled blueprints when blueprints load
  useMemo(() => {
    if (blueprints.length > 0 && enabledBlueprints.size === 0) {
      setEnabledBlueprints(new Set(blueprints.map(bp => bp.id)));
    }
  }, [blueprints, enabledBlueprints.size]);

  // Derive tasks for the selected date from enabled blueprints
  const allTasks = useMemo(() => {
    const enabledBlueprintsList = blueprints.filter(bp => enabledBlueprints.has(bp.id));
    return deriveTasksForDate(enabledBlueprintsList, selectedDate);
  }, [blueprints, enabledBlueprints, selectedDate]);

  const handleToggleBlueprint = (blueprintId: string) => {
    setEnabledBlueprints(prev => {
      const next = new Set(prev);
      if (next.has(blueprintId)) {
        next.delete(blueprintId);
      } else {
        next.add(blueprintId);
      }
      return next;
    });
  };

  const handleToggleTask = (taskId: string, blueprintId: string) => {
    toggleTaskCompletion.mutate({
      taskId,
      blueprintId,
      date: selectedDate,
    });
  };

  const completedCount = allTasks.filter(task => task.completed).length;
  const totalCount = allTasks.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Daily Tasks Calendar</h1>
        <p className="text-muted-foreground">
          View and check off your daily tasks from your blueprints
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Date Picker & Blueprint Toggles */}
        <div className="lg:col-span-1 space-y-6">
          {/* Date Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Blueprint Toggles */}
          <Card>
            <CardHeader>
              <CardTitle>Filter by Blueprint</CardTitle>
              <CardDescription>
                Toggle blueprints to show or hide their tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blueprintsLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading blueprints...
                </div>
              ) : blueprints.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="mb-2">No blueprints found</p>
                  <p className="text-sm">Create a blueprint in the Studio to see tasks here</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {blueprints.map((blueprint) => (
                      <div
                        key={blueprint.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <Label
                            htmlFor={`blueprint-${blueprint.id}`}
                            className="font-medium cursor-pointer block truncate"
                          >
                            {blueprint.title}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {blueprint.steps.length} step{blueprint.steps.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Switch
                          id={`blueprint-${blueprint.id}`}
                          checked={enabledBlueprints.has(blueprint.id)}
                          onCheckedChange={() => handleToggleBlueprint(blueprint.id)}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Task List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tasks for {format(selectedDate, 'MMMM d, yyyy')}</CardTitle>
                  <CardDescription>
                    {totalCount > 0 ? (
                      <>
                        {completedCount} of {totalCount} completed
                      </>
                    ) : (
                      'No tasks for this date'
                    )}
                  </CardDescription>
                </div>
                {totalCount > 0 && (
                  <Badge variant={completedCount === totalCount ? 'default' : 'secondary'}>
                    {Math.round((completedCount / totalCount) * 100)}%
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {blueprints.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No blueprints yet</p>
                  <p className="text-sm">
                    Create a blueprint in the Studio to start tracking daily tasks
                  </p>
                </div>
              ) : enabledBlueprints.size === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">All blueprints are disabled</p>
                  <p className="text-sm">
                    Enable at least one blueprint to see tasks
                  </p>
                </div>
              ) : allTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No tasks for this date</p>
                  <p className="text-sm">
                    Tasks are derived from Daily Step and Checklist blocks in your blueprints
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    {/* Group tasks by blueprint */}
                    {Array.from(new Set(allTasks.map(t => t.blueprintId))).map(blueprintId => {
                      const blueprintTasks = allTasks.filter(t => t.blueprintId === blueprintId);
                      const blueprint = blueprints.find(bp => bp.id === blueprintId);
                      
                      if (!blueprint) return null;

                      return (
                        <div key={blueprintId} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-semibold">
                              {blueprint.title}
                            </Badge>
                            <Separator className="flex-1" />
                          </div>
                          
                          <div className="space-y-2">
                            {blueprintTasks.map((task) => (
                              <div
                                key={task.taskId}
                                className={cn(
                                  'flex items-start gap-3 p-3 border rounded-lg transition-all hover:bg-accent/50',
                                  task.completed && 'bg-accent/30'
                                )}
                              >
                                <Checkbox
                                  id={task.taskId}
                                  checked={task.completed}
                                  onCheckedChange={() => handleToggleTask(task.taskId, task.blueprintId)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <Label
                                    htmlFor={task.taskId}
                                    className={cn(
                                      'cursor-pointer font-medium block',
                                      task.completed && 'line-through text-muted-foreground'
                                    )}
                                  >
                                    {task.title}
                                  </Label>
                                  {task.description && (
                                    <p className={cn(
                                      'text-sm text-muted-foreground mt-1',
                                      task.completed && 'line-through'
                                    )}>
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {task.blockType === 'dailyStep' ? 'Daily Step' : 'Checklist Item'}
                                    </Badge>
                                    {task.stepName && (
                                      <span className="text-xs text-muted-foreground">
                                        from {task.stepName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
