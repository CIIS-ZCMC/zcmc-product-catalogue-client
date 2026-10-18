import { LegacyTheme } from '@/components/legacy-theme'
import ImportExportModal from '@/components/ImportExportModal'

// Lazy-loaded entry for the MUI CSV import dialog, so MUI stays out of the product list's bundle.
export default function ImportExportDialog(props) {
  return (
    <LegacyTheme>
      <ImportExportModal {...props} />
    </LegacyTheme>
  )
}
