import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProfile, updateProfile, getProfile } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getUsernameFromToken } from '../services/auth';
import WaveBackground from '../components/WaveBackground';
import { ImageUpload } from '../components/ImageUpload';
import { generateUniqueProfilePhotoName } from '../api/cloudStorage';
import type { ProfileData } from '../types';

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
      
      {/* Back Button - Top Left Corner */}
      <button
        onClick={handleCancel}
        className="fixed top-4 left-4 w-14 h-14 flex items-center justify-center cursor-pointer bg-white/20 hover:bg-white/30 rounded-full transition-colors duration-200 z-[9999] backdrop-blur-sm shadow-lg border border-white/30"
      >
        <img src="/assets/arrow.svg" alt="Back" className="w-6 h-6" />
      </button>
      
      {/* Form container - centered on the colored part */}
      <form onSubmit={handleSubmit} className="absolute right-[30%] top-1/2 transform translate-x-1/2 -translate-y-1/2 w-[511px]">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white font-montserrat mb-2">
            {isEditing ? 'Редагувати профіль' : 'Створити профіль'}
          </h1>
          <p className="text-white/80 text-lg font-montserrat">
            {isEditing ? 'Оновіть інформацію про себе' : 'Заповніть інформацію про себе'}
          </p>
        </div>
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

        {/* First Name input background */}
        <div className="w-full h-16 bg-white rounded-[10px] mb-4 relative shadow-sm hover:shadow-md transition-shadow duration-200">
          <input
            type="text"
            name="firstName"
            placeholder="Ім'я"
            value={formData.firstName}
            onChange={handleChange}
            required
            maxLength={32}
            className="w-full h-full bg-transparent border-none outline-none px-4 py-2 text-primary text-xl font-normal font-montserrat placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-200"
          />
        </div>
        
        {/* Last Name input background */}
        <div className="w-full h-16 bg-white rounded-[10px] mb-4 relative shadow-sm hover:shadow-md transition-shadow duration-200">
          <input
            type="text"
            name="lastName"
            placeholder="Прізвище"
            value={formData.lastName}
            onChange={handleChange}
            maxLength={32}
            className="w-full h-full bg-transparent border-none outline-none px-4 py-2 text-primary text-xl font-normal font-montserrat placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-200"
          />
        </div>

        {/* Biography input background */}
        <div className="w-full h-20 bg-white rounded-[10px] mb-4 relative shadow-sm hover:shadow-md transition-shadow duration-200">
          <textarea
            name="biography"
            placeholder="Біографія"
            value={formData.biography}
            onChange={handleChange}
            maxLength={100}
            rows={2}
            className="w-full h-full bg-transparent border-none outline-none px-4 py-2 text-primary text-xl font-normal font-montserrat placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-200 resize-none"
          />
        </div>
        <div className="text-right text-white text-sm mb-6">
          {formData.biography.length}/100
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-4 mb-6">
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
          <div className="w-full h-16 bg-green-500 hover:bg-green-600 rounded-[10px] relative shadow-sm hover:shadow-lg transition-all duration-100 active:scale-[0.98]">
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-full bg-transparent border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:bg-green-500/80 transition-colors duration-150 flex items-center justify-center"
            >
              <span className="text-white text-xl font-normal font-montserrat">
                {loading ? (isEditing ? 'Оновлення...' : 'Створення...') : (isEditing ? 'Оновити' : 'Створити')}
              </span>
            </button>
          </div>
        </div>
        
        {/* Error/Success message - inline text */}
        {error && (
          <div className="text-center text-red-300 text-lg font-normal font-montserrat">
            {error}
          </div>
        )}
        
        
      </form>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-[20px] p-8 max-w-md mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Видалити акаунт
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              Ви впевнені, що хочете видалити свій акаунт? Ця дія незворотна і видалить всі ваші дані.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="flex-1 h-12 bg-gray-300 hover:bg-gray-400 rounded-[10px] text-gray-700 font-medium transition-colors duration-200 disabled:opacity-50"
              >
                Скасувати
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 h-12 bg-red-500 hover:bg-red-600 rounded-[10px] text-white font-medium transition-colors duration-200 disabled:opacity-50"
              >
                {deleteLoading ? 'Видалення...' : 'Видалити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </WaveBackground>
  );
}
