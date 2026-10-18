import { useNavigate } from 'react-router'

import { LegacyTheme } from '@/components/legacy-theme'
import CategoryExplorerView from '@/components/CategoryExplorerView'

// Existing MUI UNSPSC explorer, mounted inside the new shell. "Show products" opens the filtered list.
export default function CategoriesPage() {
  const navigate = useNavigate()
  return (
    <LegacyTheme>
      <CategoryExplorerView onFilterProductsByCategory={(key) => navigate(`/products?category_key=${key}`)} />
    </LegacyTheme>
  )
}
