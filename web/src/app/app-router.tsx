import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './protected-route'
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
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
