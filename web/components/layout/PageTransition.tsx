"use client";

import { useEffect, useState } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div
      className={`transition-[opacity,transform] ease-out motion-reduce:transition-none ${
        visible
          ? "opacity-100 translate-y-0 duration-150"
          : "opacity-0 translate-y-1 duration-0"
      }`}
    >
      {children}
    </div>
  );
}
