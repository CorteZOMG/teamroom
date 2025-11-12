import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import FeedTab from '../components/FeedTab';
import MaterialsTab from '../components/MaterialsTab';
import AssignmentsTab from '../components/AssignmentsTab';
import ConferenceTab from '../components/ConferenceTab';
import GradesJournalTab from '../components/GradesJournalTab';
import CourseChatsTab from '../components/CourseChatsTab';
import { CloudImage } from '../components/CloudImage';
import { getCourse, changeMemberRole, deleteMember, deleteCourse, addCourseMember } from '../api/courses';
import { getUsernameFromToken } from '../services/auth';
import { ConferenceProvider } from '../context/ConferenceContext';
import type { Course } from '../types';

type TabType = 'feed' | 'materials' | 'assignments' | 'conference' | 'chats' | 'members' | 'grades';

type CourseMemberRole = 'OWNER' | 'PROFESSOR' | 'LEADER' | 'STUDENT' | 'VIEWER';

export default function CourseDetail() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('materials');
    const [focusId, setFocusId] = useState<number | null>(null);
    const [showCourseId, setShowCourseId] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [newMemberUsername, setNewMemberUsername] = useState('');

    const currentUser = getUsernameFromToken();
    const userRole = course?.members.find(m => m.username === currentUser)?.role;
    const isOwnerOrProfessor = userRole === 'OWNER' || userRole === 'PROFESSOR';

    const loadCourse = useCallback(async () => {
        if (!courseId) return;

        try {
            setLoading(true);
            setError(null);
            const courseData = await getCourse(parseInt(courseId));
            setCourse(courseData);
        } catch (err) {
            console.error('Error loading course:', err);
            setError('Не вдалося завантажити курс');
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            loadCourse();
        }
    }, [isAuthenticated, authLoading, loadCourse]);

    // Handle query parameters for navigation from chat
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        const focusParam = searchParams.get('focusId');
        
        if (tabParam && ['feed', 'materials', 'assignments', 'conference', 'chats', 'members', 'grades'].includes(tabParam)) {
            setActiveTab(tabParam as TabType);
        }
        
        if (focusParam) {
            setFocusId(parseInt(focusParam));
        }
    }, [searchParams]);

    const handleChangeRole = async (username: string) => {
        const newRole = prompt('Enter new role (OWNER, PROFESSOR, LEADER, STUDENT, VIEWER):');
        if (newRole && courseId) {
            try {
                await changeMemberRole(parseInt(courseId), { username, role: newRole as CourseMemberRole });
                loadCourse();
            } catch (err) {
                console.error('Error changing role:', err);
                setError(err instanceof Error ? err.message : 'Не вдалося змінити роль');
            }
        }
    };

    const handleRemoveMember = async (username: string) => {
        if (window.confirm(`Ви впевнені, що хочете видалити ${username} з курсу?`)) {
            if (courseId) {
                try {
                    await deleteMember(parseInt(courseId), username);
                    loadCourse();
                } catch (err) {
                    console.error('Error removing member:', err);
                    setError(err instanceof Error ? err.message : 'Не вдалося видалити учасника');
                }
            }
        }
    };

    const handleDeleteCourse = async (courseId: number) => {
        if (window.confirm('Ви впевнені, що хочете видалити цей курс?')) {
            try {
                await deleteCourse(courseId);
                navigate('/courses');
            } catch (err) {
                console.error('Error deleting course:', err);
                setError(err instanceof Error ? err.message : 'Не вдалося видалити курс');
            }
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberUsername.trim()) {
            setError('Ім\'я користувача є обов\'язковим');
            return;
        }

        if (courseId) {
            try {
                await addCourseMember(parseInt(courseId), { username: newMemberUsername, role: 'STUDENT' });
                setNewMemberUsername('');
                setShowAddMemberModal(false);
                loadCourse();
            } catch (err) {
                console.error('Error adding member:', err);
                setError(err instanceof Error ? err.message : 'Не вдалося додати учасника');
            }
        }
    };

    if (authLoading || loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-full">
                    <p className="text-primary text-2xl font-montserrat">Завантаження...</p>
                </div>
            </Layout>
        );
    }

    if (!isAuthenticated) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-full">
                    <p className="text-primary text-2xl font-montserrat">Увійдіть для перегляду курсу</p>
                </div>
            </Layout>
        );
    }

    if (error || !course) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-red-500 text-2xl font-montserrat mb-4">
                        {error || 'Курс не знайдено'}
                    </p>
                    <button
                        onClick={() => navigate('/courses')}
                        className="px-6 py-3 bg-primary hover:bg-secondary text-white rounded-[10px] font-montserrat transition-colors duration-200"
                    >
                        Повернутися до курсів
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="w-full h-full bg-gray-50 flex flex-col">
                {/* Course Header */}
                <div className="bg-gradient-to-r from-primary to-secondary px-4 sm:px-8 py-6">
                    <div className="flex flex-col md:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/courses')}
                                className="text-white hover:text-white/80 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <div>
                                <h1 className="text-white text-2xl sm:text-3xl font-normal font-montserrat">
                                    {course.name}
                                </h1>
                                {isOwnerOrProfessor && (
                                    <div className="flex items-center gap-2">
                                        <p className="text-white/80 text-sm font-montserrat">
                                            {showCourseId ? `ID: ${course.id}` : 'ID: ••••'}
                                        </p>
                                        <button
                                            onClick={() => setShowCourseId(!showCourseId)}
                                            className="text-white/80 hover:text-white transition-colors"
                                        >
                                            {showCourseId ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                )}
                                <p className="text-white/80 text-sm font-montserrat mt-1">
                                    {course.members.length} {course.members.length === 1 ? 'учасник' : 'учасників'}
                                    {!course.isOpen && ' • Курс закрито'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-center">
                            {course.photoUrl && (
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20">
                                    <CloudImage
                                        publicLink={course.photoUrl}
                                        alt={course.name}
                                        className="w-full h-full object-cover"
                                        fallbackSrc=""
                                    />
                                </div>
                            )}
                            {isOwnerOrProfessor && (
                                <button
                                    onClick={() => handleDeleteCourse(course.id)}
                                    className="px-4 py-2 bg-error hover:bg-error/80 text-white rounded-[10px] font-montserrat transition-colors duration-200"
                                >
                                    Видалити курс
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white border-b border-gray-200 px-4 sm:px-8">
                    <div className="flex gap-4 overflow-x-auto whitespace-nowrap">
                        <button
                            onClick={() => setActiveTab('feed')}
                            className={`py-4 px-1 font-montserrat text-lg transition-colors border-b-2 ${activeTab === 'feed' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}>
                            Стрічка
                        </button>

                        <button
                            onClick={() => setActiveTab('materials')}
                            className={`py-4 px-1 font-montserrat text-lg transition-colors border-b-2 ${activeTab === 'materials' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}>
                            Матеріали
                        </button>

                        <button
                            onClick={() => setActiveTab('assignments')}
                            className={`py-4 px-1 font-montserrat text-lg transition-colors border-b-2 ${activeTab === 'assignments' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}>
                            Завдання
                        </button>

                        <button
                            onClick={() => setActiveTab('conference')}
                            className={`py-4 px-1 font-montserrat text-lg transition-colors border-b-2 ${activeTab === 'conference' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}>
                            Конференція
                        </button>

                        <button
                            onClick={() => setActiveTab('chats')}
                            className={`py-4 px-1 font-montserrat text-lg transition-colors border-b-2 ${activeTab === 'chats' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}>
                            Чати
                        </button>

                        {isOwnerOrProfessor && (
                            <button
                                onClick={() => setActiveTab('grades')}
                                className={`py-4 px-1 font-montserrat text-lg transition-colors border-b-2 ${activeTab === 'grades' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}>
                                Журнал оцінок
                            </button>
                        )}

                        <button
                            onClick={() => setActiveTab('members')}
                            className={`py-4 px-1 font-montserrat text-lg transition-colors border-b-2 ${activeTab === 'members' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}>
                            Учасники
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                    {activeTab === 'feed' && (
                        <FeedTab courseId={course.id} />
                    )}

                    {activeTab === 'materials' && (
                        <MaterialsTab courseId={course.id} isOpen={course.isOpen} userRole={userRole} focusId={focusId} />
                    )}

                    {activeTab === 'assignments' && (
                        <AssignmentsTab courseId={course.id} isOpen={course.isOpen} userRole={userRole} focusId={focusId} />
                    )}

                    {activeTab === 'conference' && (
                        <ConferenceProvider courseId={course.id}>
                            <ConferenceTab courseId={course.id} userRole={userRole} focusId={focusId} />
                        </ConferenceProvider>
                    )}

                    {activeTab === 'chats' && (
                        <CourseChatsTab courseId={course.id} userRole={userRole} />
                    )}

                    {activeTab === 'grades' && (
                        <GradesJournalTab
                            courseId={course.id}
                            members={course.members}
                        />
                    )}

                    {activeTab === 'members' && (
                        <div className="space-y-4">
                            <h2 className="text-primary text-2xl font-montserrat mb-4">
                                Учасники курсу
                            </h2>
                            {isOwnerOrProfessor && (
                                <button
                                    onClick={() => setShowAddMemberModal(true)}
                                    className="px-6 py-3 bg-accent hover:bg-secondary text-white rounded-[10px] font-montserrat text-lg transition-colors duration-200 mb-4"
                                >
                                    Додати учасника
                                </button>
                            )}

                            {course.members.map((member) => (
                                <div
                                    key={member.username}
                                    className="bg-white rounded-[10px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
                                        <div>
                                            <p className="text-primary text-lg font-montserrat">
                                                {member.username}
                                            </p>
                                            <p className="text-gray-500 text-sm font-montserrat">
                                                {member.role}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-gray-400 text-sm font-montserrat self-start sm:self-center">
                                        {new Date(member.createdAt).toLocaleDateString('uk-UA')}
                                    </p>

                                    {isOwnerOrProfessor && (
                                        <div className="flex flex-col sm:flex-row gap-2 self-end sm:self-center">
                                            <button
                                                onClick={() => handleChangeRole(member.username)}
                                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-[10px] font-montserrat transition-colors duration-200"
                                            >
                                                Змінити роль
                                            </button>
                                            <button
                                                onClick={() => handleRemoveMember(member.username)}
                                                className="px-4 py-2 bg-error hover:bg-error/80 text-white rounded-[10px] font-montserrat transition-colors duration-200"
                                            >
                                                Видалити
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add Member Modal */}
                {showAddMemberModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-[10px] p-8 max-w-md w-full">
                            <h2 className="text-primary text-2xl font-normal font-montserrat mb-6">
                                Додати учасника
                            </h2>

                            <form onSubmit={handleAddMember}>
                                <div className="mb-4">
                                    <label className="block text-primary text-lg font-montserrat mb-2">
                                        Ім'я користувача *
                                    </label>
                                    <input
                                        type="text"
                                        value={newMemberUsername}
                                        onChange={(e) => setNewMemberUsername(e.target.value)}
                                        placeholder="Введіть ім'я користувача"
                                        required
                                        className="w-full h-14 px-4 bg-gray-50 rounded-[10px] border-2 border-gray-200 focus:border-primary outline-none text-primary text-lg font-montserrat transition-colors duration-200"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddMemberModal(false);
                                            setNewMemberUsername('');
                                            setError(null);
                                        }}
                                        className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-primary rounded-[10px] font-montserrat text-lg transition-colors duration-200"
                                    >
                                        Скасувати
                                    </button>

                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-accent hover:bg-secondary text-white rounded-[10px] font-montserrat text-lg transition-colors duration-200"
                                    >
                                        Додати
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}