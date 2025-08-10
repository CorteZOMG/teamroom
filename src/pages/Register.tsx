import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, type RegisterRequest } from '../api/client';

export default function Register() {
  const navigate = useNavigate();
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await register(formData);
      setSuccess(`Registration successful! Welcome, ${response.username}!`);
      console.log('Register response:', response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          className="border w-full p-2 mb-3 rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="border w-full p-2 mb-3 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="border w-full p-2 mb-3 rounded"
        />
        <button 
          type="submit"
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded w-full hover:bg-green-600 disabled:opacity-50 mb-3"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
        
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-green-500 hover:text-green-700 text-sm"
          >
            I already have an account
          </button>
        </div>
      </form>
    </div>
  );
}
  