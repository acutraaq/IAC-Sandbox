import { Nav } from "./Nav";

interface PageShellProps {
  children: React.ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <>
      <header>
        <Nav />
      </header>
      <main className="flex-1 pt-16">{children}</main>
    </>
  );
}
