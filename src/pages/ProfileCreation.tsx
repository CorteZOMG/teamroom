import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProfile } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface ProfileData {
  firstName: string;
  lastName: string;
  biography: string;
  profilePicture?: File;
}

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
  const [profileImage, setProfileImage] = useState<string | null>(null);

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
        <div className="text-primary text-2xl font-instrument">Завантаження...</div>
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
      setFormData({
        ...formData,
        profilePicture: file
      });
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
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
      const response = await createProfile(formData);
      setSuccess('Профіль успішно створено!');
      console.log('Profile creation response:', response);
      
      // Redirect after successful creation
      setTimeout(() => {
        navigate('/dashboard'); // or wherever you want to redirect
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Помилка створення профілю';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/'); // Go back to login page
  };

  return (
    <div className="w-screen h-screen relative bg-white overflow-hidden font-instrument">
      {/* Header */}
      <div className="w-full h-24 absolute top-0 bg-slate-500 flex items-center justify-between px-10">
        {/* Logo */}
        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
          <div className="w-14 h-11 bg-slate-500 rounded-sm"></div>
        </div>
        
        {/* Navigation Icons */}
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="w-16 h-10 bg-slate-500 rounded"></div>
          </div>
          <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="w-12 h-14 bg-slate-500 rounded"></div>
          </div>
          <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="w-12 h-14 bg-slate-500 rounded"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full h-full pt-24 flex">
        {/* Left Side - Form */}
        <div className="w-1/2 h-full flex flex-col items-center justify-center px-20">
          <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-8">
            {/* First Name Input */}
            <div className="space-y-2">
              <label className="text-white text-4xl font-normal">Ім'я *</label>
              <div className="w-full h-20 bg-gray-500 rounded-[10px] relative shadow-sm hover:shadow-md transition-shadow duration-200">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  maxLength={32}
                  className="w-full h-full bg-transparent border-none outline-none px-6 text-white text-4xl font-normal placeholder-gray-300 focus:placeholder-gray-200 transition-colors duration-200"
                  placeholder="Введіть ваше ім'я"
                />
              </div>
            </div>

            {/* Last Name Input */}
            <div className="space-y-2">
              <label className="text-white text-4xl font-normal">Прізвище</label>
              <div className="w-full h-20 bg-gray-500 rounded-[10px] relative shadow-sm hover:shadow-md transition-shadow duration-200">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  maxLength={32}
                  className="w-full h-full bg-transparent border-none outline-none px-6 text-white text-4xl font-normal placeholder-gray-300 focus:placeholder-gray-200 transition-colors duration-200"
                  placeholder="Введіть ваше прізвище"
                />
              </div>
            </div>

            {/* Biography Input */}
            <div className="space-y-2">
              <label className="text-white text-4xl font-normal">Біографія</label>
              <div className="w-full h-80 bg-gray-500 rounded-[10px] relative shadow-sm hover:shadow-md transition-shadow duration-200">
                <textarea
                  name="biography"
                  value={formData.biography}
                  onChange={handleChange}
                  maxLength={100}
                  rows={8}
                  className="w-full h-full bg-transparent border-none outline-none px-6 py-4 text-white text-4xl font-normal placeholder-gray-300 focus:placeholder-gray-200 transition-colors duration-200 resize-none"
                  placeholder="Розкажіть про себе..."
                />
              </div>
              <div className="text-right text-gray-300 text-sm">
                {formData.biography.length}/100
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-6 pt-8">
              <button
                type="button"
                onClick={handleCancel}
                className="w-16 h-16 bg-gray-400 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                <div className="w-11 h-8 bg-white rounded"></div>
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="w-16 h-16 bg-accent hover:bg-secondary rounded-lg flex items-center justify-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-9 h-9 bg-white rounded"></div>
              </button>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="text-center text-red-300 text-lg font-normal">
                {error}
              </div>
            )}
            
            {success && (
              <div className="text-center text-green-300 text-lg font-normal">
                {success}
              </div>
            )}
          </form>
        </div>

        {/* Right Side - Profile Picture */}
        <div className="w-1/2 h-full bg-primary flex flex-col items-center justify-center px-20">
          <div className="w-72 h-72 relative">
            {/* Profile Picture Container */}
            <div className="w-60 h-60 left-6 top-6 absolute bg-slate-500 rounded-lg overflow-hidden">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-32 h-32 bg-gray-400 rounded-full"></div>
                </div>
              )}
            </div>
            
            {/* Upload Button */}
            <div className="w-16 h-16 left-[1088px] top-[454px] absolute bg-accent rounded-lg flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors duration-200">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-9 h-9 bg-white rounded"></div>
            </div>
          </div>
          
          <p className="text-white text-2xl font-normal mt-8 text-center">
            Завантажте фото профілю
          </p>
        </div>
      </div>
    </div>
  );
}
