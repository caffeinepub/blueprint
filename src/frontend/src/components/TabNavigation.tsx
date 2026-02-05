import { Link, useLocation } from '@tanstack/react-router';
import { Home, Search, Bell, MessageSquare, Sparkles, ShoppingBag, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Explore', path: '/explore', icon: Search },
  { name: 'Marketplace', path: '/marketplace', icon: ShoppingBag },
  { name: 'Calendar', path: '/calendar', icon: CalendarDays },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Chat', path: '/chat', icon: MessageSquare },
  { name: 'My Blueprints', path: '/my-blueprints', icon: 'blueprint' },
  { name: 'Studio', path: '/studio', icon: Sparkles },
];

export default function TabNavigation() {
  const location = useLocation();

  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-[73px] z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap',
                  'hover:text-primary hover:bg-accent/50',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {tab.icon === 'blueprint' ? (
                  <img 
                    src="/assets/generated/blueprints-icon-transparent.dim_24x24.png" 
                    alt="Blueprint" 
                    className="h-4 w-4"
                  />
                ) : (
                  (() => {
                    const Icon = tab.icon as React.ComponentType<{ className?: string }>;
                    return <Icon className="h-4 w-4" />;
                  })()
                )}
                <span>{tab.name}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
