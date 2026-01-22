import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/auth';

interface NavItem {
    path: string;
    label: string;
    hint?: string;
    roles?: string[];
    badge?: string;
}

const navItems: NavItem[] = [
    { path: '/chat', label: 'Chat AI', hint: 'Hoi dap nhanh' },
    { path: '/exam', label: 'Thi Online', badge: 'Hot', hint: 'De thi AI' },
    { path: '/practice', label: 'On Tap', badge: 'New', hint: 'Luyen tap' },
    { path: '/library', label: 'Thu Vien', hint: 'Tai lieu' },
    { path: '/settings', label: 'Cai Dat', hint: 'Ca nhan hoa' },
    { path: '/help', label: 'Huong Dan', hint: 'Tro giup' },
];

export default function MainLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [collapsed, setCollapsed] = React.useState(() => {
        return localStorage.getItem('sidebar-collapsed') === 'true';
    });

    const userRole = user?.role || 'student';
    const filteredNavItems = navItems.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(userRole);
    });

    const currentItem = filteredNavItems.find(item =>
        location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
    );
    const pageTitle = currentItem?.label || 'Workspace';

    const toggleCollapse = () => {
        const nextState = !collapsed;
        setCollapsed(nextState);
        localStorage.setItem('sidebar-collapsed', String(nextState));
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="lms-shell">
            <aside className={`lms-sidebar ${collapsed ? 'is-collapsed' : ''} ${sidebarOpen ? 'is-open' : ''}`}>
                <div className="lms-sidebar-header">
                    <div className="lms-user-avatar">SV</div>
                    <div className="lms-brand">
                        <span className="lms-brand-title">STEM Vietnam</span>
                        <span className="lms-brand-subtitle">LMS Workspace</span>
                    </div>
                </div>

                <nav>
                    <ul className="lms-nav">
                        {filteredNavItems.map(({ path, label, hint, badge }, index) => (
                            <li key={path}>
                                <NavLink
                                    to={path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) => `lms-nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <span className="lms-nav-index">{String(index + 1).padStart(2, '0')}</span>
                                    <span className="lms-nav-text">
                                        <span className="lms-nav-label">{label}</span>
                                        {hint && <span className="lms-nav-hint">{hint}</span>}
                                    </span>
                                    {badge && <span className="lms-nav-badge">{badge}</span>}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="lms-sidebar-footer">
                    {user && (
                        <div className="lms-user">
                            <div className="lms-user-avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                            <div className="lms-user-meta">
                                <span>{user.name || 'User'}</span>
                                <span>{user.role}</span>
                            </div>
                        </div>
                    )}

                    <button className="lms-button-ghost" onClick={toggleCollapse}>
                        <span>{collapsed ? 'Mo' : 'Thu gon'}</span>
                    </button>

                    <button className="lms-button-ghost" onClick={handleLogout}>
                        <span>Dang xuat</span>
                    </button>
                </div>
            </aside>

            {sidebarOpen && <div className="lms-overlay" onClick={() => setSidebarOpen(false)} />}

            <div className="lms-main">
                <header className="lms-topbar">
                    <div className="lms-row">
                        <button
                            className="lms-button-ghost lms-mobile-toggle"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? 'Dong' : 'Menu'}
                        </button>
                        <div className="lms-topbar-title">{pageTitle}</div>
                    </div>
                    <div className="lms-topbar-actions">
                        <button className="lms-button-secondary">Tao nhanh</button>
                    </div>
                </header>

                <main className="lms-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
