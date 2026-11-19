import './globals.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body suppressHydrationWarning>{children}</body></html>;
}
