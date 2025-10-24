import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import CourseCard from '../components/CourseCard';
import { ImageUpload } from '../components/ImageUpload';
import { getUserCourses, createCourse } from '../api/courses';
import { generateUniqueCoursePhotoName } from '../api/cloudStorage';
import type { Course, CreateCourseRequest } from '../types';

export default function Courses() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newCourse, setNewCourse] = useState<CreateCourseRequest>({
    name: '',
    photoUrl: ''
  });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadCourses();
    }
  }, [isAuthenticated, authLoading]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUserCourses();
      setCourses(response.courses);
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Не вдалося завантажити курси');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCourse.name.trim()) {
      setError('Назва курсу є обов\'язковою');
      return;
    }

    try {
      setCreateLoading(true);
      setError(null);
      
      const response = await createCourse({
        name: newCourse.name,
        photoUrl: newCourse.photoUrl || undefined
      });
      
      console.log('Course created:', response);
      
      // Reset form and close modal
      setNewCourse({ name: '', photoUrl: '' });
      setShowCreateModal(false);
      
      // Reload courses
      await loadCourses();
    } catch (err) {
      console.error('Error creating course:', err);
      setError(err instanceof Error ? err.message : 'Не вдалося створити курс');
    } finally {
      setCreateLoading(false);
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
          <p className="text-primary text-2xl font-montserrat">Увійдіть для перегляду курсів</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full h-full bg-gray-50 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-primary text-4xl font-normal font-montserrat">Курси</h1>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-accent hover:bg-secondary text-white rounded-[10px] font-montserrat text-lg transition-colors duration-200"
          >
            Приєднатися до курсу
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-[10px] font-montserrat">
            {error}
          </div>
        )}

        {/* Courses grid */}
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 text-xl font-montserrat mb-4">
              У вас ще немає курсів
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary hover:bg-secondary text-white rounded-[10px] font-montserrat transition-colors duration-200"
            >
              Створити курс
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {/* Create Course Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-[10px] p-8 max-w-md w-full mx-4">
              <h2 className="text-primary text-2xl font-normal font-montserrat mb-6">
                Створити новий курс
              </h2>
              
              <form onSubmit={handleCreateCourse}>
                <div className="mb-4">
                  <label className="block text-primary text-lg font-montserrat mb-2">
                    Назва курсу *
                  </label>
                  <input
                    type="text"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                    placeholder="Введіть назву курсу"
                    required
                    className="w-full h-14 px-4 bg-gray-50 rounded-[10px] border-2 border-gray-200 focus:border-primary outline-none text-primary text-lg font-montserrat transition-colors duration-200"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-primary text-lg font-montserrat mb-2">
                    Фото курсу (необов'язково)
                  </label>
                  <ImageUpload
                    purpose="course-photo"
                    generateUniqueFileName={(file) => {
                      const extension = file.name.split('.').pop() || 'jpg';
                      // Use timestamp as courseId since we don't have it yet
                      return generateUniqueCoursePhotoName(Date.now(), extension);
                    }}
                    onUploadComplete={(publicLink) => {
                      setNewCourse({ ...newCourse, photoUrl: publicLink });
                    }}
                    currentImageUrl={newCourse.photoUrl}
                    maxSizeMB={5}
                    acceptedFormats={['image/jpeg', 'image/png', 'image/jpg', 'image/webp']}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewCourse({ name: '', photoUrl: '' });
                      setError(null);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-primary rounded-[10px] font-montserrat text-lg transition-colors duration-200"
                  >
                    Скасувати
                  </button>
                  
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 px-6 py-3 bg-accent hover:bg-secondary disabled:opacity-50 text-white rounded-[10px] font-montserrat text-lg transition-colors duration-200"
                  >
                    {createLoading ? 'Створення...' : 'Створити'}
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


