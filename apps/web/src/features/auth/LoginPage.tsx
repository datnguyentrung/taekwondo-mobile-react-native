import { type FormEvent, useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Phone } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { auth } from './auth'

function errorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'response' in error) return 'Số điện thoại hoặc mật khẩu không đúng. Vui lòng thử lại.'
  return 'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.'
}

export function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!/^0\d{9,10}$/.test(phoneNumber.trim())) { setError('Nhập số điện thoại gồm 10-11 chữ số và bắt đầu bằng số 0.'); return }
    if (password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return }
    setBusy(true); setError('')
    try { await auth.login(phoneNumber.trim(), password); navigate((location.state as { from?: string } | null)?.from ?? '/analytics/overview', { replace: true }) } catch (reason) { setError(errorMessage(reason)) } finally { setBusy(false) }
  }
  return <main className="login-page"><section className="login-brand"><div className="login-mark">TKD</div><p>Taekwondo Văn Quán</p><h1>Điều hành võ đường bằng dữ liệu rõ ràng.</h1><span>Báo cáo dành cho đội ngũ quản lý và vận hành.</span></section><section className="login-panel"><form onSubmit={(event) => void submit(event)} noValidate><div className="login-title"><p>Chào mừng trở lại</p><h2>Đăng nhập hệ thống</h2></div>{error && <p className="form-error" role="alert">{error}</p>}<label><span>Số điện thoại</span><div className="field"><Phone size={18} aria-hidden="true" /><input autoComplete="tel" inputMode="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="0xxxxxxxxx" /></div></label><label><span>Mật khẩu</span><div className="field"><LockKeyhole size={18} aria-hidden="true" /><input autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" /><button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label><button className="primary-button login-submit" type="submit" disabled={busy}>{busy ? 'Đang đăng nhập...' : 'Đăng nhập'}</button><p className="login-help">Quên mật khẩu hoặc cần hỗ trợ? Liên hệ quản trị viên trung tâm.</p></form></section></main>
}
