import { useNavigate, useParams } from 'react-router'
import { CircleAlert, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/services/api'
import { useAuth } from '@/context/auth-context'
import { useProduct } from '@/hooks/use-product'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { ListState } from '@/components/products/list-state'
import { ProductForm } from '@/components/products/product-form'
import { PageFallback } from '../route-fallbacks'
import { useReturnTo } from '@/hooks/use-return-to'
import { BackLink } from './back-link'

export default function ProductEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const returnTo = useReturnTo()
  const { isAdmin } = useAuth()
  const { status, data, error, reload } = useProduct(id)
  const product = data?.product
  const detailsPath = `/products/${id}`

  const handleSubmit = async (payload) => {
    await api.updateProduct(id, payload)
    toast.success('Changes saved.')
    navigate(detailsPath, { replace: true, state: { from: returnTo } })
  }

  if (status === 'loading') return <PageFallback />

  if (status === 'error') {
    const notFound = error?.status === 404
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <BackLink to={returnTo} />
        <ListState
          role="alert"
          headingLevel={1}
          icon={CircleAlert}
          title={notFound ? 'Product not found' : 'Product could not be loaded'}
          description={notFound ? 'It may have been deleted.' : error?.message}
        >
          {!notFound && (
            <Button onClick={reload}>
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
          )}
        </ListState>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader title="Edit product" description={product?.item_description}>
        <BackLink to={detailsPath} state={{ from: returnTo }}>
          Back to product
        </BackLink>
      </PageHeader>
      <ProductForm
        // Remount if a different product loads so defaults are rebuilt.
        key={product?.id}
        mode="edit"
        product={product}
        requirePassword={!isAdmin}
        onSubmit={handleSubmit}
        onCancel={() => navigate(detailsPath, { state: { from: returnTo } })}
      />
    </div>
  )
}
