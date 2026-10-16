import { useNavigate } from 'react-router'

import UniformNamingTool from '@/components/UniformNamingTool'

// Existing MUI naming assistant. "Use in Product Form" opens Add product with the name pre-filled.
export default function NamingPage() {
  const navigate = useNavigate()
  return (
    <UniformNamingTool
      onSendToProductModal={(description) => navigate('/products/new', { state: { prefillDescription: description } })}
    />
  )
}
