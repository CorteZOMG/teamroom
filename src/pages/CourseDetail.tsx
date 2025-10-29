import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import MaterialsTab from '../components/MaterialsTab';
import AssignmentsTab from '../components/AssignmentsTab';
import ConferenceTab from '../components/ConferenceTab';
import { CloudImage } from '../components/CloudImage';
import { getCourse, changeMemberRole, deleteMember, deleteCourse, addCourseMember } from '../api/courses';
import { getUsernameFromToken } from '../services/auth';
import type { Course } from '../types';

type TabType = 'feed' | 'materials' | 'assignments' | 'conference' | 'chats' | 'members';

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('materials');
  const [showCourseId, setShowCourseId] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState('');

  const currentUser = getUsernameFromToken();
  const userRole = course?.members.find(m => m.username === currentUser)?.role;
  const isOwnerOrProfessor = userRole === 'OWNER' || userRole === 'PROFESSOR';

  useEffect(() => {
    if (isAuthenticated && !authLoading && courseId) {
      loadCourse();
    }
  }, [isAuthenticated, authLoading, courseId]);

  const loadCourse = async () => {
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
  };

  const handleChangeRole = async (username: string) => {
    const newRole = prompt('Enter new role (OWNER, PROFESSOR, LEADER, STUDENT, VIEWER):');
    if (newRole && courseId) {
      try {
        await changeMemberRole(parseInt(courseId), { username, role: newRole as any });
        loadCourse();
      } catch (err) {
        console.error('Error changing role:', err);
        setError(err instanceof Error ? err.message : 'Не вдалося змінити роль');
      }
    }
  };

  const handleRemoveMember = async (username: string) => {
    if (window.confirm(`Are you sure you want to remove ${username} from the course?`)) {
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
    if (window.confirm('Are you sure you want to delete this course?')) {
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
        <div className="bg-gradient-to-r from-primary to-secondary px-8 py-6">
          <div className="flex items-center justify-between">
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
                <h1 className="text-white text-3xl font-normal font-montserrat">
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

            {/* Course photo */}
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
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-[10px] font-montserrat transition-colors duration-200"
              >
                Видалити курс
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('feed')}
              className={`py-4 px-2 font-montserrat text-lg transition-colors border-b-2 ${
                activeTab === 'feed'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-primary'
              }`}
            >
              Стрічка
            </button>
            
            <button
              onClick={() => setActiveTab('materials')}
              className={`py-4 px-2 font-montserrat text-lg transition-colors border-b-2 ${
                activeTab === 'materials'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-primary'
              }`}
            >
              Матеріали
            </button>
            
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-4 px-2 font-montserrat text-lg transition-colors border-b-2 ${
                activeTab === 'assignments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-primary'
              }`}
            >
              Завдання
            </button>

            <button
              onClick={() => setActiveTab('conference')}
              className={`py-4 px-2 font-montserrat text-lg transition-colors border-b-2 ${
                activeTab === 'conference'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-primary'
              }`}
            >
              Конференція
            </button>
            
            <button
              onClick={() => setActiveTab('chats')}
              className={`py-4 px-2 font-montserrat text-lg transition-colors border-b-2 ${
                activeTab === 'chats'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-primary'
              }`}
            >
              Чати
            </button>
            
            <button
              onClick={() => setActiveTab('members')}
              className={`py-4 px-2 font-montserrat text-lg transition-colors border-b-2 ${
                activeTab === 'members'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-primary'
              }`}
            >
              Учасники
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'feed' && (
            <div className="text-center text-gray-500 font-montserrat">
              <p className="text-xl">Стрічка курсу</p>
              <p className="mt-2">В розробці...</p>
            </div>
          )}
          
          {activeTab === 'materials' && (
            <MaterialsTab courseId={course.id} isOpen={course.isOpen} userRole={userRole} />
          )}
          
          {activeTab === 'assignments' && (
            <AssignmentsTab courseId={course.id} isOpen={course.isOpen} userRole={userRole} />
          )}

          {activeTab === 'conference' && (
            <ConferenceTab courseId={course.id} userRole={userRole} />
          )}
          
          {activeTab === 'chats' && (
            <div className="text-center text-gray-500 font-montserrat">
              <p className="text-xl">Чати курсу</p>
              <p className="mt-2">В розробці...</p>
            </div>
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
                  className="bg-white rounded-[10px] p-4 flex items-center justify-between shadow-sm"
                >
                  <div>
                    <p className="text-primary text-lg font-montserrat">
                      {member.username}
                    </p>
                    <p className="text-gray-500 text-sm font-montserrat">
                      {member.role}
                    </p>
                  </div>
                  
                  <p className="text-gray-400 text-sm font-montserrat">
                    {new Date(member.createdAt).toLocaleDateString('uk-UA')}
                  </p>

                  {isOwnerOrProfessor && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleChangeRole(member.username)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-[10px] font-montserrat transition-colors duration-200"
                      >
                        Змінити роль
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.username)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-[10px] font-montserrat transition-colors duration-200"
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-[10px] p-8 max-w-md w-full mx-4">
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


