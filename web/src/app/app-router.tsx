import { createBrowserRouter } from 'react-router-dom'
import { AdminRoute, ProtectedRoute } from './protected-route'
import { AdminDashboardPage } from '@/pages/admin-dashboard-page'
import { AdminRecordsPage } from '@/pages/admin-records-page'
import { AdminSelectProfilePage } from '@/pages/admin-select-profile-page'
import { AdminSettingsPage } from '@/pages/admin-settings-page'
import { AdminUserDetailPage } from '@/pages/admin-user-detail-page'
import { AdminUsersPage } from '@/pages/admin-users-page'
import { AppShell } from '@/components/layout/app-shell'
import { DelaysPage } from '@/pages/delays-page'
import { HistoryPage } from '@/pages/history-page'
import { HomePage } from '@/pages/home-page'
import { HoursPage } from '@/pages/hours-page'
import { LoginPage } from '@/pages/login-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { SettingsPage } from '@/pages/settings-page'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'historico', element: <HistoryPage /> },
          { path: 'banco-de-horas', element: <HoursPage /> },
          { path: 'atrasos', element: <DelaysPage /> },
          { path: 'configuracoes', element: <SettingsPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'users/:id', element: <AdminUserDetailPage /> },
          { path: 'records', element: <AdminRecordsPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
          { path: 'select-profile', element: <AdminSelectProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
