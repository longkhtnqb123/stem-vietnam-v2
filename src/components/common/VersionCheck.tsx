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
        <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 120 }}>
            <div className="lms-card" style={{ maxWidth: 360 }}>
                <div className="lms-row" style={{ alignItems: 'flex-start' }}>
                    <div className="lms-badge">
                        <RefreshCw size={16} />
                        Cap nhat moi
                    </div>
                    <button onClick={() => setShowUpdate(false)} className="lms-button-ghost">
                        <X size={14} />
                    </button>
                </div>
                <p className="lms-note">
                    Phien ban moi cua ung dung da san sang. Vui long lam moi de trai nghiem tot nhat.
                </p>
                <div className="lms-row" style={{ marginTop: 12 }}>
                    <button onClick={handleUpdate} className="lms-button">
                        Cap nhat ngay
                    </button>
                    <button onClick={() => setShowUpdate(false)} className="lms-button-ghost">
                        De sau
                    </button>
                </div>
            </div>
        </div>
    );
}
