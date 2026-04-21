"use client";

export function MockProvider({ children }: { children: React.ReactNode }) {
  // MSW mock disabled — real API calls go to http://localhost:3001
  return <>{children}</>;
}
