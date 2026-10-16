import { useNavigate } from 'react-router'

import CategoryExplorerView from '@/components/CategoryExplorerView'

// Existing MUI UNSPSC explorer, mounted inside the new shell. "Show products" opens the filtered list.
export default function CategoriesPage() {
  const navigate = useNavigate()
  return <CategoryExplorerView onFilterProductsByCategory={(key) => navigate(`/products?category_key=${key}`)} />
}
