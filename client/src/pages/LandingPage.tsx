import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-4">
        AI Social Media Content Generator
      </h1>
      <p className="text-slate-600 text-lg mb-10">
        Generate a week of platform-ready social posts and export them as a CSV ready for
        GoHighLevel Social Planner.
      </p>

      <SignedOut>
        <div className="flex items-center justify-center gap-3">
          <SignUpButton mode="modal">
            <button className="bg-slate-900 text-white rounded-lg px-6 py-3 font-medium hover:bg-slate-800">
              Get started
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="bg-white border border-slate-300 rounded-lg px-6 py-3 font-medium hover:bg-slate-100">
              Sign in
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <Link
          to="/dashboard"
          className="inline-block bg-slate-900 text-white rounded-lg px-6 py-3 font-medium hover:bg-slate-800"
        >
          Go to dashboard
        </Link>
      </SignedIn>
    </div>
  );
}
