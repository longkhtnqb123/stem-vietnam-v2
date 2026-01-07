import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

interface VersionInfo {
    buildTime: number;
}

export default function VersionCheck() {
    const [showUpdate, setShowUpdate] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const APP_VERSION_KEY = 'app_version_build_time';

    const checkForUpdate = async () => {
        if (isChecking) return;
        setIsChecking(true);

        try {
            const res = await fetch('/version.json?t=' + new Date().getTime());
            if (!res.ok) return;

            const data: VersionInfo = await res.json();
            const currentVersion = localStorage.getItem(APP_VERSION_KEY);

            if (currentVersion && parseInt(currentVersion) < data.buildTime) {
                setShowUpdate(true);
            } else {
                // If first time or up to date, store the version
                if (!currentVersion) {
                    localStorage.setItem(APP_VERSION_KEY, data.buildTime.toString());
                }
            }
        } catch (error) {
            console.error('Failed to check version', error);
        } finally {
            setIsChecking(false);
        }
    };

    const handleUpdate = () => {
        // Fetch new version to get the latest timestamp to store
        fetch('/version.json?t=' + new Date().getTime())
            .then(res => res.json())
            .then((data: VersionInfo) => {
                localStorage.setItem(APP_VERSION_KEY, data.buildTime.toString());

                // Clear caches
                if ('caches' in window) {
                    caches.keys().then((names) => {
                        names.forEach((name) => {
                            caches.delete(name);
                        });
                    });
                }

                // Reload
                window.location.reload();
            })
            .catch(() => {
                // If fetch fails, just reload, it might work
                window.location.reload();
            });
    };

    useEffect(() => {
        // Check on mount
        checkForUpdate();

        // Check on window focus
        const onFocus = () => checkForUpdate();
        window.addEventListener('focus', onFocus);

        // Check periodically (every 5 minutes)
        const interval = setInterval(checkForUpdate, 5 * 60 * 1000);

        return () => {
            window.removeEventListener('focus', onFocus);
            clearInterval(interval);
        };
    }, []);

    if (!showUpdate) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-4 max-w-sm flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <RefreshCw size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-sm">Cập nhật mới</h3>
                    <p className="text-slate-600 text-xs mt-1">
                        Phiên bản mới của ứng dụng đã sẵn sàng. Vui lòng làm mới để trải nghiệm tốt nhất.
                    </p>
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={handleUpdate}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
                        >
                            Cập nhật ngay
                        </button>
                        <button
                            onClick={() => setShowUpdate(false)}
                            className="text-slate-500 hover:text-slate-700 text-xs font-medium px-3 py-1.5 rounded transition-colors"
                        >
                            Để sau
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setShowUpdate(false)}
                    className="text-slate-400 hover:text-slate-600"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
