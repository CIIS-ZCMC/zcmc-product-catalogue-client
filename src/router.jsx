import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'

import { AppShell } from './components/layout/app-shell'
import { RouteErrorPage, PageFallback } from './pages/route-fallbacks'
import ProductListPage from './pages/products/product-list-page'

// The list is the landing screen, so it ships in the main bundle; the rest load on demand.
const ProductDetailsPage = lazy(() => import('./pages/products/product-details-page'))
const ProductCreatePage = lazy(() => import('./pages/products/product-create-page'))
const ProductEditPage = lazy(() => import('./pages/products/product-edit-page'))
const DashboardPage = lazy(() => import('./pages/dashboard-page'))
const ActivityLogsPage = lazy(() => import('./pages/activity-logs-page'))
const PricingPage = lazy(() => import('./pages/pricing-page'))
const CategoriesPage = lazy(() => import('./pages/categories-page'))
const NamingPage = lazy(() => import('./pages/naming-page'))

const withSuspense = (element) => <Suspense fallback={<PageFallback />}>{element}</Suspense>

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="/products" replace /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'products/new', element: withSuspense(<ProductCreatePage />) },
      { path: 'products/:id', element: withSuspense(<ProductDetailsPage />) },
      { path: 'products/:id/edit', element: withSuspense(<ProductEditPage />) },
      { path: 'pricing', element: withSuspense(<PricingPage />) },
      { path: 'categories', element: withSuspense(<CategoriesPage />) },
      { path: 'naming', element: withSuspense(<NamingPage />) },
      { path: 'dashboard', element: withSuspense(<DashboardPage />) },
      { path: 'activity-logs', element: withSuspense(<ActivityLogsPage />) },
      { path: '*', element: <RouteErrorPage notFound /> },
    ],
  },
])
