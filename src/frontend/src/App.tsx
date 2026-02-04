import { useState } from 'react';
import { RouterProvider, createRouter, createRootRoute, createRoute, redirect } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import LoadingScreen from './components/LoadingScreen';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import MarketplacePage from './pages/MarketplacePage';
import BlueprintDetailsPage from './pages/BlueprintDetailsPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import ChatPage from './pages/ChatPage';
import MyBlueprintsPage from './pages/MyBlueprintsPage';
import StudioPage from './pages/StudioPage';

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  beforeLoad: () => {
    throw redirect({ to: '/' });
  },
});

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/explore',
  component: ExplorePage,
});

const marketplaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/marketplace',
  component: MarketplacePage,
});

const blueprintDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/marketplace/$blueprintId',
  component: BlueprintDetailsPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
});

const userProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/$userId',
  component: ProfilePage,
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notifications',
  component: NotificationsPage,
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat',
  component: ChatPage,
});

const myBlueprintsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/my-blueprints',
  component: MyBlueprintsPage,
});

const studioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/studio',
  component: StudioPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
  exploreRoute,
  marketplaceRoute,
  blueprintDetailsRoute,
  profileRoute,
  userProfileRoute,
  notificationsRoute,
  chatRoute,
  myBlueprintsRoute,
  studioRoute,
]);

const router = createRouter({ 
  routeTree,
  defaultNotFoundComponent: () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return null;
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const [showLoading, setShowLoading] = useState(true);

  return (
    <>
      {showLoading && <LoadingScreen onComplete={() => setShowLoading(false)} />}
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default App;
