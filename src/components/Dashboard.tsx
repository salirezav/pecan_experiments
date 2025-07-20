import { DashboardLayout } from "./DashboardLayout"

interface DashboardProps {
  onLogout: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  return <DashboardLayout onLogout={onLogout} />
}
