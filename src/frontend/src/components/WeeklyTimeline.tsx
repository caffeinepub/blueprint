import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

interface WeeklyTimelineProps {
  weeks: number;
}

const phaseData = [
  {
    weeks: [1, 2],
    title: 'Foundation',
    description: 'Set calorie deficit, start 3x cardio per week',
    color: 'from-primary to-primary/80',
  },
  {
    weeks: [3, 4],
    title: 'Build',
    description: 'Add 2x strength training, maintain deficit',
    color: 'from-primary/90 to-primary/70',
  },
  {
    weeks: [5, 6],
    title: 'Intensify',
    description: 'Increase to 4x cardio, track macros',
    color: 'from-primary/80 to-primary/60',
  },
  {
    weeks: [7, 8],
    title: 'Finish Strong',
    description: 'Final push, prep maintenance plan',
    color: 'from-primary/70 to-primary/50',
  },
];

export default function WeeklyTimeline({ weeks }: WeeklyTimelineProps) {
  const relevantPhases = phaseData.filter((phase) => 
    phase.weeks.some((week) => week <= weeks)
  );

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img src="/assets/generated/milestone-icon-transparent.dim_48x48.png" alt="Timeline" className="h-6 w-6" />
          Weekly Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {relevantPhases.map((phase, index) => {
            const displayWeeks = phase.weeks.filter((week) => week <= weeks);
            const weekRange = displayWeeks.length === 1 
              ? `Week ${displayWeeks[0]}`
              : `Week ${displayWeeks[0]}-${displayWeeks[displayWeeks.length - 1]}`;

            return (
              <div key={index} className="relative">
                {index < relevantPhases.length - 1 && (
                  <div className="absolute left-6 top-14 w-0.5 h-8 bg-gradient-to-b from-primary/50 to-primary/30" />
                )}
                
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br ${phase.color} flex items-center justify-center shadow-lg`}>
                    <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                  
                  <div className="flex-1 pb-4">
                    <div className="bg-card border border-border/50 rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{phase.title}</h3>
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {weekRange}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {phase.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
