import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setTimeout(() => setShowPrompt(true), 30000);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstalled(true);
        }
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    };

    if (!showPrompt || isInstalled || !deferredPrompt) return null;

    return (
        <div className="lms-modal" style={{ alignItems: 'flex-end' }}>
            <div className="lms-modal-panel" style={{ maxWidth: 480 }}>
                <div className="lms-modal-header">
                    <div className="lms-card-title">Cai dat ung dung</div>
                    <button onClick={handleDismiss} className="lms-button-ghost">
                        <X size={16} />
                    </button>
                </div>
                <div className="lms-modal-body lms-section">
                    <p className="lms-note">Cai dat de su dung nhanh va on dinh hon.</p>
                </div>
                <div className="lms-modal-footer">
                    <button onClick={handleDismiss} className="lms-button-secondary">
                        De sau
                    </button>
                    <button onClick={handleInstall} className="lms-button">
                        <Download size={16} /> Cai dat
                    </button>
                </div>
            </div>
        </div>
    );
}
