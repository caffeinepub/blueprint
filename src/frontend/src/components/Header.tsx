import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Menu, User, Users } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import SignInPrompt from './SignInPrompt';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function Header() {
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [signInAction, setSignInAction] = useState('access this feature');

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'User is already authenticated') {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/' });
  };

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      setSignInAction('view your profile');
      setShowSignInPrompt(true);
      return;
    }
    // Profile page not yet implemented
    setSignInAction('view your profile (coming soon)');
    setShowSignInPrompt(true);
  };

  const handleDiscoverClick = () => {
    if (!isAuthenticated) {
      setSignInAction('discover people');
      setShowSignInPrompt(true);
      return;
    }
    // Discover feature not yet implemented
    setSignInAction('discover people (coming soon)');
    setShowSignInPrompt(true);
  };

  const isAuthenticated = !!identity;

  return (
    <>
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {isAuthenticated ? (
                    <>
                      <DropdownMenuItem onClick={handleProfileClick}>
                        <User className="h-4 w-4 mr-2" />
                        My Profile (Coming Soon)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSignInAction('view your blueprints (coming soon)');
                        setShowSignInPrompt(true);
                      }}>
                        <img 
                          src="/assets/generated/blueprints-icon-transparent.dim_24x24.png" 
                          alt="Blueprint" 
                          className="h-4 w-4 mr-2"
                        />
                        My Blueprints (Coming Soon)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/studio" className="flex items-center gap-2">
                          <img 
                            src="/assets/generated/studio-icon-transparent.dim_24x24.png" 
                            alt="Studio" 
                            className="h-4 w-4"
                          />
                          Blueprint Studio
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => {
                      setSignInAction('access your profile and blueprints');
                      setShowSignInPrompt(true);
                    }}>
                      <User className="h-4 w-4 mr-2" />
                      Sign in to access features
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <img 
                    src="/assets/generated/blueprints-icon-transparent.dim_24x24.png" 
                    alt="Blueprint" 
                    className="h-5 w-5"
                  />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Blueprint
                </h1>
              </Link>
            </div>
            
            <div className="flex items-center gap-2">
              <TooltipProvider>
                {/* Discover People Button */}
                <Tooltip>
                  {isAuthenticated ? (
                    <DropdownMenu>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-primary/10"
                          >
                            <Users className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Discover People</p>
                      </TooltipContent>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => {
                          setSignInAction('search users (coming soon)');
                          setShowSignInPrompt(true);
                        }}>
                          <img 
                            src="/assets/generated/search-icon-transparent.dim_20x20.png" 
                            alt="Search" 
                            className="h-4 w-4 mr-2"
                          />
                          Search Users (Coming Soon)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSignInAction('see who to follow (coming soon)');
                          setShowSignInPrompt(true);
                        }}>
                          <img 
                            src="/assets/generated/trending-icon-transparent.dim_20x20.png" 
                            alt="Trending" 
                            className="h-4 w-4 mr-2"
                          />
                          Who to Follow (Coming Soon)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleProfileClick}>
                          <User className="h-4 w-4 mr-2" />
                          View My Profile (Coming Soon)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleDiscoverClick}
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-primary/10"
                        >
                          <Users className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Discover People (Sign in required)</p>
                      </TooltipContent>
                    </>
                  )}
                </Tooltip>

                {/* My Profile Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleProfileClick}
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-primary/10"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isAuthenticated ? 'My Profile (Coming Soon)' : 'My Profile (Sign in required)'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {!isAuthenticated ? (
                <Button
                  onClick={handleLogin}
                  disabled={loginStatus === 'logging-in'}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {loginStatus === 'logging-in' ? 'Connecting...' : 'Login'}
                </Button>
              ) : (
                <Button
                  onClick={handleLogout}
                  variant="outline"
                >
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <SignInPrompt 
        open={showSignInPrompt} 
        onOpenChange={setShowSignInPrompt}
        action={signInAction}
      />
    </>
  );
}
