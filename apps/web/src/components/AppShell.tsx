import { LogOut, Menu, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { auth, useAuthStore } from "../features/auth/auth";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const activeContext = useAuthStore((state) => state.activeContext);
  const navigate = useNavigate();
  const signOut = async () => {
    await auth.logout();
    navigate("/login", { replace: true });
  };
  return (
    <div className="app-shell">
      <button
        className="mobile-menu"
        type="button"
        aria-label="Mở điều hướng"
        onClick={() => setOpen(true)}
      >
        <Menu size={22} />
      </button>
      {open && (
        <button
          className="nav-scrim"
          type="button"
          aria-label="Đóng điều hướng"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">TKD</div>
          <div>
            <strong>Văn Quán</strong>
            <span>Báo cáo quản trị</span>
          </div>
          <button
            className="close-nav"
            type="button"
            aria-label="Đóng điều hướng"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav aria-label="Điều hướng báo cáo">
          <NavLink
            to="/analytics/student-movements"
            onClick={() => setOpen(false)}
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Biến động học viên
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <span>{activeContext?.fullName ?? "Phiên đăng nhập"}</span>
          <button type="button" onClick={() => void signOut()}>
            <LogOut size={17} /> Đăng xuất
          </button>
        </div>
      </aside>
      <main id="main-content" className="app-main">
        <a className="skip-link" href="#content">
          Đi tới nội dung
        </a>
        <div id="content">{children}</div>
      </main>
    </div>
  );
}
