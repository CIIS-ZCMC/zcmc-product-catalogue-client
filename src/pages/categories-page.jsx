import { useNavigate } from 'react-router'

import { useAuth } from '@/context/auth-context'
import { LegacyTheme } from '@/components/legacy-theme'
import CategoryExplorerView from '@/components/CategoryExplorerView'

// Existing MUI UNSPSC explorer, mounted inside the new shell. "Show products" opens the filtered list.
// Only administrators can add, edit or delete categories; everyone else browses read-only.
export default function CategoriesPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  return (
    <LegacyTheme>
      <CategoryExplorerView
        canEdit={isAdmin}
        onFilterProductsByCategory={(key) => navigate(`/products?category_key=${key}`)}
      />
    </LegacyTheme>
  )
}
