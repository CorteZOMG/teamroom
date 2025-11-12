import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProfile, updateProfile, getProfile } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getUsernameFromToken } from '../services/auth';
import WaveBackground from '../components/WaveBackground';
import { ImageUpload } from '../components/ImageUpload';
import { generateUniqueProfilePhotoName } from '../api/cloudStorage';
import { getUserCourses, getCourse, getCourseAssignments, getMyCourseResponses } from '../api/courses';
import type { ProfileData, AssignmentResponseDTO } from '../types';

export default function ProfileCreation() {
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading, deleteUser } = useAuth();
    const [formData, setFormData] = useState<ProfileData>({
        firstName: '',
        lastName: '',
        biography: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [photoUrl, setPhotoUrl] = useState<string>('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [existingProfile, setExistingProfile] = useState<any>(null);

    // Student stats state
    const [stats, setStats] = useState({
        totalCourses: 0,
        totalAssignments: 0,
        accomplishedAssignments: 0,
        completedAssignments: 0,
        notCompletedAssignments: 0,
        averageScore: 0
    });
    const [statsLoading, setStatsLoading] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, authLoading, navigate]);

    // Check for existing profile and load it
    useEffect(() => {
        const loadExistingProfile = async () => {
            if (!isAuthenticated || authLoading) return;

            try {
                setProfileLoading(true);
                const profile = await getProfile();
                setExistingProfile(profile);
                setIsEditing(true);

                // Load existing profile data into form
                setFormData({
                    firstName: profile.firstName || '',
                    lastName: profile.lastName || '',
                    biography: profile.biography || ''
                });

                // Load existing photo if available
                console.log('Profile loaded:', profile);
                console.log('Profile photoUrl:', profile.photoUrl);
                if (profile.photoUrl) {
                    setPhotoUrl(profile.photoUrl);
                    console.log('Set photoUrl to:', profile.photoUrl);
                } else {
                    console.log('No photoUrl in profile');
                }
            } catch (err) {
                // Profile doesn't exist, user needs to create one
                console.log('No existing profile found, user needs to create one');
                setIsEditing(false);
            } finally {
                setProfileLoading(false);
            }
        };

        loadExistingProfile();
    }, [isAuthenticated, authLoading]);

    // Load student stats
    useEffect(() => {
        const loadStats = async () => {
            if (!isAuthenticated || authLoading) return;

            try {
                setStatsLoading(true);

                // Get user's courses
                const coursesResponse = await getUserCourses();
                const courseSummaries = coursesResponse.courses;

                // Fetch full course details to get members array
                const username = getUsernameFromToken();
                const fullCourses = await Promise.all(
                    courseSummaries.map(summary => getCourse(summary.id))
                );

                // Filter only courses where user is a STUDENT or LEADER
                const studentCourses = fullCourses.filter(course => {
                    const member = course.members.find(m => m.username === username);
                    return member?.role === 'STUDENT' || member?.role === 'LEADER';
                });
                const totalCourses = studentCourses.length;

                // For each course, get assignments and responses
                let totalAssignments = 0;
                let accomplishedAssignments = 0;
                let completedAssignments = 0;
                let totalScore = 0;
                let gradedCount = 0;

                for (const course of studentCourses) {
                    try {
                        // Get assignments for this course
                        const assignmentsResponse = await getCourseAssignments(course.id);
                        const assignments = assignmentsResponse.assignments;
                        totalAssignments += assignments.length;

                        // Get user's responses for this course
                        const userRole = course.members.find(m => m.username === username)?.role;
                        let responses: AssignmentResponseDTO[] = [];
                        
                        try {
                            const responsesResponse = await getMyCourseResponses(course.id);
                            responses = responsesResponse.responses;
                        } catch (err) {
                            // If LEADER role doesn't have access, log and continue
                            if (userRole === 'LEADER') {
                                console.warn(`Unable to fetch responses for LEADER role in course ${course.id}. Backend may not support LEADER response queries.`);
                            } else {
                                throw err;
                            }
                        }

                        // Count accomplished (submitted) assignments
                        accomplishedAssignments += responses.length;

                        // Sum up graded scores and count completed
                        for (const response of responses) {
                            if (response.isGraded && response.grade !== undefined && response.grade !== null) {
                                totalScore += response.grade;
                                gradedCount++;
                                completedAssignments++;
                            }
                        }
                    } catch (err) {
                        console.error(`Error loading stats for course ${course.id}:`, err);
                    }
                }

                // Calculate average score and not completed
                const averageScore = gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0;
                const notCompletedAssignments = totalAssignments - completedAssignments;

                setStats({
                    totalCourses,
                    totalAssignments,
                    accomplishedAssignments,
                    completedAssignments,
                    notCompletedAssignments,
                    averageScore
                });
                
                console.log('Stats loaded:', {
                    totalCourses,
                    totalAssignments,
                    accomplishedAssignments,
                    completedAssignments,
                    averageScore
                });
            } catch (err) {
                console.error('Error loading stats:', err);
            } finally {
                setStatsLoading(false);
            }
        };

        loadStats();
    }, [isAuthenticated, authLoading]);

    // Show loading while checking authentication or loading profile
    if (authLoading || profileLoading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-white">
                <div className="text-primary text-2xl font-montserrat">Завантаження...</div>
            </div>
        );
    }

    // Don't render if not authenticated (will redirect)
    if (!isAuthenticated) {
        return null;
    }

    // Validation functions
    const validateField = (name: string, value: string): string | null => {
        switch (name) {
            case 'firstName':
                if (!value.trim()) return 'Ім\'я є обов\'язковим';
                if (value.length > 32) return 'Ім\'я не може перевищувати 32 символи';
                break;
            case 'lastName':
                if (value.length > 32) return 'Прізвище не може перевищувати 32 символи';
                break;
            case 'biography':
                if (value.length > 100) return 'Біографія не може перевищувати 100 символів';
                break;
        }
        return null;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Validate field
        const validationError = validateField(name, value);
        if (validationError) {
            setError(validationError);
        } else {
            setError(null);
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleImageUploadComplete = (publicLink: string) => {
        setPhotoUrl(publicLink);
        console.log('Image uploaded successfully, public link:', publicLink);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validate all fields before submission
        const firstNameError = validateField('firstName', formData.firstName);
        const lastNameError = validateField('lastName', formData.lastName);
        const biographyError = validateField('biography', formData.biography);

        if (firstNameError || lastNameError || biographyError) {
            setError(firstNameError || lastNameError || biographyError);
            setLoading(false);
            return;
        }

        try {
            // Create or update profile with the uploaded photo URL
            let response;
            if (isEditing) {
                console.log('Updating existing profile...');
                response = await updateProfile({
                    ...formData,
                    photoUrl: photoUrl || existingProfile?.photoUrl || ''
                });
                console.log('Profile updated successfully');
            } else {
                console.log('Creating new profile...');
                response = await createProfile({
                    ...formData,
                    photoUrl: photoUrl
                });
                console.log('Profile created successfully');
            }

            console.log('Profile operation successful:', response);

            // Redirect immediately after successful operation
            navigate('/messenger');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Помилка ${isEditing ? 'оновлення' : 'створення'} профілю`;
            setError(errorMessage);
            console.error('Profile operation error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/messenger'); // Go back to messenger
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        setError(null);

        try {
            await deleteUser();
            // Account deleted successfully, redirect to register page
            navigate('/register');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete account';
            setError(errorMessage);
            console.error('Account deletion error:', err);
        } finally {
            setDeleteLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <WaveBackground className="font-montserrat">

            {/* Back Button - Top Left Corner - Responsive */}
            <button
                onClick={handleCancel}
                className="fixed top-2 left-2 sm:top-3 sm:left-3 lg:top-4 lg:left-4 w-9 h-9 sm:w-10 sm:h-10 lg:w-14 lg:h-14 flex items-center justify-center cursor-pointer bg-primary hover:bg-secondary rounded-full transition-colors duration-200 z-[9999] shadow-lg"
            >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 12H5m7 7l-7-7 7-7" />
                </svg>
            </button>

            {/* Mobile/Tablet Card Background - ONLY show below lg breakpoint */}
            <div className="lg:hidden flex items-center justify-center min-h-screen w-full px-3 py-12 sm:px-4 sm:py-16">
                <div className="w-full max-w-[340px] sm:max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-5">
                    {/* Page Title - Compact */}
                    <div className="text-center mb-3 sm:mb-4">
                        <h1 className="text-xl sm:text-2xl font-bold text-primary font-montserrat mb-0.5 sm:mb-1">
                            {isEditing ? 'Редагувати профіль' : 'Створити профіль'}
                        </h1>
                        <p className="text-gray-600 text-xs sm:text-sm font-montserrat">
                            {isEditing ? 'Оновіть інформацію про себе' : 'Заповніть інформацію про себе'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Profile Picture Section - More compact */}
                        <div className="flex flex-col items-center mb-3 sm:mb-4">
                            <ImageUpload
                                purpose="profile-photo"
                                generateUniqueFileName={(file) => {
                                    const extension = file.name.split('.').pop() || 'jpg';
                                    const username = getUsernameFromToken() || 'user';
                                    return generateUniqueProfilePhotoName(username, extension);
                                }}
                                onUploadComplete={handleImageUploadComplete}
                                currentImageUrl={photoUrl}
                                maxSizeMB={5}
                                acceptedFormats={['image/jpeg', 'image/png', 'image/jpg', 'image/webp']}
                            />
                        </div>

                        {/* First Name input - Compact */}
                        <div className="w-full h-10 sm:h-12 bg-gray-100 rounded-lg mb-2 sm:mb-3 relative shadow-sm hover:shadow-md transition-shadow duration-200">
                            <input
                                type="text"
                                name="firstName"
                                placeholder="Ім'я"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                maxLength={32}
                                className="w-full h-full bg-transparent border-none outline-none px-3 py-2 text-primary text-sm sm:text-base font-normal font-montserrat placeholder-gray-400 focus:placeholder-gray-500 transition-colors duration-200"
                            />
                        </div>

                        {/* Last Name input - Compact */}
                        <div className="w-full h-10 sm:h-12 bg-gray-100 rounded-lg mb-2 sm:mb-3 relative shadow-sm hover:shadow-md transition-shadow duration-200">
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Прізвище"
                                value={formData.lastName}
                                onChange={handleChange}
                                maxLength={32}
                                className="w-full h-full bg-transparent border-none outline-none px-3 py-2 text-primary text-sm sm:text-base font-normal font-montserrat placeholder-gray-400 focus:placeholder-gray-500 transition-colors duration-200"
                            />
                        </div>

                        {/* Biography textarea - Compact */}
                        <div className="w-full h-14 sm:h-16 bg-gray-100 rounded-lg mb-1 sm:mb-2 relative shadow-sm hover:shadow-md transition-shadow duration-200">
                            <textarea
                                name="biography"
                                placeholder="Біографія"
                                value={formData.biography}
                                onChange={handleChange}
                                maxLength={100}
                                rows={2}
                                className="w-full h-full bg-transparent border-none outline-none px-3 py-2 text-primary text-sm sm:text-base font-normal font-montserrat placeholder-gray-400 focus:placeholder-gray-500 transition-colors duration-200 resize-none"
                            />
                        </div>
                        <div className="text-right text-gray-600 text-xs mb-3 sm:mb-4">
                            {formData.biography.length}/100
                        </div>

                        {/* Stats Button - Compact */}
                        {!statsLoading && (
                            <button
                                type="button"
                                onClick={() => setShowStatsModal(true)}
                                className="w-full h-10 sm:h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-lg mb-3 sm:mb-4 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span className="text-white text-sm sm:text-base font-medium font-montserrat">
                                    Переглянути статистику
                                </span>
                            </button>
                        )}

                        {/* Action Buttons - More compact */}
                        <div className="flex gap-2 mb-2 sm:mb-3">
                            {/* Delete Button */}
                            <div className="w-full h-10 sm:h-12 bg-red-500 hover:bg-red-600 rounded-lg relative shadow-sm hover:shadow-lg transition-all duration-100 active:scale-[0.98]">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={deleteLoading}
                                    className="w-full h-full bg-transparent border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:bg-red-500/80 transition-colors duration-150 flex items-center justify-center"
                                >
                                    <span className="text-white text-sm sm:text-base font-medium font-montserrat">
                                        {deleteLoading ? 'Видалення...' : 'Видалити'}
                                    </span>
                                </button>
                            </div>

                            {/* Create/Save Button - Accent color */}
                            <div className="w-full h-10 sm:h-12 bg-accent hover:bg-secondary rounded-lg relative shadow-sm hover:shadow-lg transition-all duration-100 active:scale-[0.98]">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-full bg-transparent border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:bg-accent/80 transition-colors duration-150 flex items-center justify-center"
                                >
                                    <span className="text-white text-sm sm:text-base font-medium font-montserrat">
                                        {loading ? (isEditing ? 'Оновлення...' : 'Створення...') : (isEditing ? 'Оновити' : 'Створити')}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Error message - Compact */}
                        {error && (
                            <div className="text-center text-red-500 text-xs sm:text-sm font-normal font-montserrat">
                                {error}
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Desktop Layout - White background with original size - ONLY show on lg+ */}
            <div className="hidden lg:flex items-center justify-center min-h-screen w-full">
                <div className="w-[600px] bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-10">
                    {/* Page Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-primary font-montserrat mb-2">
                            {isEditing ? 'Редагувати профіль' : 'Створити профіль'}
                        </h1>
                        <p className="text-gray-600 text-lg font-montserrat">
                            {isEditing ? 'Оновіть інформацію про себе' : 'Заповніть інформацію про себе'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>

                        {/* Profile Picture Section */}
                        <div className="flex flex-col items-center mb-8">
                            <ImageUpload
                                purpose="profile-photo"
                                generateUniqueFileName={(file) => {
                                    const extension = file.name.split('.').pop() || 'jpg';
                                    const username = getUsernameFromToken() || 'user';
                                    return generateUniqueProfilePhotoName(username, extension);
                                }}
                                onUploadComplete={handleImageUploadComplete}
                                currentImageUrl={photoUrl}
                                maxSizeMB={5}
                                acceptedFormats={['image/jpeg', 'image/png', 'image/jpg', 'image/webp']}
                            />
                        </div>

                        {/* First Name input */}
                        <div className="w-full h-16 bg-gray-100 rounded-[10px] mb-4 relative shadow-sm hover:shadow-md transition-shadow duration-200">
                            <input
                                type="text"
                                name="firstName"
                                placeholder="Ім'я"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                maxLength={32}
                                className="w-full h-full bg-transparent border-none outline-none px-4 py-2 text-primary text-xl font-normal font-montserrat placeholder-gray-400 focus:placeholder-gray-500 transition-colors duration-200"
                            />
                        </div>

                        {/* Last Name input */}
                        <div className="w-full h-16 bg-gray-100 rounded-[10px] mb-4 relative shadow-sm hover:shadow-md transition-shadow duration-200">
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Прізвище"
                                value={formData.lastName}
                                onChange={handleChange}
                                maxLength={32}
                                className="w-full h-full bg-transparent border-none outline-none px-4 py-2 text-primary text-xl font-normal font-montserrat placeholder-gray-400 focus:placeholder-gray-500 transition-colors duration-200"
                            />
                        </div>

                        {/* Biography textarea */}
                        <div className="w-full h-20 bg-gray-100 rounded-[10px] mb-4 relative shadow-sm hover:shadow-md transition-shadow duration-200">
                            <textarea
                                name="biography"
                                placeholder="Біографія"
                                value={formData.biography}
                                onChange={handleChange}
                                maxLength={100}
                                rows={2}
                                className="w-full h-full bg-transparent border-none outline-none px-4 py-2 text-primary text-xl font-normal font-montserrat placeholder-gray-400 focus:placeholder-gray-500 transition-colors duration-200 resize-none"
                            />
                        </div>
                        <div className="text-right text-gray-600 text-sm mb-6">
                            {formData.biography.length}/100
                        </div>

                        {/* Stats Button - Desktop */}
                        {!statsLoading && (
                            <button
                                type="button"
                                onClick={() => setShowStatsModal(true)}
                                className="w-full h-16 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-[10px] mb-6 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                            >
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span className="text-white text-xl font-normal font-montserrat">
                                    Переглянути статистику
                                </span>
                            </button>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4 mb-6">
                            {/* Delete Button */}
                            <div className="w-full h-16 bg-red-500 hover:bg-red-600 rounded-[10px] relative shadow-sm hover:shadow-lg transition-all duration-100 active:scale-[0.98]">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={deleteLoading}
                                    className="w-full h-full bg-transparent border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:bg-red-500/80 transition-colors duration-150 flex items-center justify-center"
                                >
                                    <span className="text-white text-xl font-normal font-montserrat">
                                        {deleteLoading ? 'Видалення...' : 'Видалити'}
                                    </span>
                                </button>
                            </div>

                            {/* Create/Save Button */}
                            <div className="w-full h-16 bg-accent hover:bg-secondary rounded-[10px] relative shadow-sm hover:shadow-lg transition-all duration-100 active:scale-[0.98]">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-full bg-transparent border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:bg-accent/80 transition-colors duration-150 flex items-center justify-center"
                                >
                                    <span className="text-white text-xl font-normal font-montserrat">
                                        {loading ? (isEditing ? 'Оновлення...' : 'Створення...') : (isEditing ? 'Оновити' : 'Створити')}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="text-center text-red-500 text-lg font-normal font-montserrat">
                                {error}
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Delete Confirmation Dialog - Compact */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] px-4">
                    <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 max-w-[300px] sm:max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">
                            Видалити акаунт
                        </h3>
                        <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-5 text-center leading-relaxed">
                            Ви впевнені, що хочете видалити свій акаунт? Ця дія незворотна і видалить всі ваші дані.
                        </p>
                        <div className="flex gap-2 sm:gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleteLoading}
                                className="flex-1 h-10 sm:h-11 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium transition-colors duration-200 disabled:opacity-50 text-sm"
                            >
                                Скасувати
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                                className="flex-1 h-10 sm:h-11 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition-colors duration-200 disabled:opacity-50 text-sm"
                            >
                                {deleteLoading ? 'Видалення...' : 'Видалити'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Modal */}
            {showStatsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] px-4">
                    <div className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl sm:text-2xl font-bold text-primary font-montserrat">
                                Статистика навчання
                            </h3>
                            <button
                                onClick={() => setShowStatsModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Overview Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 text-center">
                                <p className="text-primary text-3xl sm:text-4xl font-bold mb-1">{stats.totalCourses}</p>
                                <p className="text-gray-600 text-sm font-montserrat">Курсів</p>
                            </div>
                            <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-4 text-center">
                                <p className="text-accent text-3xl sm:text-4xl font-bold mb-1">{stats.averageScore}</p>
                                <p className="text-gray-600 text-sm font-montserrat">Середній бал</p>
                            </div>
                        </div>

                        {/* Assignments Breakdown */}
                        <div className="bg-gray-50 rounded-xl p-5 mb-4">
                            <h4 className="text-primary font-semibold font-montserrat mb-4 text-lg">
                                Завдання
                            </h4>

                            {/* Total Assignments */}
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
                                <span className="text-gray-700 font-montserrat">Всього завдань</span>
                                <span className="text-primary text-xl font-bold">{stats.totalAssignments}</span>
                            </div>

                            {/* Completed */}
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-gray-700 font-montserrat">Виконано (оцінено)</span>
                                </div>
                                <span className="text-green-600 text-lg font-semibold">{stats.completedAssignments}</span>
                            </div>

                            {/* Submitted but not graded */}
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="text-gray-700 font-montserrat">Здано (на перевірці)</span>
                                </div>
                                <span className="text-blue-600 text-lg font-semibold">
                                    {stats.accomplishedAssignments - stats.completedAssignments}
                                </span>
                            </div>

                            {/* Not Completed */}
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span className="text-gray-700 font-montserrat">Не виконано</span>
                                </div>
                                <span className="text-red-600 text-lg font-semibold">{stats.notCompletedAssignments}</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600 text-sm font-montserrat">Прогрес виконання</span>
                                    <span className="text-primary text-sm font-semibold">
                                        {stats.totalAssignments > 0 ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${stats.totalAssignments > 0 ? (stats.completedAssignments / stats.totalAssignments * 100) : 0}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowStatsModal(false)}
                            className="w-full h-12 bg-primary hover:bg-secondary rounded-xl text-white font-medium font-montserrat transition-colors duration-200"
                        >
                            Закрити
                        </button>
                    </div>
                </div>
            )}
        </WaveBackground>
    );
}