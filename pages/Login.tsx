import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoIcon } from '../components/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../src/hooks/useAuth';
import { handleError } from '../src/utils/errorHandler';

const quotes = [
  { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
  { text: "Anyone who stops learning is old, whether at twenty or eighty. Anyone who keeps learning stays young.", author: "Henry Ford" },
  { text: "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.", author: "Abigail Adams" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled. Learning is the ignition of that fire.", author: "Plutarch" },
];

const LoginForm: React.FC<{
  type: 'student' | 'faculty';
}> = ({ type }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const config = {
        student: {
            defaultEmail: 'student@lms.com',
        },
        faculty: {
            defaultEmail: 'faculty@lms.com',
        },
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            // Navigate based on role - will be handled by App.tsx routing
            navigate(type === 'faculty' ? '/faculty' : '/');
        } catch (err) {
            setError(handleError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.form
            key={type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            <div>
                <label className="text-sm font-medium text-slate-600">Email Address</label>
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={`e.g., ${config[type].defaultEmail}`}
                    className="w-full mt-1 px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/60 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-slate-800 placeholder:text-slate-500"
                    required
                />
            </div>
            <div>
                <label className="text-sm font-medium text-slate-600">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter 'password'"
                    className="w-full mt-1 px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/60 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-slate-800 placeholder:text-slate-500"
                    required
                />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Logging in...' : `Login as ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            </motion.button>
        </motion.form>
    )
}

const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'faculty'>('student');
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'faculty' ? '/faculty' : '/';
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex(prevIndex => (prevIndex + 1) % quotes.length);
    }, 7000); // Change quote every 7 seconds
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row" style={{ background: "radial-gradient(125% 125% at 50% 90%, #fff 40%, #6366f1 100%)" }}>
      {/* Left Panel */}
      <div className="w-full lg:w-1/2 relative flex flex-col justify-center items-center p-8 lg:p-12 h-96 lg:h-auto">
        <div className="absolute top-8 left-8 lg:left-12 z-10 flex items-center gap-3">
            <LogoIcon className="w-12 h-12 text-slate-800" />
            <h1 className="text-3xl font-bold text-slate-800">ThreadLms</h1>
        </div>
        {/* Content Container */}
        <div className="relative z-10 w-full max-w-lg text-center">
          {/* Animated Quotes */}
          <div className="h-48 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={currentQuoteIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="text-4xl font-bold text-black/80 font-fancy"
              >
                "{quotes[currentQuoteIndex].text}"
                <footer className="text-lg text-slate-700 mt-6 font-sans font-medium">- {quotes[currentQuoteIndex].author}</footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
            <h1 className="text-2xl sm:text-3xl font-bold text-heading mb-2 text-center">Sign in</h1>
            <p className="text-content mb-8 text-center">Welcome back! Please enter your details.</p>

            <div className="flex border-b border-slate-300/80 mb-8">
            <button
                onClick={() => setActiveTab('student')}
                className={`flex-1 pb-3 text-sm font-semibold transition-colors focus:outline-none ${activeTab === 'student' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
                I'm a Student
            </button>
            <button
                onClick={() => setActiveTab('faculty')}
                className={`flex-1 pb-3 text-sm font-semibold transition-colors focus:outline-none ${activeTab === 'faculty' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
                I'm Faculty
            </button>
            </div>

            <AnimatePresence mode="wait">
                <LoginForm key={activeTab} type={activeTab} />
            </AnimatePresence>
            
            <p className="text-center text-sm text-content mt-8">
            Don't have an account? <Link to="/register" className="font-semibold text-primary hover:underline">Sign up</Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;