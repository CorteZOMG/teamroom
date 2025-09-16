import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { LoginRequest } from '../types';

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
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
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await authLogin(formData);
      setSuccess('Login successful! Welcome!');
      console.log('Login successful');
      
      // Redirect to profile creation after successful login
      setTimeout(() => {
        navigate('/profile/create');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      
      // More specific error handling
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Некоректне логін або пароль.');
      } else if (errorMessage.includes('timeout')) {
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
    <div className="w-screen h-screen relative bg-white overflow-hidden">
      {/* Left side - Primary background */}
      <div className="w-[60%] h-full absolute right-0 bg-primary" />
      
      {/* Main heading */}
      <div className="w-96 h-56 left-[10%] top-1/2 -translate-y-1/2 absolute text-primary text-6xl font-normal font-montserrat">
        Let's complete an auth
      </div>
      
      {/* Form container - centered on the colored part */}
      <form onSubmit={handleSubmit} className="absolute right-[30%] top-1/2 transform translate-x-1/2 -translate-y-1/2">
        {/* Username input background */}
        <div className="w-[511px] h-24 bg-white rounded-[10px] mb-6 relative shadow-sm hover:shadow-md transition-shadow duration-200">
          <input
            type="text"
            name="username"
            placeholder="Ім'я"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full h-full bg-transparent border-none outline-none px-6 py-2 text-primary text-4xl font-normal font-montserrat placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-200"
          />
        </div>
        
        {/* Password input background */}
        <div className="w-[511px] h-24 bg-white rounded-[10px] mb-6 relative shadow-sm hover:shadow-md transition-shadow duration-200">
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full h-full bg-transparent border-none outline-none px-6 py-2 text-primary text-4xl font-normal font-montserrat placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-200"
          />
        </div>
        
        {/* Submit button background */}
        <div className="w-[511px] h-24 bg-accent hover:bg-secondary rounded-[10px] mb-6 relative shadow-sm hover:shadow-lg transition-all duration-100 active:scale-[0.98]">
          <button 
            type="submit"
            disabled={loading}
            className="w-full h-full bg-transparent border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:bg-accent/80 transition-colors duration-150 flex items-center justify-center"
          >
            <span className="text-white text-4xl font-normal font-montserrat">
              {loading ? 'Завантаження...' : 'Авторизуватись'}
            </span>
          </button>
        </div>
        
        {/* Register link - with same spacing as input fields */}
        <div 
          className="text-center text-white text-2xl font-normal font-montserrat cursor-pointer hover:text-gray-200 transition-colors duration-200 mb-2"
          onClick={() => navigate('/register')}
        >
          Немає акаунту? Зареєструйтесь
        </div>
        
        {/* Profile creation link */}
        <div 
          className="text-center text-white text-xl font-normal font-montserrat cursor-pointer hover:text-gray-200 transition-colors duration-200 mb-2"
          onClick={() => navigate('/profile/create')}
        >
          Створити/Оновити профіль
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
    </div>
  );
}
