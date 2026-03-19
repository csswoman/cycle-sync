import React, { useState } from 'react';
import { View } from '@/types';
import { StepCycleDetails } from './components/StepCycleDetails';
import { StepPreferences } from './components/StepPreferences';
import { StepProfileFinalize } from './components/StepProfileFinalize';
import { supabase } from '@/lib/supabase';

interface CycleSetupProps {
    onNavigate: (view: View) => void;
}

const CycleSetup: React.FC<CycleSetupProps> = ({ onNavigate }) => {
    const [step, setStep] = useState(2);
    const [cycleLength, setCycleLength] = useState(28);
    const [selectedTraining, setSelectedTraining] = useState<string[]>([]);
    const [selectedFood, setSelectedFood] = useState<string[]>([]);
    const [userName, setUserName] = useState("Elena R.");
    const [profilePic, setProfilePic] = useState("https://lh3.googleusercontent.com/aida-public/AB6AXuDsvySV6JHheB_2QTPrBxRW-WlPhII5ihPXtZ2SqR5vH__HjdCIoXlg4RBVuiMjUJha1iy3-K9NkNDQ1CxG4KKvsX_FZREjkfrapXJnVo0SBCzf4It_WPpVEv-VVa2yUaJW8wdnBPZZ7jOLxqycpnqA1FnmDOtVQL5m425jGmxqs5fXaeIJsf3h0JJRa5X2PZ05aJc5wKTudNG6YUveRY7twSunxCalqn3X2-wpQvlaVz2DeQ5SqfMo8x-MrPI_JLz7jro6j8aJaCQ");

    const [saving, setSaving] = useState(false);

    const handleNext = async () => {
        if (step < 4) { setStep(step + 1); return; }

        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('cycle_config').upsert({
                user_id: user.id,
                cycle_length: cycleLength,
                workout_prefs: selectedTraining,
                dietary_prefs: selectedFood,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

            if (userName && userName !== 'Elena R.') {
                await supabase.auth.updateUser({ data: { full_name: userName } });
            }

            onNavigate(View.DASHBOARD);
        } catch (err) {
            console.error('Error saving setup:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        if (step > 2) setStep(step - 1);
        else onNavigate(View.ARCHETYPE_SELECTION);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

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

            await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            setProfilePic(publicUrl);
        } catch (err) {
            console.error('Error uploading image:', err);
            // Fallback to local preview if upload fails
            const reader = new FileReader();
            reader.onloadend = () => setProfilePic(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const toggleSelection = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
        setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    const progressPercentage = step === 2 ? 50 : step === 3 ? 75 : 100;

    return (
        <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide bg-background">

            <div className="flex justify-center py-10 px-4 md:px-10 lg:px-20">
                <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 flex flex-col gap-8">
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-6 justify-between items-end">
                                <p className="text-base font-medium text-foreground">Step {step} of 4: {step === 2 ? 'Cycle Details' : step === 3 ? 'Preferences' : 'Profile'}</p>
                                <span className="text-primary text-sm font-bold">{progressPercentage}% Complete</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                        </div>


                        {step === 2 && <StepCycleDetails cycleLength={cycleLength} setCycleLength={setCycleLength} />}
                        {step === 3 && (
                            <StepPreferences
                                selectedTraining={selectedTraining}
                                selectedFood={selectedFood}
                                onToggleTraining={(id) => toggleSelection(id, selectedTraining, setSelectedTraining)}
                                onToggleFood={(id) => toggleSelection(id, selectedFood, setSelectedFood)}
                            />
                        )}
                        {step === 4 && (
                            <StepProfileFinalize
                                userName={userName}
                                setUserName={setUserName}
                                profilePic={profilePic}
                                onImageUpload={handleImageUpload}
                            />
                        )}

                        <div className="flex items-center justify-between pt-4 mt-auto">
                            <button onClick={handleBack} className="px-6 py-3 rounded-lg text-sm font-bold text-muted-foreground hover:bg-secondary transition-colors">
                                Back
                            </button>
                            <button onClick={handleNext} disabled={saving} className="px-8 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50">
                                <span>{saving ? 'Saving...' : step === 4 ? 'Complete Setup' : 'Next Step'}</span>
                                {!saving && (step < 4 ? <span className="material-symbols-outlined text-sm">arrow_forward</span> : <span className="material-symbols-outlined text-sm">check</span>)}
                            </button>
                        </div>

                    </div>

                    <div className="w-full lg:w-[360px] flex flex-col gap-6">
                        <div className="bg-card rounded-xl p-6 border border-primary/20 flex flex-col gap-4 relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all"></div>
                            <div className="flex items-center gap-3 text-primary mb-2">
                                <span className="material-symbols-outlined">
                                    {step === 2 ? 'fitness_center' : step === 3 ? 'restaurant' : 'person'}
                                </span>
                                <h4 className="font-bold text-sm tracking-wide uppercase">Why we ask</h4>
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-3 text-foreground">
                                    {step === 2 ? 'Syncing training with your cycle' :
                                        step === 3 ? 'Tailoring your plan' :
                                            'Personalizing your space'}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                    {step === 2 && 'Your hormonal profile shifts throughout the month. Knowing your cycle phase helps us recommend phase-specific training.'}
                                    {step === 3 && 'We align your favorite activities with your energy levels. We recommend yoga during menstruation and HIIT during ovulation.'}
                                    {step === 4 && 'This helps us address you correctly and makes the dashboard feel like your personal health hub.'}
                                </p>
                            </div>
                            {step === 2 && <div className="mt-4 h-32 rounded-lg bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuABHxzOqeeHp7_mZjabuo_gSUbETeuK_tRZ8K14baatJJwfInnd_1XmeR21PZ4WdXD60rCt7QEnPREKBMcB1Ddjxd-R7oNLSuDuUUOC779atbboBoTcF99lDyy6-SrKm_HRUVmbiOb49kqpiklkpAUaWnOi_TfKuCCJ_sGVsaiy24mBJBaH8iVrcI0OD5A0JkVYrLOmN9L5wElpQfBYt_oab77YgMOhgrNCqTMYgKx7UuNG8X15xkOwR-VcALi5KNV6cUppxGsfVEo")' }}></div>}
                        </div>


                        <div className="bg-card rounded-xl p-5 border border-border flex items-center gap-4">
                            <div className="size-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                                <span className="material-symbols-outlined">lock</span>
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-foreground">Privacy First</h5>
                                <p className="text-xs text-muted-foreground mt-0.5">Your health data is encrypted locally and never shared with third parties.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CycleSetup;
