import { Routes, Route, Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import GeneratePage from './pages/GeneratePage';
import HistoryPage from './pages/HistoryPage';
import RequireAuth from './components/RequireAuth';

function NavBar() {
  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold text-slate-900">
          Social Content Generator
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <SignedIn>
            <Link to="/dashboard" className="text-slate-700 hover:text-slate-900">
              Dashboard
            </Link>
            <Link to="/generate" className="text-slate-700 hover:text-slate-900">
              Generate
            </Link>
            <Link to="/history" className="text-slate-700 hover:text-slate-900">
              History
            </Link>
            <Link to="/settings" className="text-slate-700 hover:text-slate-900">
              Settings
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <span className="text-slate-500">Not signed in</span>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/generate"
          element={
            <RequireAuth>
              <GeneratePage />
            </RequireAuth>
          }
        />
        <Route
          path="/history"
          element={
            <RequireAuth>
              <HistoryPage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          }
        />
      </Routes>
    </div>
  );
}
