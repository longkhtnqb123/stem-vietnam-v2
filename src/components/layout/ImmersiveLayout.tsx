import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/auth';
import {
    Home,
    Compass,
    BookOpen,
    Trophy,
    User,
    Settings,
    LogOut,
    Zap,
    Target
} from 'lucide-react';

// --- Gamified Header (HUD) ---
const GamifiedHeader = () => {
    const { user } = useAuthStore();
    const XP_PER_LEVEL = 1000; // Example
    const currentXP = (user?.xp as number) || 0;
    const level = (user?.level as number) || 1;
    const streak = (user?.streak as number) || 0;
    const progress = Math.min(100, ((currentXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
            <div className="max-w-7xl mx-auto">
                <div className="glass-panel rounded-full px-4 py-2 flex items-center justify-between">
                    {/* User Info & Avatar */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center border-2 border-white/20">
                                <span className="font-bold text-white shadow-sm">{user?.name?.charAt(0) || 'U'}</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-slate-900 neon-border-emerald">
                                {level}
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <p className="font-bold text-sm text-white">{user?.name}</p>
                            <p className="text-xs text-secondary-300">Học viên tập sự</p>
                        </div>
                    </div>

                    {/* XP Progress (Center) */}
                    <div className="flex-1 max-w-md mx-4 hidden md:block">
                        <div className="flex justify-between text-xs font-medium mb-1 px-1">
                            <span className="text-primary-300">Level {level}</span>
                            <span className="text-secondary-300">{currentXP} / {level * XP_PER_LEVEL} XP</span>
                        </div>
                        <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden border border-white/5">
                            <div
                                className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-1000 relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    {/* Stats (Right) */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/50 border border-white/10">
                            <Zap size={16} className="text-amber-400 fill-amber-400" />
                            <span className="text-sm font-bold text-amber-200">{streak}</span>
                        </div>
                        <div className="w-px h-6 bg-white/10 mx-1"></div>
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <Settings size={20} className="text-slate-300" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

// --- Floating Dock Navigation ---
const FloatingDock = () => {
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    const navItems = [
        { path: '/immersive/dashboard', icon: Home, label: 'Trang Chủ' },
        { path: '/library', icon: Compass, label: 'Khám Phá' }, // Or /learn if you have it
        { path: '/immersive/dashboard', icon: Target, label: 'Nhiệm Vụ' }, // Reusing dashboard for now
        { path: '/exam-online', icon: Trophy, label: 'Thi Đấu' },
        { path: '/library', icon: BookOpen, label: 'Tài Liệu' },
        { path: '/settings', icon: User, label: 'Cài Đặt' },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="glass-panel px-4 py-3 rounded-2xl flex items-center gap-2 shadow-2xl shadow-primary-500/10 border border-white/20">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            p-3 rounded-xl dock-item relative group
                            ${isActive
                                ? 'bg-gradient-to-b from-primary-500/20 to-primary-500/5 text-primary-300'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }
                        `}
                    >
                        <item.icon size={24} strokeWidth={2} />
                        {/* Label Tooltip */}
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                            {item.label}
                        </span>
                        {/* Active Indicator */}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-400 opacity-0 group-[.active]:opacity-100 transition-opacity" />
                    </NavLink>
                ))}

                <div className="w-px h-8 bg-white/10 mx-2" />

                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="p-3 rounded-xl dock-item text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                    <LogOut size={24} />
                </button>
            </div>
        </div>
    );
};

// --- Main Layout ---
export default function ImmersiveLayout() {
    return (
        <div className="min-h-screen mesh-gradient-bg text-slate-100 font-sans selection:bg-primary-500/30 dark">
            <div className="fixed inset-0 bg-[url('/img/grid-pattern.svg')] opacity-10 pointer-events-none"></div>

            <GamifiedHeader />

            <main className="pt-24 pb-32 px-4 container mx-auto max-w-7xl animate-fade-in">
                <Outlet />
            </main>

            <FloatingDock />
        </div>
    );
}
