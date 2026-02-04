import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import ProfileSetupModal from '../components/ProfileSetupModal';
import SignInPrompt from '../components/SignInPrompt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import StepBasedBlueprintBuilder from '../components/StepBasedBlueprintBuilder';

export default function StudioPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <ProfileSetupModal open={showProfileSetup} />
      <SignInPrompt 
        open={showSignInPrompt} 
        onOpenChange={setShowSignInPrompt}
        action="create blueprints"
      />

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {!isAuthenticated ? (
          <Card className="mt-12">
            <CardContent className="py-12 text-center space-y-4">
              <Sparkles className="h-16 w-16 mx-auto text-primary opacity-50" />
              <h2 className="text-2xl font-bold">Create Your Blueprint</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Sign in to access the Blueprint Studio and create step-by-step plans for any goal or project to share with the community.
              </p>
              <Button
                onClick={() => setShowSignInPrompt(true)}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                Sign In to Create
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Blueprint Studio</h1>
              </div>
              <p className="text-muted-foreground">
                Create your step-by-step blueprint with our powerful builder
              </p>
            </div>

            <StepBasedBlueprintBuilder />

            <Card>
              <CardHeader>
                <CardTitle>What is a Step-Based Blueprint?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  A Step-Based Blueprint is your structured plan organized into sequential steps or phases. Each step can contain multiple content blocks:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Steps/Phases</strong> - Organize your blueprint into logical sections (e.g., "Day 1", "Week 1", "Phase 1")</li>
                  <li><strong>Text blocks</strong> - For instructions and descriptions</li>
                  <li><strong>Question blocks</strong> - For user input and personalization</li>
                  <li><strong>Dropdown blocks</strong> - For multiple choice selections</li>
                  <li><strong>Checklist blocks</strong> - For task lists and goals</li>
                  <li><strong>Daily Step blocks</strong> - For structured day-by-day activities</li>
                </ul>
                <p className="mt-4 font-medium text-foreground">
                  Drag and drop steps to reorder them, rename steps to match your structure (days, hours, phases), and manage blocks within each step independently. Create a blueprint that perfectly guides users through their journey step by step.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2026. Built with ❤️ using{' '}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
