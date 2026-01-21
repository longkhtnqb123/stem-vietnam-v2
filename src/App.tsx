// Chú thích: Root App component với React Router
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import VersionCheck from './components/common/VersionCheck';
import { useAppStore } from './stores/appStore';

// Chú thích: Lazy load pages cho better performance
import { lazy, Suspense } from 'react';

const LandingPage = lazy(() => import('./components/landing/LandingPage'));
const ChatPage = lazy(() => import('./components/chat/ChatPage'));
const LibraryPage = lazy(() => import('./components/library/LibraryPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
// Chú thích: Exam pages mới (gọn lại)
const ExamPage = lazy(() => import('./pages/ExamPage'));
const PracticePage = lazy(() => import('./pages/PracticePage'));
const ExamTakingPage = lazy(() => import('./pages/ExamTakingPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const ClassesPage = lazy(() => import('./pages/ClassesPage'));
const ClassDetailPage = lazy(() => import('./pages/ClassDetailPage'));
// Phase 4 & 5: New Admin Pages
const SchoolAdminPage = lazy(() => import('./pages/SchoolAdminPage'));
const ResearchDashboard = lazy(() => import('./pages/ResearchDashboard'));
// Phase 7: Immersive UI
import ImmersiveLayout from './components/layout/ImmersiveLayout';
const StudentDashboardImmersive = lazy(() => import('./pages/StudentDashboardImmersive'));
import AuthGuard from './components/auth/AuthGuard';
import ApiKeyWarning from './components/common/ApiKeyWarning';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import TourGuide, { useTourGuide } from './components/common/TourGuide';

// Chú thích: Loading fallback component
function PageLoader() {
  return (
    <div className="lms-page">
      <div className="lms-empty">
        <div className="lms-spinner" />
        <p className="lms-note">Dang tai...</p>
      </div>
    </div>
  );
}

// Chú thích: Full page loader for landing
function FullPageLoader() {
  return (
    <div className="lms-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="lms-empty">
        <div className="lms-spinner" />
        <p className="lms-note">Dang tai...</p>
      </div>
    </div>
  );
}

function App() {
  const { notification, clearNotification } = useAppStore();
  const { showTour, completeTour } = useTourGuide();

  // Chú thích: Apply theme class on mount từ localStorage
  useEffect(() => {
    const applyTheme = (theme: string) => {
      // Remove all theme classes first
      document.documentElement.classList.remove('dark', 'sepia');

      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'sepia') {
        document.documentElement.classList.add('sepia');
      } else if (theme === 'auto') {
        // Follow system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
      }
      // 'light' = no class needed
    };

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // Listen for system theme changes when in auto mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (localStorage.getItem('theme') === 'auto') {
        applyTheme('auto');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <BrowserRouter>
      <VersionCheck />
      <ApiKeyWarning />
      <PWAInstallPrompt />
      <TourGuide isOpen={showTour} onComplete={completeTour} />
      {/* Notification Toast */}
      {notification && (
        <div
          className={`lms-toast ${notification.type === 'success'
            ? 'is-success'
            : notification.type === 'error'
              ? 'is-error'
              : 'is-info'
            }`}
        >
          <span>{notification.message}</span>
          <button onClick={clearNotification} aria-label="Close notification">X</button>
        </div>
      )}

      <Routes>
        {/* Landing page - standalone without MainLayout */}
        <Route path="/" element={
          <Suspense fallback={<FullPageLoader />}>
            <LandingPage />
          </Suspense>
        } />

        {/* Auth pages - standalone */}
        <Route path="/login" element={
          <Suspense fallback={<FullPageLoader />}>
            <LoginPage />
          </Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={<FullPageLoader />}>
            <RegisterPage />
          </Suspense>
        } />

        <Route path="/immersive" element={<ImmersiveLayout />}>
          <Route path="dashboard" element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <StudentDashboardImmersive />
              </Suspense>
            </AuthGuard>
          } />
        </Route>

        {/* Main app routes with sidebar - Protected */}
        <Route element={<MainLayout />}>
          <Route path="chat" element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <ChatPage />
              </Suspense>
            </AuthGuard>
          } />

          <Route path="library" element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <LibraryPage />
              </Suspense>
            </AuthGuard>
          } />

          <Route path="settings" element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            </AuthGuard>
          } />

          {/* Thi Online */}
          <Route path="exam" element={
            <Suspense fallback={<PageLoader />}>
              <ExamPage />
            </Suspense>
          } />
          {/* Chú thích: Redirect /exam-online → /exam (backward compatibility) */}
          <Route path="exam-online" element={
            <Suspense fallback={<PageLoader />}>
              <ExamPage />
            </Suspense>
          } />

          {/* Ôn Tập */}
          <Route path="practice" element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <PracticePage />
              </Suspense>
            </AuthGuard>
          } />

          <Route path="exam/attempt/:attemptId" element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <ExamTakingPage />
              </Suspense>
            </AuthGuard>
          } />

          {/* Hướng dẫn sử dụng */}
          <Route path="help" element={
            <Suspense fallback={<PageLoader />}>
              <HelpPage />
            </Suspense>
          } />

          {/* Teacher Dashboard */}
          <Route path="teacher-dashboard" element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <TeacherDashboard />
              </Suspense>
            </AuthGuard>
          } />

          {/* Student Dashboard */}
          <Route path="student-dashboard" element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <StudentDashboard />
              </Suspense>
            </AuthGuard>
          } />

          {/* Class System */}
          <Route path="classes" element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <ClassesPage />
              </Suspense>
            </AuthGuard>
          } />

          <Route path="classes/:id" element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <ClassDetailPage />
              </Suspense>
            </AuthGuard>
          } />

          {/* Admin: School Management */}
          <Route path="school-admin" element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <SchoolAdminPage />
              </Suspense>
            </AuthGuard>
          } />

          {/* Admin: Research Analytics */}
          <Route path="research" element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <ResearchDashboard />
              </Suspense>
            </AuthGuard>
          } />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;



