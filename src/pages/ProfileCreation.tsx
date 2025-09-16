import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProfile, getUploadLink, uploadFile, getPublicLink, updateProfile } from '../api/client';
import { useAuth } from '../context/AuthContext';
import WaveBackground from '../components/WaveBackground';
import type { ProfileData, SelectedFile } from '../types';

export default function ProfileCreation() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    biography: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Show loading while checking authentication
  if (authLoading) {
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile({
          file: file,
          preview: event.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

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
      // Step 1: Create profile first (without photo)
      console.log('Creating profile without photo first...');
      const response = await createProfile({
        ...formData,
        photoUrl: ''
      });
      
      console.log('Profile created successfully:', response);

      // Step 2: If user selected a photo, upload it and update profile
      if (selectedFile) {
        console.log('Now uploading photo and updating profile...');
        
        // Get upload link (now that profile exists)
        const uploadLinkResponse = await getUploadLink('profile-photo');
        console.log('Got upload link:', uploadLinkResponse);
        
        // Upload file
        const uploadResponse = await uploadFile(uploadLinkResponse.link, selectedFile.file);
        console.log('File uploaded, got fileid:', uploadResponse.fileid);
        
        // Get public link
        const publicLinkResponse = await getPublicLink(uploadResponse.fileid);
        console.log('Got public link:', publicLinkResponse.link);
        
        // Update profile with photo
        const updateResponse = await updateProfile({
          ...formData,
          photoUrl: publicLinkResponse.link
        });
        console.log('Profile updated with photo:', updateResponse);
      }
      
      setSuccess('Профіль успішно створено!');
      
      // Redirect after successful creation
      setTimeout(() => {
        navigate('/dashboard'); // or wherever you want to redirect
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Помилка створення профілю';
      setError(errorMessage);
      console.error('Profile creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/'); // Go back to login page
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
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            {/* Profile Picture Container */}
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg">
              {selectedFile ? (
                <img 
                  src={selectedFile.preview} 
                  alt="Profile preview" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                </div>
              )}
            </div>
            
            {/* Edit Button */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors duration-200 shadow-lg">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <img src="/assets/pen.svg" alt="Edit" className="w-4 h-4" />
            </div>
          </div>
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
              onClick={() => {
                // Add delete functionality here
                console.log('Delete profile');
              }}
              className="w-full h-full bg-transparent border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:bg-red-500/80 transition-colors duration-150 flex items-center justify-center"
            >
              <span className="text-white text-xl font-normal font-montserrat">
                Видалити
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
                {loading ? 'Збереження...' : 'Зберегти'}
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
        
        {success && (
          <div className="text-center text-green-300 text-lg font-normal font-montserrat">
            {success}
          </div>
        )}
        
      </form>
    </WaveBackground>
  );
}
