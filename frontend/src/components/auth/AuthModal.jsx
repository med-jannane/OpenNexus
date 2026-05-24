import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { X, LogIn, UserPlus, Loader2, ShieldCheck, Lock } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, initialMode = 'login', pendingData }) => {
    const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login, signup } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                if (password !== passwordConfirmation) {
                    throw new Error('Passwords do not match');
                }
                await signup(name, email, password, passwordConfirmation);
            }
            onClose(true); // Success
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Authentication failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md neo-brutal bg-white p-8 relative rotate-1">
                <button 
                    onClick={() => onClose(false)}
                    className="absolute -top-4 -right-4 h-10 w-10 neo-brutal bg-black text-white flex items-center justify-center hover:bg-white hover:text-black transition-all"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 neo-brutal bg-gray-50 flex items-center justify-center mb-4 rotate-[-3deg]">
                        {mode === 'login' ? <Lock className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
                    </div>
                    <h2 className="text-3xl font-display font-black uppercase tracking-tight">
                        {mode === 'login' ? 'Identify Yourself' : 'Create Identity'}
                    </h2>
                    <p className="text-sm font-bold text-gray-400 mt-2">
                        {pendingData ? 'Secure your session to start orchestration' : 'Access the Nexus console'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 border-2 border-black bg-gray-50 p-3 text-xs font-bold text-black uppercase flex items-center gap-2">
                        <div className="h-2 w-2 bg-black rounded-full animate-pulse" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <div className="space-y-1 text-left">
                            <label className="panel-title text-gray-500">Full Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full neo-input font-bold"
                                placeholder="J. DOE"
                            />
                        </div>
                    )}

                    <div className="space-y-1 text-left">
                        <label className="panel-title text-gray-500">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full neo-input font-bold"
                            placeholder="ADMIN@NEXUS.IO"
                        />
                    </div>

                    <div className="space-y-1 text-left">
                        <label className="panel-title text-gray-500">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full neo-input font-bold"
                            placeholder="••••••••"
                        />
                    </div>

                    {mode === 'signup' && (
                        <div className="space-y-1 text-left">
                            <label className="panel-title text-gray-500">Confirm Access Key</label>
                            <input
                                type="password"
                                required
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                className="w-full neo-input font-bold"
                                placeholder="••••••••"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-black text-white font-display font-black uppercase tracking-widest neo-brutal hover:bg-white hover:text-black mt-4 flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : mode === 'login' ? (
                            <LogIn className="h-5 w-5" />
                        ) : (
                            <UserPlus className="h-5 w-5" />
                        )}
                        <span>{mode === 'login' ? 'Establish Link' : 'Initialize Identity'}</span>
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t-2 border-black border-dashed">
                    <button 
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-black underline decoration-2 underline-offset-4"
                    >
                        {mode === 'login' ? 'Register new identity' : 'Return to identification'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
