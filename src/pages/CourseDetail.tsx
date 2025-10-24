import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import MaterialsTab from '../components/MaterialsTab';
import AssignmentsTab from '../components/AssignmentsTab';
import { CloudImage } from '../components/CloudImage';
import { getCourse } from '../api/courses';
import type { Course } from '../types';

type TabType = 'feed' | 'materials' | 'assignments' | 'chats' | 'members';

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('materials');

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
            <MaterialsTab courseId={course.id} isOpen={course.isOpen} />
          )}
          
          {activeTab === 'assignments' && (
            <AssignmentsTab courseId={course.id} isOpen={course.isOpen} />
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}


