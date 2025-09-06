import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, type LoginRequest } from '../api/client';
import { setToken } from '../services/auth';

export default function Login() {
  const navigate = useNavigate();
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
      const response = await login(formData);
      setToken(response.jwt);
      setSuccess(`Login successful! Welcome, ${response.username}!`);
      console.log('Login response:', response);
      
      // Auto redirect after successful login (optional)
      setTimeout(() => {
        // You can add navigation to dashboard here
        // navigate('/dashboard');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      
      // More specific error handling
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Invalid username or password. Please try again.');
      } else if (errorMessage.includes('timeout')) {
        setError('Connection timeout. Please check your internet and try again.');
      } else if (errorMessage.includes('offline')) {
        setError('You appear to be offline. Please check your connection.');
      } else if (errorMessage.includes('500')) {
        setError('Server error. Please try again later.');
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
      <div className="w-96 h-56 left-[157px] top-[379px] absolute justify-start text-primary text-6xl font-normal font-instrument">
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
            className="w-full h-full bg-transparent border-none outline-none px-6 py-2 text-primary text-4xl font-normal font-instrument placeholder-gray-500 focus:placeholder-gray-300 transition-colors duration-200"
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
            className="w-full h-full bg-transparent border-none outline-none px-6 py-2 text-primary text-4xl font-normal font-instrument placeholder-gray-500 focus:placeholder-gray-300 transition-colors duration-200"
          />
        </div>
        
        {/* Submit button background */}
        <div className="w-[511px] h-24 bg-accent hover:bg-secondary rounded-[10px] mb-6 relative shadow-sm hover:shadow-lg transition-all duration-100 active:scale-[0.98]">
          <button 
            type="submit"
            disabled={loading}
            className="w-full h-full bg-transparent border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:bg-accent/80 transition-colors duration-150 flex items-center justify-center"
          >
            <span className="text-white text-4xl font-normal font-instrument">
              {loading ? 'Завантаження...' : 'Авторизуватись'}
            </span>
          </button>
        </div>
        
        {/* Register link - with same spacing as input fields */}
        <div 
          className="text-center text-white text-2xl font-normal font-instrument cursor-pointer hover:text-gray-200 transition-colors duration-200 mb-2"
          onClick={() => navigate('/register')}
        >
          Немає акаунту? Зареєструйтесь
        </div>
        
        {/* Additional text under register link */}
        <div className="text-center text-white/70 text-lg font-normal font-instrument">
          Створіть новий акаунт для доступу до всіх функцій
        </div>
      </form>
      
      {/* Error message - positioned above form */}
      {error && (
        <div className="absolute right-[30%] top-[35%] transform translate-x-1/2 w-[511px] bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-[10px] text-center animate-pulse shadow-lg">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Помилка входу</span>
          </div>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {/* Success message - positioned above form */}
      {success && (
        <div className="absolute right-[30%] top-[35%] transform translate-x-1/2 w-[511px] bg-green-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-[10px] text-center animate-pulse shadow-lg">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Успішний вхід</span>
          </div>
          <p className="text-sm">{success}</p>
        </div>
      )}
    </div>
  );
}
