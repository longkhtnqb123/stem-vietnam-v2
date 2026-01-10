// Chú thích: Main layout với sidebar navigation
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
    User,
    Settings,
    Trophy,
    HelpCircle,
    School,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../lib/auth';

// Chú thích: Navigation items với role filter
// roles: undefined = all, ['teacher', 'admin'] = chỉ teacher và admin
interface NavItem {
    path: string;
    icon: React.ComponentType<{ size?: number }>;
    label: string;
    roles?: string[];
}

const navItems: NavItem[] = [
    { path: '/chat', icon: MessageCircle, label: 'Chat AI' },
    { path: '/exam-online', icon: Trophy, label: '🔥 Thi Online' },
    { path: '/student-dashboard', icon: GraduationCap, label: '📈 Tiến Độ', roles: ['student'] },
    { path: '/teacher-dashboard', icon: ClipboardList, label: '📊 Dashboard GV', roles: ['teacher', 'admin'] },
    { path: '/classes', icon: School, label: 'Lớp Học' },
    { path: '/questions', icon: FileQuestion, label: 'Tạo Câu Hỏi', roles: ['teacher', 'admin'] },
    { path: '/exam/thpt', icon: ClipboardList, label: 'Đề Thi THPT', roles: ['teacher', 'admin'] },
    { path: '/exam/semester', icon: GraduationCap, label: 'Đề Giữa/Cuối Kỳ', roles: ['teacher', 'admin'] },
    { path: '/library', icon: Library, label: 'Thư Viện' },
    { path: '/settings', icon: Settings, label: 'Cài Đặt' },
    { path: '/help', icon: HelpCircle, label: '📖 Hướng Dẫn' },
];

export default function MainLayout() {
    const { isDarkMode, toggleDarkMode } = useAppStore();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    // Chú thích: Filter menu items theo role
    const userRole = user?.role || 'student';
    const filteredNavItems = navItems.filter(item => {
        if (!item.roles) return true; // Không filter = hiện cho tất cả
        return item.roles.includes(userRole);
    });

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Mobile menu button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-slate-800 shadow-lg"
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 
        bg-white dark:bg-slate-800 
        border-r border-slate-200 dark:border-slate-700
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                            Học Công Nghệ
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Luyện đề theo chuẩn chương trình
                        </p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                        {filteredNavItems.map(({ path, icon: Icon, label }) => (
                            <NavLink
                                key={path}
                                to={path}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-200
                  ${isActive
                                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }
                `}
                            >
                                <Icon size={20} />
                                <span>{label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        {/* User info */}
                        {user && (
                            <div className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-400">
                                <User size={16} />
                                <span className="truncate">{user.name}</span>
                            </div>
                        )}

                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl
                text-slate-600 dark:text-slate-400 
                hover:bg-slate-100 dark:hover:bg-slate-700
                transition-all duration-200"
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>

                        {/* Logout button */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl
                text-red-600 dark:text-red-400 
                hover:bg-red-50 dark:hover:bg-red-900/20
                transition-all duration-200"
                        >
                            <LogOut size={20} />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <main className="lg:ml-64 min-h-screen">
                <div className="p-4 pt-16 lg:pt-6 lg:p-8 pb-safe">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
