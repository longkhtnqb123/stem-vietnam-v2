// Chú thích: Landing page đơn giản cho STEM Vietnam
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../lib/auth';

export default function LandingPage() {
    const { user } = useAuthStore();
    const isLoggedIn = Boolean(user);

    return (
        <div className="lms-auth">
            <div className="lms-auth-shell" style={{ maxWidth: 800, justifyContent: 'center' }}>
                <div className="lms-auth-panel" style={{ textAlign: 'center' }}>
                    <div className="lms-auth-header">
                        <h1 className="lms-auth-heading">STEM Vietnam</h1>
                        <p className="lms-auth-subtitle">
                            Hệ thống học tập và thi trực tuyến môn Công nghệ THPT
                        </p>
                    </div>

                    <div className="lms-section" style={{ marginTop: 24 }}>
                        <p className="lms-note">
                            Hỗ trợ học sinh lớp 10, 11, 12 ôn tập và kiểm tra kiến thức theo chương trình GDPT 2018
                        </p>
                    </div>

                    <div className="lms-row" style={{ justifyContent: 'center', marginTop: 24, gap: 12 }}>
                        {isLoggedIn ? (
                            <>
                                <Link to="/student-dashboard" className="lms-button">
                                    Vào học
                                </Link>
                                <Link to="/exam" className="lms-button-secondary">
                                    Thi Online
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="lms-button">
                                    Đăng nhập
                                </Link>
                                <Link to="/register" className="lms-button-secondary">
                                    Đăng ký
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="lms-section" style={{ marginTop: 32 }}>
                        <div className="lms-grid lms-grid-3" style={{ gap: 16 }}>
                            <div className="lms-card">
                                <div className="lms-card-title">Thi Online</div>
                                <p className="lms-note">Đề thi 15 phút, giữa kì, cuối kì theo chuẩn Bộ GD</p>
                            </div>
                            <div className="lms-card">
                                <div className="lms-card-title">Ôn tập AI</div>
                                <p className="lms-note">Luyện tập với AI, phân tích điểm yếu</p>
                            </div>
                            <div className="lms-card">
                                <div className="lms-card-title">Thư viện</div>
                                <p className="lms-note">SGK và tài liệu tham khảo</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
