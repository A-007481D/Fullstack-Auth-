// Login page has its own minimal layout — no sidebar, no navigation
// The root layout (app/layout.tsx) still applies above this
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
