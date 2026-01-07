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
const QuestionFormPage = lazy(() => import('./components/forms/QuestionFormPage'));
const ExamFormPage = lazy(() => import('./components/forms/ExamFormPage'));
const SemesterExamFormPage = lazy(() => import('./components/forms/SemesterExamFormPage'));
const LibraryPage = lazy(() => import('./components/library/LibraryPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
import AuthGuard from './components/auth/AuthGuard';

// Chú thích: Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
    </div>
  );
}

// Chú thích: Full page loader for landing
function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400">Đang tải...</p>
      </div>
    </div>
  );
}

function App() {
  const { notification, clearNotification } = useAppStore();

  // Chú thích: Apply dark mode class on mount từ localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <BrowserRouter>
      <VersionCheck />
      {/* Notification Toast */}
      {notification && (
        <div className={`
          fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg animate-slide-up
          ${notification.type === 'success' ? 'bg-green-500 text-white' : ''}
          ${notification.type === 'error' ? 'bg-red-500 text-white' : ''}
          ${notification.type === 'info' ? 'bg-primary-500 text-white' : ''}
        `}>
          <div className="flex items-center gap-2">
            <span>{notification.message}</span>
            <button onClick={clearNotification} className="ml-2 hover:opacity-75">×</button>
          </div>
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
        <Route path="/admin" element={
          <Suspense fallback={<FullPageLoader />}>
            <AdminPage />
          </Suspense>
        } />

        {/* Main app routes with sidebar - Protected */}
        <Route element={<MainLayout />}>
          <Route path="chat" element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <ChatPage />
              </Suspense>
            </AuthGuard>
          } />

          <Route path="questions" element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <QuestionFormPage />
              </Suspense>
            </AuthGuard>
          } />

          <Route path="exam/thpt" element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <ExamFormPage />
              </Suspense>
            </AuthGuard>
          } />

          <Route path="exam/semester" element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <SemesterExamFormPage />
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

