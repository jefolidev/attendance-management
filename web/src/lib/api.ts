import axios from 'axios'
import { toast } from 'sonner'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ponto-digital:access-token')

  if (token) config.headers.Authorization = `Bearer ${token}`

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.error || 'Não foi possível concluir a solicitação.'

    if (status === 401) {
      localStorage.removeItem('ponto-digital:access-token')
      localStorage.removeItem('ponto-digital:employee')
      window.dispatchEvent(new Event('ponto-digital:auth-expired'))
    } else {
      toast.error(message)
    }

    return Promise.reject(error)
  },
)

export { api }
