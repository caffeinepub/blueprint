import { Outlet } from '@tanstack/react-router';
import Header from './Header';
import TabNavigation from './TabNavigation';
import ConnectionStatus from './ConnectionStatus';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ConnectionStatus />
      <TabNavigation />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
