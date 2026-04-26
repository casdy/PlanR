/**
 * @file src/pages/SignUp.tsx
 * @description New user registration page.
 *
 * Validates the form fields, creates a new account via `sqliteAuthService`,
 * and shows a "Setting up your profile..." SplashScreen for 2.5s before
 * navigating to the Dashboard.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SplashScreen } from '../components/SplashScreen';
import { useLanguage } from '../hooks/useLanguage';

export const SignUp = () => {
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessSplash, setShowSuccessSplash] = useState(false);
    
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            await signUp(email, password, name);
            setShowSuccessSplash(true);
            setTimeout(() => navigate('/'), 2500);
        } catch (err: any) {
            setError(err.message || 'Failed to create account.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
            <SplashScreen show={showSuccessSplash} message={t('setting_up_profile')} />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accent glow-primary mb-6"
                    >
                        <UserPlus className="w-10 h-10 text-primary-foreground" />
                    </motion.div>
                    <h2 className="text-4xl font-black tracking-tight mb-2">{t('join_planr')}</h2>
                    <p className="text-muted-foreground font-medium">{t('start_journey')}</p>
                </div>

                <form onSubmit={handleSubmit} className="glass p-8 rounded-[2.5rem] border-white/20 dark:border-white/5 space-y-5">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold p-4 rounded-2xl text-center">
                            {error}
                        </div>
                    )}

                    <Input
                        id="name"
                        name="name"
                        label={t('full_name')}
                        placeholder="John Doe"
                        type="text"
                        icon={User}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        required
                    />

                    <Input
                        id="email"
                        name="email"
                        label={t('email_address')}
                        placeholder="your@email.com"
                        type="email"
                        icon={Mail}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />

                    <Input
                        id="password"
                        name="password"
                        label={t('password')}
                        placeholder="••••••••"
                        type="password"
                        icon={Lock}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                    />

                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        label={t('confirm_password')}
                        placeholder="••••••••"
                        type="password"
                        icon={Lock}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 rounded-2xl text-lg font-bold group bg-accent hover:bg-accent/90 border-none"
                        >
                            {isLoading ? t('creating_account') : (
                                <>
                                    {t('get_started')}
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </div>

                </form>

                <div className="mt-8 text-center">
                    <p className="text-muted-foreground font-medium">
                        {t('already_have_account')} {' '}
                        <Link to="/login" className="text-primary hover:underline font-bold decoration-2 underline-offset-4">
                            {t('log_in_instead')}
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default SignUp;
