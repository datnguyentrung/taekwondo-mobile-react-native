import { type ReactNode, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { auth, useAuthStore } from './features/auth/auth'
import { LoginPage } from './features/auth/LoginPage'
import { ReportPage } from './features/analytics/ReportPage'
import './App.scss'

function Protected({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()
  if (status === 'bootstrapping') return <div className="boot-screen">Đang khởi tạo phiên làm việc...</div>
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (status === 'selecting-context') return <ContextSelection />
  return <>{children}</>
}

function ContextSelection() {
  const contexts = useAuthStore((state) => state.availableContexts)
  const navigate = useNavigate()
  return <main className="context-page"><section className="context-card"><p>Taekwondo Văn Quán</p><h1>Chọn ngữ cảnh làm việc</h1><span>Chọn hồ sơ cần dùng trước khi xem dữ liệu vận hành.</span><div>{contexts.map((context) => <button key={context.userPersonId} type="button" onClick={() => void auth.switchContext(context.userPersonId).then(() => navigate('/analytics/student-movements'))}>{context.fullName ?? context.personCode ?? 'Hồ sơ'}</button>)}</div></section></main>
}

function ReportRoute() { return <ReportPage /> }

export default function App() {
  useEffect(() => { void auth.bootstrap() }, [])
  return <Routes><Route path="/login" element={<LoginPage />} /><Route path="/analytics/student-movements" element={<Protected><AppShell><ReportRoute /></AppShell></Protected>} /><Route path="*" element={<Navigate to="/analytics/student-movements" replace />} /></Routes>
}
