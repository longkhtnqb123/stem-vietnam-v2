import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    MessageCircle,
    GraduationCap,
    Library,
    Menu,
    X,
    LogOut,
    Settings,
    Trophy,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth';

interface NavItem {
    path: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    roles?: string[];
    badge?: string;
}

const navItems: NavItem[] = [
    { path: '/chat', icon: MessageCircle, label: 'Chat AI' },
    { path: '/exam', icon: Trophy, label: 'Thi Online', badge: 'Hot' },
    { path: '/practice', icon: GraduationCap, label: 'On Tap', badge: 'New' },
    { path: '/library', icon: Library, label: 'Thu Vien' },
    { path: '/settings', icon: Settings, label: 'Cai Dat' },
    { path: '/help', icon: HelpCircle, label: 'Huong Dan' },
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
                        {filteredNavItems.map(({ path, icon: Icon, label, badge }) => (
                            <li key={path}>
                                <NavLink
                                    to={path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) => `lms-nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <Icon size={18} />
                                    <span className="lms-nav-label">{label}</span>
                                    {badge && <span className="lms-pill">{badge}</span>}
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
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        <span>{collapsed ? 'Mo' : 'Thu gon'}</span>
                    </button>

                    <button className="lms-button-ghost" onClick={handleLogout}>
                        <LogOut size={18} />
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
                            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                        <div className="lms-topbar-title">{pageTitle}</div>
                    </div>
                    <div className="lms-topbar-actions">
                        <button className="lms-button-secondary">New</button>
                    </div>
                </header>

                <main className="lms-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
