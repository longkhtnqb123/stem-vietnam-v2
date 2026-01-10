// Chú thích: Main layout với collapsible sidebar navigation
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    MessageCircle,
    FileQuestion,
    ClipboardList,
    GraduationCap,
    Library,
    Moon,
    Sun,
    Menu,
    X,
    LogOut,
    Settings,
    Trophy,
    HelpCircle,
    School,
    ChevronLeft,
    ChevronRight,
    Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../lib/auth';

// Chú thích: Navigation items với role filter
interface NavItem {
    path: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    roles?: string[];
    badge?: string;
}

const navItems: NavItem[] = [
    { path: '/chat', icon: MessageCircle, label: 'Chat AI' },
    { path: '/exam-online', icon: Trophy, label: 'Thi Online', badge: '🔥' },
    { path: '/student-dashboard', icon: GraduationCap, label: 'Tiến Độ', roles: ['student'] },
    { path: '/teacher-dashboard', icon: ClipboardList, label: 'Dashboard GV', roles: ['teacher', 'admin'] },
    { path: '/classes', icon: School, label: 'Lớp Học' },
    { path: '/questions', icon: FileQuestion, label: 'Tạo Câu Hỏi', roles: ['teacher', 'admin'] },
    { path: '/exam/thpt', icon: ClipboardList, label: 'Đề Thi THPT', roles: ['teacher', 'admin'] },
    { path: '/exam/semester', icon: GraduationCap, label: 'Đề Giữa/Cuối Kỳ', roles: ['teacher', 'admin'] },
    { path: '/library', icon: Library, label: 'Thư Viện' },
    { path: '/settings', icon: Settings, label: 'Cài Đặt' },
    { path: '/help', icon: HelpCircle, label: 'Hướng Dẫn', badge: '📖' },
];

// Tooltip component for collapsed sidebar
function Tooltip({ children, text, show }: { children: React.ReactNode; text: string; show: boolean }) {
    if (!show) return <>{children}</>;
    return (
        <div className="relative group">
            {children}
            <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg 
                          opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200
                          whitespace-nowrap z-50 shadow-lg">
                {text}
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
            </div>
        </div>
    );
}

export default function MainLayout() {
    const { isDarkMode, toggleDarkMode } = useAppStore();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    // Chú thích: State để collapse sidebar trên desktop
    const [collapsed, setCollapsed] = React.useState(() => {
        return localStorage.getItem('sidebar-collapsed') === 'true';
    });

    // Chú thích: Lưu trạng thái collapse vào localStorage
    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    // Chú thích: Filter menu items theo role
    const userRole = user?.role || 'student';
    const filteredNavItems = navItems.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(userRole);
    });

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const sidebarWidth = collapsed ? 'w-20' : 'w-64';
    const mainMargin = collapsed ? 'lg:ml-20' : 'lg:ml-64';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Mobile menu button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700"
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 ${sidebarWidth}
                bg-white dark:bg-slate-800 
                border-r border-slate-200 dark:border-slate-700
                transform transition-all duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
                shadow-xl lg:shadow-none
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className={`p-4 border-b border-slate-200 dark:border-slate-700 ${collapsed ? 'px-3' : 'px-6'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/30">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            {!collapsed && (
                                <div className="animate-fade-in">
                                    <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                                        Học Công Nghệ
                                    </h1>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        STEM Vietnam
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className={`flex-1 p-2 space-y-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}>
                        {filteredNavItems.map(({ path, icon: Icon, label, badge }) => (
                            <Tooltip key={path} text={label} show={collapsed}>
                                <NavLink
                                    to={path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-3 py-2.5 rounded-xl
                                        transition-all duration-200
                                        ${collapsed ? 'justify-center' : ''}
                                        ${isActive
                                            ? 'bg-gradient-to-r from-primary-500/10 to-secondary-500/10 text-primary-700 dark:text-primary-400 font-semibold border border-primary-200 dark:border-primary-800'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                                        }
                                    `}
                                >
                                    <Icon size={20} className="flex-shrink-0" />
                                    {!collapsed && (
                                        <span className="truncate animate-fade-in flex items-center gap-1">
                                            {label}
                                            {badge && <span className="text-xs">{badge}</span>}
                                        </span>
                                    )}
                                </NavLink>
                            </Tooltip>
                        ))}
                    </nav>

                    {/* Collapse Toggle Button - Desktop only */}
                    <button
                        onClick={toggleCollapse}
                        className="hidden lg:flex items-center justify-center p-3 mx-3 mb-2 rounded-xl
                                 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300
                                 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200"
                    >
                        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        {!collapsed && <span className="ml-2 text-sm">Thu gọn</span>}
                    </button>

                    {/* Footer */}
                    <div className={`p-3 border-t border-slate-200 dark:border-slate-700 space-y-1 ${collapsed ? 'px-2' : ''}`}>
                        {/* User info */}
                        {user && (
                            <Tooltip text={user.name || 'User'} show={collapsed}>
                                <div className={`flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-700/30 ${collapsed ? 'justify-center' : ''}`}>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    {!collapsed && (
                                        <div className="animate-fade-in truncate">
                                            <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{user.name}</p>
                                            <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                                        </div>
                                    )}
                                </div>
                            </Tooltip>
                        )}

                        {/* Dark mode toggle */}
                        <Tooltip text={isDarkMode ? 'Light Mode' : 'Dark Mode'} show={collapsed}>
                            <button
                                onClick={toggleDarkMode}
                                className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl
                                          text-slate-600 dark:text-slate-400 
                                          hover:bg-slate-100 dark:hover:bg-slate-700/50
                                          transition-all duration-200
                                          ${collapsed ? 'justify-center' : ''}`}
                            >
                                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                                {!collapsed && <span className="animate-fade-in">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
                            </button>
                        </Tooltip>

                        {/* Logout button */}
                        <Tooltip text="Đăng xuất" show={collapsed}>
                            <button
                                onClick={handleLogout}
                                className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl
                                          text-red-600 dark:text-red-400 
                                          hover:bg-red-50 dark:hover:bg-red-900/20
                                          transition-all duration-200
                                          ${collapsed ? 'justify-center' : ''}`}
                            >
                                <LogOut size={20} />
                                {!collapsed && <span className="animate-fade-in">Đăng xuất</span>}
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <main className={`${mainMargin} min-h-screen transition-all duration-300`}>
                <div className="p-4 pt-16 lg:pt-6 lg:p-8 pb-safe">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

