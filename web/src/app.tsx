import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/app-providers'
import { router } from '@/app/app-router'

function App() {
  return <AppProviders><RouterProvider router={router} /></AppProviders>
}

export default App
