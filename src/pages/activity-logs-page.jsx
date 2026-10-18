import { LegacyTheme } from '@/components/legacy-theme'
import ActivityLogsView from '@/components/ActivityLogsView'

// Existing MUI activity log view, mounted inside the new shell unchanged.
export default function ActivityLogsPage() {
  return (
    <LegacyTheme>
      <ActivityLogsView />
    </LegacyTheme>
  )
}
