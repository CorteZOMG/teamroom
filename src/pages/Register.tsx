import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { RegisterRequest } from '../types';

export default function Register() {
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear messages when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await authRegister(formData);
      setSuccess('Registration successful! Please login to continue.');
      console.log('Registration successful');

       // Redirect to login page after successful registration
       // User needs to login to get authentication token
       setTimeout(() => {
        navigate('/'); // Redirect to login page
       }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      
       // More specific error handling (inspired by your login component)
      if (errorMessage.includes('timeout')) {
        setError('Час очікування з\'єднання. Перевірте ваше інтернет і спробуйте знову.');
      } else if (errorMessage.includes('offline')) {
        setError('Ви не з\'єднані з інтернетом. Перевірте ваше з\'єднання.');
      } else if (errorMessage.includes('500')) {
        setError('Помилка сервера. Спробуйте знову пізніше.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen relative bg-white overflow-hidden font-montserrat">
      {/* Right side - Colored background */}
      <div className="w-[60%] h-full absolute right-0 bg-primary" />
      
      {/* Main heading on the left */}
      <div className="w-96 h-56 left-[10%] top-1/2 -translate-y-1/2 absolute text-primary text-6xl font-normal font-montserrat">
        Let's complete a registration
      </div>
      
      {/* Form container - centered on the colored part */}
      <form onSubmit={handleSubmit} className="absolute right-[30%] top-1/2 transform translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        
        {/* Username Input */}
        <div className="w-[511px] h-24 bg-white rounded-[10px] mb-6 relative shadow-sm hover:shadow-md transition-shadow duration-200">
          <input
            type="text"
            name="username"
            placeholder="Ім’я"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full h-full bg-transparent border-none outline-none px-6 text-slate-700 text-4xl font-normal font-montserrat placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-200"
          />
        </div>

        {/* Email Input */}
        <div className="w-[511px] h-24 bg-white rounded-[10px] mb-6 relative shadow-sm hover:shadow-md transition-shadow duration-200">
          <input
            type="email"
            name="email"
            placeholder="Пошта"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full h-full bg-transparent border-none outline-none px-6 text-slate-700 text-4xl font-normal placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-200"
          />
        </div>
        
        {/* Password Input */}
        <div className="w-[511px] h-24 bg-white rounded-[10px] mb-6 relative shadow-sm hover:shadow-md transition-shadow duration-200">
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full h-full bg-transparent border-none outline-none px-6 text-slate-700 text-4xl font-normal placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-200"
          />
        </div>
        
        {/* Submit Button */}
        <div className="w-[511px] h-24 bg-accent hover:bg-secondary rounded-[10px] mb-6 relative shadow-sm hover:shadow-lg transition-all duration-100 active:scale-[0.98]">
          <button 
            type="submit"
            disabled={loading}
            className="w-full h-full bg-transparent border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:bg-accent/80 transition-colors duration-150 flex items-center justify-center"
          >
            <span className="text-white text-4xl font-normal">
              {loading ? 'Реєстрація...' : 'Зареєструватись'}
            </span>
          </button>
        </div>
        
        {/* Login link */}
        <div 
          className="text-center text-white text-2xl font-normal cursor-pointer hover:text-gray-200 transition-colors duration-200 mb-4"
          onClick={() => navigate('/')}
        >
          Є акаунт? Авторизуйтесь
        </div>
        
        {/* Status Messages Container */}
        <div className="w-[511px] h-8 text-center">
            {error && (
              <div className="text-red-300 text-lg font-normal">
                {error}
              </div>
            )}
            
            {success && (
              <div className="text-green-300 text-lg font-normal">
                {success}
              </div>
            )}
        </div>
        
      </form>
    </div>
  );
}