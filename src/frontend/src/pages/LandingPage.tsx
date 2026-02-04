import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Sparkles, Zap } from 'lucide-react';
import Header from '../components/Header';
import { toast } from 'sonner';

export default function LandingPage() {
  const handleGenerate = () => {
    toast.info('Blueprint creation feature coming soon!', {
      description: 'Sign in and visit the Studio to start building your blueprint.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />

      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <div className="inline-block mb-4">
              <img 
                src="/assets/generated/hero-general-blueprint.dim_800x400.png" 
                alt="Blueprint Platform Hero" 
                className="rounded-2xl shadow-2xl max-w-full h-auto"
              />
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Blueprint: Create{' '}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                step-by-step plans
              </span>
              {' '}for anything
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Build, share, and discover structured blueprints for any goal. From learning new skills to launching projects, create actionable roadmaps that guide others to success.
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <div className="bg-card border border-border rounded-2xl shadow-lg p-8 space-y-6">
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-semibold">Ready to get started?</h3>
                <p className="text-muted-foreground">
                  Create your first blueprint and share your expertise with the community
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                size="lg"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200"
              >
                Start Building
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Step-by-Step Plans</h3>
              <p className="text-sm text-muted-foreground">
                Break down any goal into actionable steps and phases
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Share & Discover</h3>
              <p className="text-sm text-muted-foreground">
                Publish your blueprints and explore plans from others
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Follow blueprints and monitor your journey to success
              </p>
            </div>
          </div>
        </div>
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
