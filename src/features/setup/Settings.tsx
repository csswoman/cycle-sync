import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';

const Settings: React.FC = () => {
    const { t } = useLanguage();
    const [fullName, setFullName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const getUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setFullName(user.user_metadata.full_name || '');
            }
        };
        getUserData();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });
            if (error) throw error;
            setMessage({ type: 'success', text: t.saveChanges });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: t.passwordsDoNotMatch });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto h-full bg-background p-6 md:p-10">
            <div className="max-w-[800px] mx-auto flex flex-col gap-8">
                <h1 className="text-foreground text-4xl font-black tracking-tight">{t.settingsTitle}</h1>

                {message && (
                    <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                        {message.text}
                    </div>
                )}

                {/* Profile Section */}
                <section className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined">person</span>
                        {t.profileSection}
                    </h2>
                    
                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold text-foreground/80">{t.fullNameLabel}</label>
                            <input
                                className="w-full bg-secondary border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                                {t.changePhotoLabel}
                                <span className="bg-secondary text-[10px] px-2 py-0.5 rounded-full text-muted-foreground uppercase font-black tracking-widest">
                                    {t.optionalStatement}
                                </span>
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-dashed border-primary/20">
                                    <span className="material-symbols-outlined">add_a_photo</span>
                                </div>
                                <p className="text-xs text-muted-foreground max-w-[200px]">
                                    Subir una foto personalizada para tu perfil (próximamente).
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-fit px-8 h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {loading ? '...' : t.saveChanges}
                        </button>
                    </form>
                </section>

                {/* Security Section */}
                <section className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined">shield</span>
                        {t.securitySection}
                    </h2>

                    <form onSubmit={handleUpdatePassword} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold text-foreground/80">{t.newPasswordLabel}</label>
                                <input
                                    type="password"
                                    className="w-full bg-secondary border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold text-foreground/80">{t.confirmNewPasswordLabel}</label>
                                <input
                                    type="password"
                                    className="w-full bg-secondary border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-fit px-8 h-12 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-all disabled:opacity-50"
                        >
                            {loading ? '...' : t.updatePasswordButton}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
};

export default Settings;
