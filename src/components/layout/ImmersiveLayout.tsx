import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/auth';

export default function ImmersiveLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="lms-main">
            <header className="lms-topbar">
                <div className="lms-topbar-title">Student Workspace</div>
                <div className="lms-topbar-actions">
                    {user && (
                        <div className="lms-row">
                            <div className="lms-user-avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                            <span className="lms-note">{user.name}</span>
                        </div>
                    )}
                    <button className="lms-button-ghost" onClick={handleLogout}>
                        <span>Dang xuat</span>
                    </button>
                </div>
            </header>
            <main className="lms-content">
                <Outlet />
            </main>
        </div>
    );
}
