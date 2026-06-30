import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Loader } from '@/components/ui'
import { AppLayout } from '@/layouts/app-layout'

const LandingPage = lazy(() => import('@/pages/landing-page').then((module) => ({ default: module.LandingPage })))
const DashboardPage = lazy(() => import('@/pages/dashboard-page').then((module) => ({ default: module.DashboardPage })))
const DrivePage = lazy(() => import('@/pages/drive-page').then((module) => ({ default: module.DrivePage })))
const ViewerPage = lazy(() => import('@/pages/viewer-page').then((module) => ({ default: module.ViewerPage })))
const ComposerPage = lazy(() => import('@/pages/composer-page').then((module) => ({ default: module.ComposerPage })))
const SettingsPage = lazy(() => import('@/pages/settings-page').then((module) => ({ default: module.SettingsPage })))
const AboutPage = lazy(() => import('@/pages/about-page').then((module) => ({ default: module.AboutPage })))
const LegalPage = lazy(() => import('@/pages/legal-page').then((module) => ({ default: module.LegalPage })))
const NotFoundPage = lazy(() => import('@/pages/not-found-page').then((module) => ({ default: module.NotFoundPage })))

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/privacy', element: <LegalPage type="privacy" /> },
  { path: '/terms', element: <LegalPage type="terms" /> },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'drive', element: <DrivePage /> },
      { path: 'viewer/:id', element: <ViewerPage /> },
      { path: 'composer', element: <ComposerPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export function AppRouter() {
  return <Suspense fallback={<Loader />}><RouterProvider router={router} /></Suspense>
}
