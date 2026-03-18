import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';
import { SettingsSection, FormField } from './components/SettingsComponents';

const Settings: React.FC = () => {
    const { t } = useLanguage();
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        const getUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setFullName(user.user_metadata.full_name || '');
                setAvatarUrl(user.user_metadata.avatar_url || null);
            }
        };
        getUserData();
    }, []);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);
            setMessage({ type: 'success', text: 'Profile picture updated!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

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
                <SettingsSection title={t.profileSection} icon="person">
                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
                        <FormField label={t.fullNameLabel}>
                            <input
                                className="w-full bg-secondary border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </FormField>

                        <FormField label={t.changePhotoLabel} optional optionalLabel={t.optionalStatement}>
                            <div className="flex items-center gap-4">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <div
                                    onClick={handleAvatarClick}
                                    className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-dashed border-primary/20 hover:bg-primary/20 transition-all cursor-pointer overflow-hidden"
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined">add_a_photo</span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground max-w-[200px]">
                                    Click here or drag and drop to upload a new profile picture.
                                </p>
                            </div>
                        </FormField>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-fit px-8 h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {loading ? '...' : t.saveChanges}
                        </button>
                    </form>
                </SettingsSection>

                {/* Security Section */}
                <SettingsSection title={t.securitySection} icon="shield">
                    <form onSubmit={handleUpdatePassword} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label={t.newPasswordLabel}>
                                <input
                                    type="password"
                                    className="w-full bg-secondary border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </FormField>
                            <FormField label={t.confirmNewPasswordLabel}>
                                <input
                                    type="password"
                                    className="w-full bg-secondary border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </FormField>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-fit px-8 h-12 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-all disabled:opacity-50"
                        >
                            {loading ? '...' : t.updatePasswordButton}
                        </button>
                    </form>
                </SettingsSection>
            </div>
        </div>
    );
};

export default Settings;
