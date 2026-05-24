import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Loader2 } from 'lucide-react';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== passwordConfirmation) {
            setError('Passwords do not match');
            return;
        }
        setIsLoading(true);
        try {
            await signup(name, email, password, passwordConfirmation);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#020617] p-4 font-mono">
            <div className="w-full max-w-md rounded-none border-2 border-white/10 bg-slate-950 p-8 shadow-brutal">
                <div className="mb-8 text-center">
                    <div className="panel-title mb-2 text-[11px] text-emerald-300">Registration</div>
                    <h1 className="text-3xl font-semibold text-slate-50">Create Identity</h1>
                </div>

                {error && (
                    <div className="mb-6 border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Full Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-none border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-emerald-300/50"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-none border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-emerald-300/50"
                            placeholder="admin@opennexus.io"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-none border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-emerald-300/50"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Confirm Password</label>
                        <input
                            type="password"
                            required
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            className="w-full rounded-none border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-emerald-300/50"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-none border-2 border-emerald-300 bg-emerald-300 py-3 font-semibold text-slate-950 transition hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            <>
                                <UserPlus className="h-5 w-5" />
                                <span>Initialize Identity</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-emerald-300 hover:underline">
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
