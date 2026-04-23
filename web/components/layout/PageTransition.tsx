interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="animate-fade-in motion-reduce:animate-none">
      {children}
    </div>
  );
}
