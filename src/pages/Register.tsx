import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHoverAnimation } from '../hooks/useHoverAnimation';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { AnimatedSection } from '../components/AnimatedSection';
import { AnimatedText } from '../components/AnimatedText';
import type { RegisterRequest } from '../types';

export default function Register() {
  const navigate = useNavigate();
  const { register: authRegister, login: authLogin } = useAuth();
  const { hoverState, config } = useHoverAnimation({
    transitionDuration: 0.3,
    scaleFactor: 1.05,
    threshold: 0.4
  });
  
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoLoginLoading, setAutoLoginLoading] = useState(false);

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

    try {
      await authRegister(formData);
      console.log('Registration successful');

      // Auto-login with the same credentials after successful registration
      setAutoLoginLoading(true);
      try {
        await authLogin({
          username: formData.username,
          password: formData.password
        });
        console.log('Auto-login successful');
        
        // Redirect to messenger immediately after successful auto-login
        navigate('/messenger');
      } catch (loginError) {
        console.log('Auto-login failed, redirecting to login page');
        // If auto-login fails, redirect to login page
        navigate('/');
      } finally {
        setAutoLoginLoading(false);
      }

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
    <div className="w-screen h-screen relative overflow-hidden font-montserrat">
      {/* Animated Background - Solid on mobile, animated on desktop */}
      <div className="lg:hidden absolute inset-0 bg-primary" />
      <div className="hidden lg:block">
        <AnimatedBackground hoverState={hoverState} transitionDuration={config.transitionDuration} />
      </div>
      
      {/* Mobile/Tablet Layout (< 1024px) */}
      <div className="lg:hidden flex flex-col items-center justify-center h-full px-4 sm:px-6 md:px-8 relative z-10">
        {/* Header Text - Mobile */}
        <div className="mb-8 sm:mb-10 md:mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-normal font-montserrat text-white leading-tight">
            Let's complete<br />a registration
          </h1>
        </div>

        {/* Form Container - Mobile */}
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit}>
            {/* Username Input */}
            <div className="w-full h-16 sm:h-20 md:h-24 bg-white rounded-[10px] mb-4 sm:mb-5 md:mb-6 relative shadow-sm hover:shadow-md transition-shadow duration-200">
              <input
                type="text"
                name="username"
                placeholder="Ім'я"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full h-full bg-transparent border-none outline-none px-4 sm:px-5 md:px-6 py-2 text-slate-700 text-xl sm:text-2xl md:text-3xl font-normal font-montserrat placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-200"
              />
            </div>

            {/* Email Input */}
            <div className="w-full h-16 sm:h-20 md:h-24 bg-white rounded-[10px] mb-4 sm:mb-5 md:mb-6 relative shadow-sm hover:shadow-md transition-shadow duration-200">
              <input
                type="email"
                name="email"
                placeholder="Пошта"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full h-full bg-transparent border-none outline-none px-4 sm:px-5 md:px-6 py-2 text-slate-700 text-xl sm:text-2xl md:text-3xl font-normal font-montserrat placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-200"
              />
            </div>
            
            {/* Password Input */}
            <div className="w-full h-16 sm:h-20 md:h-24 bg-white rounded-[10px] mb-4 sm:mb-5 md:mb-6 relative shadow-sm hover:shadow-md transition-shadow duration-200">
              <input
                type="password"
                name="password"
                placeholder="Пароль"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full h-full bg-transparent border-none outline-none px-4 sm:px-5 md:px-6 py-2 text-slate-700 text-xl sm:text-2xl md:text-3xl font-normal font-montserrat placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-200"
              />
            </div>
            
            {/* Submit Button */}
            <div className="w-full h-16 sm:h-20 md:h-24 bg-accent hover:bg-secondary rounded-[10px] mb-4 sm:mb-5 md:mb-6 relative shadow-sm hover:shadow-lg transition-all duration-100 active:scale-[0.98]">
              <button 
                type="submit"
                disabled={loading || autoLoginLoading}
                className="w-full h-full bg-transparent border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:bg-accent/80 transition-colors duration-150 flex items-center justify-center"
              >
                <span className="text-white text-xl sm:text-2xl md:text-3xl font-normal">
                  {loading ? 'Реєстрація...' : autoLoginLoading ? 'Вхід...' : 'Зареєструватись'}
                </span>
              </button>
            </div>
            
            {/* Login link */}
            <div 
              onClick={() => navigate('/')}
              className="text-center text-lg sm:text-xl md:text-2xl font-normal font-montserrat cursor-pointer hover:text-gray-200 transition-colors duration-200 mb-2 text-white"
            >
              Є акаунт? Авторизуйтесь
            </div>
            
            {/* Error message */}
            {error && (
              <div className="text-center text-red-300 text-base sm:text-lg font-normal font-montserrat mt-4">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Desktop Layout (>= 1024px) - Original Split Screen */}
      <div className="hidden lg:block">
        {/* Left side - Text section */}
        <AnimatedSection
          isHovered={hoverState.isLeftHovered}
          className="absolute top-1/2 -translate-y-1/2 w-96 h-56"
          style={{
            left: hoverState.isLeftHovered ? '0%' : '0%',
            right: hoverState.isLeftHovered ? '40%' : '60%',
            width: hoverState.isLeftHovered ? '60%' : '40%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          transitionDuration={config.transitionDuration}
          scaleFactor={config.scaleFactor}
        >
          <AnimatedText
            hoverState={hoverState}
            isLeftSide={true}
            className="text-6xl font-normal font-montserrat"
            transitionDuration={config.transitionDuration}
          >
            Let's complete<br/>a registration
          </AnimatedText>
        </AnimatedSection>
      
        {/* Right side - Form section */}
        <AnimatedSection
          isHovered={hoverState.isRightHovered}
          className="absolute top-1/2 transform -translate-y-1/2"
          style={{
            left: hoverState.isRightHovered ? '40%' : '60%',
            right: hoverState.isRightHovered ? '0%' : '0%',
            width: hoverState.isRightHovered ? '60%' : '40%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          transitionDuration={config.transitionDuration}
          scaleFactor={config.scaleFactor}
        >
          <div className="w-full max-w-[511px] mx-auto">
            <form onSubmit={handleSubmit}>
              {/* Username Input */}
              <div className="w-full h-24 bg-white rounded-[10px] mb-6 relative shadow-sm hover:shadow-md transition-shadow duration-200">
                <input
                  type="text"
                  name="username"
                  placeholder="Ім'я"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full h-full bg-transparent border-none outline-none px-6 text-slate-700 text-4xl font-normal font-montserrat placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-200"
                />
              </div>

              {/* Email Input */}
              <div className="w-full h-24 bg-white rounded-[10px] mb-6 relative shadow-sm hover:shadow-md transition-shadow duration-200">
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
              <div className="w-full h-24 bg-white rounded-[10px] mb-6 relative shadow-sm hover:shadow-md transition-shadow duration-200">
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
              <div className="w-full h-24 bg-accent hover:bg-secondary rounded-[10px] mb-6 relative shadow-sm hover:shadow-lg transition-all duration-100 active:scale-[0.98]">
                <button 
                  type="submit"
                  disabled={loading || autoLoginLoading}
                  className="w-full h-full bg-transparent border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:bg-accent/80 transition-colors duration-150 flex items-center justify-center"
                >
                  <span className="text-white text-4xl font-normal">
                    {loading ? 'Реєстрація...' : autoLoginLoading ? 'Вхід...' : 'Зареєструватись'}
                  </span>
                </button>
              </div>
            
              {/* Login link */}
              <AnimatedText
                hoverState={hoverState}
                isLeftSide={false}
                className="text-center text-2xl font-normal cursor-pointer hover:text-gray-200 transition-colors duration-200 mb-4"
                transitionDuration={config.transitionDuration}
              >
                <div onClick={() => navigate('/')}>
                  Є акаунт? Авторизуйтесь
                </div>
              </AnimatedText>
            
              {/* Error message */}
              {error && (
                <div className="text-center text-red-300 text-lg font-normal">
                  {error}
                </div>
              )}
            </form>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}