import { ThemeProvider } from '@mui/material'

import { theme } from '@/theme'

// MUI theme for the screens not yet moved to shadcn/ui. Each legacy page mounts it itself,
// so MUI loads with those pages instead of with the sign-in screen.
export function LegacyTheme({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
