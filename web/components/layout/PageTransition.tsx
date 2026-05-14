interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <div
      className="motion-reduce:animate-none"
      style={{ animation: "fade-in 150ms ease-out both" }}
    >
      {children}
    </div>
  );
}
