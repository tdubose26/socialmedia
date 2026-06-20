import type { ReactNode } from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';

export default function RequireAuth({ children }: { children: ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <div className="max-w-md mx-auto mt-24 bg-white rounded-2xl shadow p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">Sign in required</h1>
          <p className="text-slate-600 mb-6">You need an account to access this page.</p>
          <SignInButton mode="modal">
            <button className="bg-slate-900 text-white rounded-lg px-5 py-2.5 font-medium hover:bg-slate-800">
              Sign in
            </button>
          </SignInButton>
        </div>
      </SignedOut>
    </>
  );
}
