import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import { friendlyError } from './api/errors'
import { AuthProvider } from './auth/AuthContext'
import { ToastProvider, toastBridge } from './components/ui/Toaster'
import App from './App.tsx'
import './index.css'
import './styles/ui.css'
import './styles/app.css'
import './styles/brand.css'

// React Query: one cache for all backend data.
// API feedback is automatic (design kit: global-toasts): every failed request shows a safe,
// plain toast (friendlyError), and a mutation with meta.successMessage toasts on success.
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => toastBridge.error(friendlyError(error)),
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (!mutation.meta?.skipToast) toastBridge.error(friendlyError(error))
    },
    onSuccess: (_data, _vars, _ctx, mutation) => {
      const message = mutation.meta?.successMessage
      if (typeof message === 'string') toastBridge.success(message)
    },
  }),
  defaultOptions: {
    queries: {
      // Retry once on network or server trouble, never on 4xx (it would fail again).
      retry: (failureCount, error) =>
        failureCount < 1 && !(axios.isAxiosError(error) && (error.response?.status ?? 500) < 500),
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
