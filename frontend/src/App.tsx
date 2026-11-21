// Every page and who may see it.

import { Navigate, Route, Routes } from 'react-router'
import { RequireAuth, RequireRole } from './auth/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { ActivityPage } from './pages/ActivityPage'
import { InvestigationPage } from './pages/InvestigationPage'
import { InvestigationsPage } from './pages/InvestigationsPage'
import { LoginPage } from './pages/LoginPage'
import { NewInvestigationPage } from './pages/NewInvestigationPage'
import { UsersPage } from './pages/UsersPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Everything below needs a logged-in user, and shows the top bar. */}
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/investigations" element={<InvestigationsPage />}>
          <Route index element={<NewInvestigationPage />} />
          <Route path=":id" element={<InvestigationPage />} />
        </Route>
        <Route path="/users" element={<RequireRole role="org_admin"><UsersPage /></RequireRole>} />
        <Route path="/activity" element={<RequireRole role="org_admin"><ActivityPage /></RequireRole>} />
      </Route>

      <Route path="*" element={<Navigate to="/investigations" replace />} />
    </Routes>
  )
}
