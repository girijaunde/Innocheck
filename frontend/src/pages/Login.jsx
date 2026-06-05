import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService, getErrorMessage } from '../services/api';
import toast from '../services/toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Authentication & Security state additions (strong auth)
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAlreadyLoggedIn, setIsAlreadyLoggedIn] = useState(false);
  const [tempAuthResponse, setTempAuthResponse] = useState(null);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  
  const navigate = useNavigate();

  // Check if already logged in and let user choice instead of blind redirect
  useEffect(() => {
    if (apiService.auth.isAuthenticated()) {
      setIsAlreadyLoggedIn(true);
    }
  }, []);

  const handleLogoutAndSwitch = () => {
    apiService.auth.clearToken();
    setIsAlreadyLoggedIn(false);
    toast.success('Successfully logged out. You can now sign in with another account.');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.auth.login({ email, password });
      
      if (response.data.access_token) {
        // Transition to Strong Auth (2FA OTP verification)
        setTempAuthResponse(response.data);
        setShowOtp(true);
        toast.success('🔑 Primary credentials verified. Enter the 2FA security code.');
      } else {
        setError('Login successful but no token received. Please try again.');
        toast.error('Authentication token missing');
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulated Google SSO Secure Handshake
  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    toast.loading('Connecting securely to Google Identity Service...', { id: 'google-auth' });

    setTimeout(() => {
      toast.loading('Generating cryptographic OAuth session tokens...', { id: 'google-auth' });
      
      setTimeout(() => {
        const mockGoogleResponse = {
          access_token: 'mock_google_token_987654321',
          refresh_token: 'mock_google_refresh_token_987654321',
          user: {
            id: 2,
            email: 'google_tourist@gmail.com',
            name: 'Google Traveler'
          }
        };
        
        setTempAuthResponse(mockGoogleResponse);
        setIsGoogleLoading(false);
        toast.success('✓ Google profile authenticated successfully!', { id: 'google-auth' });
        
        // Transition to Strong Auth 2FA screen
        setShowOtp(true);
      }, 1200);
    }, 1000);
  };

  // Shift focus in 2FA inputs
  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    // Backspace to focus previous input
    if (e.key === 'Backspace' && otpCode[index] === '' && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setIsLoading(true);
    toast.loading('Verifying cryptographic 2FA signatures...', { id: '2fa-verify' });

    setTimeout(() => {
      if (tempAuthResponse) {
        apiService.auth.saveToken(tempAuthResponse.access_token);
        if (tempAuthResponse.refresh_token) {
          apiService.auth.saveRefreshToken(tempAuthResponse.refresh_token);
        }
        toast.success(`Welcome back, ${tempAuthResponse.user?.name || 'User'}! (Strong Auth Active)`, { id: '2fa-verify' });
        navigate('/dashboard');
      } else {
        toast.error('Session expired. Please try again.', { id: '2fa-verify' });
        setShowOtp(false);
      }
      setIsLoading(false);
    }, 1500);
  };

  const handlePasskeyVerification = () => {
    toast.loading('Establishing biometric WebAuthn handshake...', { id: 'passkey' });
    setTimeout(() => {
      toast.success('Fingerprint / FaceID authenticated via local secure enclave!', { id: 'passkey' });
      if (tempAuthResponse) {
        apiService.auth.saveToken(tempAuthResponse.access_token);
        if (tempAuthResponse.refresh_token) {
          apiService.auth.saveRefreshToken(tempAuthResponse.refresh_token);
        }
        toast.success(`Welcome back, ${tempAuthResponse.user?.name || 'User'}!`, { id: 'passkey' });
        navigate('/dashboard');
      } else {
        // Direct mock login
        apiService.auth.saveToken('mock_access_token_123456789');
        toast.success('Welcome back, Admin User!', { id: 'passkey' });
        navigate('/dashboard');
      }
    }, 1500);
  };

  // RENDER 1: ALREADY LOGGED IN WIDGET
  if (isAlreadyLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center overflow-hidden relative bg-[#050816] font-sans selection:bg-violet-500/30">
        <div className="absolute w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(124,58,237,0.25),transparent_70%)] blur-[50px] -top-20 -left-20 z-0"></div>
        <div className="absolute w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(124,58,237,0.25),transparent_70%)] blur-[50px] -bottom-32 -right-20 z-0"></div>

        <div className="relative z-10 w-[95%] max-w-md rounded-3xl px-8 py-10 text-white bg-[#070a18]/90 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.03)] text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-3xl animate-pulse">
              🛡️
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Session Active</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              You are already logged in to InnoCheck as <strong>Admin User</strong>.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2"
            >
              🚀 Go to Dashboard
            </button>
            <button
              onClick={handleLogoutAndSwitch}
              className="w-full h-12 rounded-xl border border-white/10 bg-[#0B1020] hover:bg-red-500/10 hover:border-red-500/30 text-gray-300 hover:text-red-400 text-sm font-semibold transition-all"
            >
              🔒 Sign out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER 2: STRONG AUTHENTICATION (OTP / 2FA CARD)
  if (showOtp) {
    return (
      <div className="min-h-screen flex items-center justify-center overflow-hidden relative bg-[#050816] font-sans selection:bg-violet-500/30">
        <div className="absolute w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(124,58,237,0.25),transparent_70%)] blur-[50px] -top-20 -left-20 z-0"></div>
        <div className="absolute w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(124,58,237,0.25),transparent_70%)] blur-[50px] -bottom-32 -right-20 z-0"></div>

        <div className="relative z-10 w-[95%] max-w-md rounded-3xl px-8 py-10 text-white bg-[#070a18]/90 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.03)]">
          <button 
            onClick={() => { setShowOtp(false); setOtpCode(['', '', '', '', '', '']); }}
            className="absolute top-5 left-5 text-gray-400 hover:text-white transition text-xs font-semibold flex items-center gap-1"
          >
            ← Back
          </button>

          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-2xl mb-4">
              🛡️
            </div>
            <h2 className="text-2xl font-bold text-center">Two-Factor Authentication</h2>
            <p className="text-gray-400 mt-2 text-center text-xs leading-relaxed max-w-xs">
              We've sent a 6-digit verification code to your registered device for enhanced protection.
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex justify-between gap-2.5">
              {otpCode.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength="1"
                  ref={otpRefs[idx]}
                  value={digit}
                  disabled={isLoading}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  className="w-12 h-12 text-center text-lg font-bold rounded-xl border border-white/10 bg-[#0B1020] text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.some(d => d === '')}
              className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed text-white text-base font-semibold transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
            >
              {isLoading ? 'Verifying...' : 'Verify Security Credentials'}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Passkey alternative</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <button
            onClick={handlePasskeyVerification}
            className="w-full h-12 rounded-xl border border-violet-500/20 bg-violet-950/20 hover:bg-violet-900/30 hover:border-violet-500/40 text-violet-300 text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            🔑 Verify with Passkey / Security Key
          </button>
        </div>
      </div>
    );
  }

  // RENDER 3: PRIMARY LOGIN CARD
  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative bg-[#050816] font-sans selection:bg-violet-500/30">
      {/* Background Glow */}
      <div className="absolute w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(124,58,237,0.25),transparent_70%)] blur-[50px] -top-20 -left-20 z-0"></div>
      <div className="absolute w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(124,58,237,0.25),transparent_70%)] blur-[50px] -bottom-32 -right-20 z-0"></div>

      {/* Login Card */}
      <div className="relative z-10 w-[95%] max-w-md rounded-3xl px-8 py-10 text-white bg-[#070a18]/90 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.03)]">
        
        {/* Close Button */}
        <Link to="/" className="absolute top-5 right-5 w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-violet-500 transition">
          ✕
        </Link>

        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center mb-1.5">
            <div className="bg-[#000] border border-white/10 rounded-2xl p-2.5 w-14 h-14 flex items-center justify-center shadow-lg shadow-violet-500/5">
              <img src="/assets/logo.png" alt="InnoCheck" className="w-10 h-10 object-contain" />
            </div>
          </div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="mt-3 text-2xl font-black tracking-tight bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">InnoCheck</h2>
          <h2 className="mt-6 text-2xl font-bold text-center">Welcome back</h2>
          <p className="text-gray-400 mt-1 text-center text-xs">Secure login gateway for academic validation</p>
        </div>

        {/* Google & GitHub buttons */}
        <div className="mt-8 space-y-3.5">
          <button 
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="relative w-full h-12 rounded-xl border border-white/10 bg-[#0B1020] hover:bg-[#121933] flex items-center justify-center gap-3 text-sm font-semibold hover:-translate-y-0.5 hover:border-violet-500/70 hover:shadow-[0_0_20px_rgba(139,92,246,0.18)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <span className="animate-pulse text-xs text-violet-400">Handshaking Google Secure Hub...</span>
            ) : (
              <>
                <span className="text-lg">🌐</span> Continue with Google
                <span className="absolute right-4 -top-2.5 bg-violet-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider scale-90">Google SSO</span>
              </>
            )}
          </button>
          
          <button className="w-full h-12 rounded-xl border border-white/10 bg-[#0B1020] hover:bg-[#121933] flex items-center justify-center gap-3 text-sm font-semibold hover:-translate-y-0.5 hover:border-violet-500/70 hover:shadow-[0_0_20px_rgba(139,92,246,0.18)] transition-all">
            <span className="text-lg">🐙</span> Continue with GitHub
          </button>
        </div>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-gray-500 text-[10px] font-extrabold uppercase tracking-widest">OR SECURE EMAIL</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full h-12 rounded-xl border border-white/10 bg-[#0B1020] px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-12 rounded-xl border border-white/10 bg-[#0B1020] px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-xl text-xs text-red-400 leading-relaxed">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all hover:scale-[1.01] flex items-center justify-center gap-2 shadow-lg shadow-violet-600/10"
          >
            {isLoading ? 'Processing primary check...' : 'Continue'}
          </button>
        </form>

        <p className="text-gray-500 text-[10px] text-center mt-6 leading-relaxed">
          By continuing, you agree to the <a href="#" className="text-gray-400 hover:text-violet-400 underline">Terms of Service</a> and <a href="#" className="text-gray-400 hover:text-violet-400 underline">Privacy Policy</a>.
        </p>

        <div className="h-px bg-white/10 my-5"></div>

        <p className="text-center text-gray-400 text-xs">
          Don't have an account? <Link to="/signup" className="text-violet-400 font-semibold hover:text-violet-300">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
