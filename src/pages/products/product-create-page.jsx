import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { api } from '@/services/api'
import { PageHeader } from '@/components/layout/page-header'
import { ProductForm } from '@/components/products/product-form'
import { useReturnTo } from '@/hooks/use-return-to'
import { BackLink } from './back-link'

export default function ProductCreatePage() {
  const navigate = useNavigate()
  const returnTo = useReturnTo()
  const location = useLocation()

  const handleSubmit = async (payload) => {
    const res = await api.createProduct(payload)
    const created = res?.product
    toast.success(created?.erp_item_code ? `Product ${created.erp_item_code} created.` : 'Product created.')
    navigate(created?.id ? `/products/${created.id}` : returnTo, { replace: true, state: { from: returnTo } })
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Add product"
        description="Register a standardized item. Fields marked * are required."
      >
        <BackLink to={returnTo} />
      </PageHeader>
      <ProductForm
        mode="create"
        prefillDescription={location.state?.prefillDescription}
        onSubmit={handleSubmit}
        onCancel={() => navigate(returnTo)}
      />
    </div>
  )
}
