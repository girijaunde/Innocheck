import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { apiService, getErrorMessage } from '../services/api';
import toast from '../services/toast';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    if (apiService.auth.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const validateForm = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return false;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.auth.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password
      });

      if (response.data.access_token) {
        apiService.auth.saveToken(response.data.access_token);

        // Save refresh token if available
        if (response.data.refresh_token) {
          apiService.auth.saveRefreshToken(response.data.refresh_token);
        }

        toast.success(`Welcome ${response.data.user?.name || 'to InnoCheck'}! Account created successfully.`);
        navigate('/');
      } else {
        setError('Account created but authentication failed. Please log in.');
        toast.error('Authentication token missing');
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1a1d27] border border-gray-800 rounded-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create your InnoCheck account</h2>
          <p className="text-gray-400 text-sm">Join and start validating your next big idea</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
            <input
              type="text"
              required
              disabled={isLoading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input
              type="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input
              type="password"
              required
              disabled={isLoading}
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              disabled={isLoading}
              minLength={8}
              maxLength={128}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900 bg-opacity-20 border border-red-700 rounded-lg">
              <p className="text-sm text-red-400 flex items-start">
                <span className="mr-2">✕</span>
                <span>{error}</span>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating account...</span>
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
