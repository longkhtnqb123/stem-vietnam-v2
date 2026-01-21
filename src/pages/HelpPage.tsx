import { useState } from 'react';
import {
    GraduationCap,
    Users,
    MessageCircle,
    BookOpen,
    Trophy,
    Settings,
    Sparkles,
    BarChart3,
    Brain,
    Search,
    School,
    PlusCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

type TabType = 'student' | 'teacher';

interface GuideSection {
    icon: React.ReactNode;
    title: string;
    description: string;
    steps: string[];
    link?: string;
    linkText?: string;
}

const STUDENT_GUIDES: GuideSection[] = [
    {
        icon: <MessageCircle size={18} />,
        title: 'Chat AI',
        description: 'Hoi dap va giai bai tap voi AI.',
        steps: [
            'Mo menu Chat AI',
            'Nhap cau hoi va gui',
            'Doc giai thich va goi y',
        ],
        link: '/chat',
        linkText: 'Mo Chat AI',
    },
    {
        icon: <School size={18} />,
        title: 'Lop hoc',
        description: 'Tham gia lop hoc va lam bai tap.',
        steps: [
            'Mo menu Lop hoc',
            'Nhap ma tham gia',
            'Theo doi bai tap',
        ],
        link: '/classes',
        linkText: 'Vao lop',
    },
    {
        icon: <Trophy size={18} />,
        title: 'Thi online',
        description: 'Lam bai thi truc tuyen va xem ket qua.',
        steps: [
            'Chon de thi',
            'Bat dau lam bai',
            'Nop bai va xem diem',
        ],
        link: '/exam',
        linkText: 'Lam bai thi',
    },
    {
        icon: <BookOpen size={18} />,
        title: 'Thu vien',
        description: 'Xem tai lieu, SGK va de mau.',
        steps: [
            'Mo menu Thu vien',
            'Loc theo lop',
            'Tai ve tai lieu',
        ],
        link: '/library',
        linkText: 'Mo thu vien',
    },
    {
        icon: <Settings size={18} />,
        title: 'Cai dat',
        description: 'Tuy chinh AI va giao dien.',
        steps: [
            'Mo Cai dat',
            'Nhap API key neu can',
            'Luu thay doi',
        ],
        link: '/settings',
        linkText: 'Mo cai dat',
    },
];

const TEACHER_GUIDES: GuideSection[] = [
    {
        icon: <Sparkles size={18} />,
        title: 'Tao de thi AI',
        description: 'Tao de thi nhanh theo ma tran.',
        steps: [
            'Mo Thi online',
            'Chon Tao de AI',
            'Xem truoc va luu',
        ],
        link: '/exam',
        linkText: 'Tao de thi',
    },
    {
        icon: <School size={18} />,
        title: 'Quan ly lop hoc',
        description: 'Tao lop, moi hoc sinh, giao bai tap.',
        steps: [
            'Tao lop moi',
            'Gui ma tham gia',
            'Giao bai tap',
        ],
        link: '/classes',
        linkText: 'Quan ly lop',
    },
    {
        icon: <BarChart3 size={18} />,
        title: 'Thong ke',
        description: 'Xem diem va tien do cua hoc sinh.',
        steps: [
            'Mo de thi',
            'Xem thong ke',
        ],
        link: '/exam',
        linkText: 'Xem thong ke',
    },
    {
        icon: <PlusCircle size={18} />,
        title: 'Tao de thu cong',
        description: 'Tao de thi tu cau hoi san co.',
        steps: [
            'Mo Thi online',
            'Tao de moi',
            'Luu de thi',
        ],
        link: '/exam',
        linkText: 'Tao de thu cong',
    },
    {
        icon: <Brain size={18} />,
        title: 'RAG tu SGK',
        description: 'AI tao cau hoi theo SGK.',
        steps: [
            'Chon lop va dinh huong',
            'Tao cau hoi AI',
        ],
    },
    {
        icon: <Search size={18} />,
        title: 'Chat AI ho tro soan bai',
        description: 'Su dung Chat AI de soan bai giang.',
        steps: [
            'Mo Chat AI',
            'Nhap yeu cau',
        ],
        link: '/chat',
        linkText: 'Mo Chat AI',
    },
];

export default function HelpPage() {
    const [activeTab, setActiveTab] = useState<TabType>('student');
    const guides = activeTab === 'student' ? STUDENT_GUIDES : TEACHER_GUIDES;

    return (
        <div className="lms-page">
            <section className="lms-card">
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">Huong dan su dung</div>
                        <div className="lms-card-subtitle">Chon vai tro de xem huong dan</div>
                    </div>
                    <div className="lms-row">
                        <button
                            onClick={() => setActiveTab('student')}
                            className={activeTab === 'student' ? 'lms-button' : 'lms-button-secondary'}
                        >
                            <GraduationCap size={16} /> Hoc sinh
                        </button>
                        <button
                            onClick={() => setActiveTab('teacher')}
                            className={activeTab === 'teacher' ? 'lms-button' : 'lms-button-secondary'}
                        >
                            <Users size={16} /> Giao vien
                        </button>
                    </div>
                </div>
            </section>

            <section className="lms-grid lms-grid-2">
                {guides.map((guide) => (
                    <article key={guide.title} className="lms-card">
                        <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                            <div className="lms-row">
                                {guide.icon}
                                <div>
                                    <div className="lms-card-title">{guide.title}</div>
                                    <div className="lms-card-subtitle">{guide.description}</div>
                                </div>
                            </div>
                        </div>
                        <ul className="lms-section">
                            {guide.steps.map((step, idx) => (
                                <li key={idx} className="lms-note">- {step}</li>
                            ))}
                        </ul>
                        {guide.link && guide.linkText && (
                            <Link to={guide.link} className="lms-button-secondary">
                                {guide.linkText}
                            </Link>
                        )}
                    </article>
                ))}
            </section>
        </div>
    );
}
