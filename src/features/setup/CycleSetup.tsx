import React, { useState } from 'react';
import { View } from '@/types';

interface CycleSetupProps {
    onNavigate: (view: View) => void;
}

const CycleSetup: React.FC<CycleSetupProps> = ({ onNavigate }) => {
    const [step, setStep] = useState(2); // Steps: 2 (Cycle), 3 (Preferences), 4 (Profile)

    // Form State
    const [cycleLength, setCycleLength] = useState(28);
    const [selectedTraining, setSelectedTraining] = useState<string[]>([]);
    const [selectedFood, setSelectedFood] = useState<string[]>([]);
    const [userName, setUserName] = useState("Elena R.");
    const [profilePic, setProfilePic] = useState("https://lh3.googleusercontent.com/aida-public/AB6AXuDsvySV6JHheB_2QTPrBxRW-WlPhII5ihPXtZ2SqR5vH__HjdCIoXlg4RBVuiMjUJha1iy3-K9NkNDQ1CxG4KKvsX_FZREjkfrapXJnVo0SBCzf4It_WPpVEv-VVa2yUaJW8wdnBPZZ7jOLxqycpnqA1FnmDOtVQL5m425jGmxqs5fXaeIJsf3h0JJRa5X2PZ05aJc5wKTudNG6YUveRY7twSunxCalqn3X2-wpQvlaVz2DeQ5SqfMo8x-MrPI_JLz7jro6j8aJaCQ");

    const handleNext = () => {
        if (step < 4) {
            setStep(step + 1);
        } else {
            onNavigate(View.DASHBOARD);
        }
    };

    const handleBack = () => {
        if (step > 2) {
            setStep(step - 1);
        } else {
            onNavigate(View.ARCHETYPE_SELECTION);
        }
    };

    const toggleSelection = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Calculate progress width based on step (Step 2 = 50%, Step 3 = 75%, Step 4 = 100%)
    const progressPercentage = step === 2 ? 50 : step === 3 ? 75 : 100;

    return (
        <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide bg-background-dark">
            <div className="flex justify-center py-10 px-4 md:px-10 lg:px-20">
                <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-10">
                    {/* Left Column: Setup Wizard */}
                    <div className="flex-1 flex flex-col gap-8">
                        {/* Progress Bar */}
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-6 justify-between items-end">
                                <p className="text-base font-medium leading-normal text-white">Step {step} of 4: {step === 2 ? 'Cycle Details' : step === 3 ? 'Preferences' : 'Profile'}</p>
                                <span className="text-primary text-sm font-bold">{progressPercentage}% Complete</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-surface-dark overflow-hidden">
                                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                        </div>

                        {/* STEP 2: CYCLE DETAILS */}
                        {step === 2 && (
                            <>
                                {/* Page Heading */}
                                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-white">Let's sync with your physiology</h1>
                                    <p className="text-text-secondary text-base font-normal leading-normal">Enter your cycle details to customize your training plan effectively.</p>
                                </div>

                                {/* Question 1: Date Picker */}
                                <div className="bg-card-dark rounded-xl p-6 border border-surface-dark shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                                    <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] mb-4 text-white">When was the first day of your last period?</h3>
                                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                                        <div className="flex-1 w-full max-w-[350px]">
                                            <div className="flex items-center justify-between mb-4 text-white">
                                                <button className="p-2 hover:bg-surface-dark rounded-full transition-colors">
                                                    <span className="material-symbols-outlined">chevron_left</span>
                                                </button>
                                                <p className="text-base font-bold text-center">September 2023</p>
                                                <button className="p-2 hover:bg-surface-dark rounded-full transition-colors">
                                                    <span className="material-symbols-outlined">chevron_right</span>
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-7 gap-y-1 text-white">
                                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                                    <div key={i} className="text-center text-xs font-bold text-gray-500 py-2">{day}</div>
                                                ))}
                                                <div></div><div></div><div></div>
                                                {[1, 2, 3, 4].map(d => (
                                                    <button key={d} className="h-10 w-10 mx-auto flex items-center justify-center rounded-full text-sm hover:bg-surface-dark">{d}</button>
                                                ))}
                                                <button className="h-10 w-10 mx-auto flex items-center justify-center rounded-full text-sm bg-primary text-white shadow-lg shadow-primary/40 font-bold">5</button>
                                                {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(d => (
                                                    <button key={d} className="h-10 w-10 mx-auto flex items-center justify-center rounded-full text-sm hover:bg-surface-dark">{d}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Question 2 & 3: Cycle Length & PCOS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                                    <div className="bg-card-dark rounded-xl p-6 border border-surface-dark shadow-sm flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] text-white">Average Cycle Length</h3>
                                            <p className="text-text-secondary text-sm mt-1">Days between periods</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-6 bg-background-dark rounded-lg p-2 border border-surface-dark">
                                            <button
                                                onClick={() => setCycleLength(Math.max(20, cycleLength - 1))}
                                                className="size-10 flex items-center justify-center rounded-md hover:bg-surface-dark text-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined">remove</span>
                                            </button>
                                            <span className="text-2xl font-bold text-white">{cycleLength}</span>
                                            <button
                                                onClick={() => setCycleLength(cycleLength + 1)}
                                                className="size-10 flex items-center justify-center rounded-md hover:bg-surface-dark text-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined">add</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-card-dark rounded-xl p-6 border border-surface-dark shadow-sm flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] text-white">Cycle Regularity</h3>
                                            <p className="text-text-secondary text-sm mt-1">Do you have irregular cycles or PCOS?</p>
                                        </div>
                                        <div className="mt-6 flex flex-col gap-3">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative flex items-center">
                                                    <input className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-surface-dark bg-background-dark checked:bg-primary checked:border-primary transition-all" type="checkbox" />
                                                    <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                            <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                                                        </svg>
                                                    </span>
                                                </div>
                                                <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">Yes, my cycle is irregular</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative flex items-center">
                                                    <input className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-surface-dark bg-background-dark checked:bg-primary checked:border-primary transition-all" type="checkbox" />
                                                    <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                            <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                                                        </svg>
                                                    </span>
                                                </div>
                                                <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">I'm not sure / I don't track</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* STEP 3: PREFERENCES */}
                        {step === 3 && (
                            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex flex-col gap-2">
                                    <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-white">Customize your experience</h1>
                                    <p className="text-text-secondary text-base font-normal leading-normal">Tell us about your preferences so we can tailor recommendations.</p>
                                </div>

                                {/* Training Preferences */}
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-4">Preferred Training Styles</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { id: 'yoga', name: 'Yoga & Pilates', img: 'https://images.unsplash.com/photo-1544367563-12123d8959bd?auto=format&fit=crop&q=80&w=400' },
                                            { id: 'strength', name: 'Strength', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=400' },
                                            { id: 'hiit', name: 'HIIT', img: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?auto=format&fit=crop&q=80&w=400' },
                                            { id: 'run', name: 'Running', img: 'https://images.unsplash.com/photo-1502904550040-7534597429ae?auto=format&fit=crop&q=80&w=400' }
                                        ].map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => toggleSelection(item.id, selectedTraining, setSelectedTraining)}
                                                className={`relative rounded-xl overflow-hidden aspect-square cursor-pointer group border-2 transition-all ${selectedTraining.includes(item.id) ? 'border-primary' : 'border-transparent'}`}
                                            >
                                                <img src={item.img} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                <div className={`absolute inset-0 bg-black/40 flex items-end p-3 transition-colors ${selectedTraining.includes(item.id) ? 'bg-primary/20' : ''}`}>
                                                    <span className="text-white font-bold text-sm">{item.name}</span>
                                                </div>
                                                {selectedTraining.includes(item.id) && (
                                                    <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                                                        <span className="material-symbols-outlined text-sm">check</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Food Preferences */}
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-4">Dietary Focus</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { id: 'balanced', name: 'Balanced', img: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=400' },
                                            { id: 'veg', name: 'Vegetarian', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400' },
                                            { id: 'keto', name: 'Keto / Low Carb', img: 'https://images.unsplash.com/photo-1547496502-ffa76f30d088?auto=format&fit=crop&q=80&w=400' },
                                            { id: 'paleo', name: 'Paleo', img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400' }
                                        ].map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => toggleSelection(item.id, selectedFood, setSelectedFood)}
                                                className={`relative rounded-xl overflow-hidden aspect-square cursor-pointer group border-2 transition-all ${selectedFood.includes(item.id) ? 'border-primary' : 'border-transparent'}`}
                                            >
                                                <img src={item.img} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                <div className={`absolute inset-0 bg-black/40 flex items-end p-3 transition-colors ${selectedFood.includes(item.id) ? 'bg-primary/20' : ''}`}>
                                                    <span className="text-white font-bold text-sm">{item.name}</span>
                                                </div>
                                                {selectedFood.includes(item.id) && (
                                                    <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                                                        <span className="material-symbols-outlined text-sm">check</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: PROFILE */}
                        {step === 4 && (
                            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex flex-col gap-2">
                                    <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-white">Finalize your profile</h1>
                                    <p className="text-text-secondary text-base font-normal leading-normal">Let's make this space yours.</p>
                                </div>

                                <div className="bg-card-dark rounded-xl p-8 border border-surface-dark shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start">
                                    {/* Profile Picture Upload */}
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="relative group">
                                            <div
                                                className="size-32 rounded-full bg-cover bg-center border-4 border-surface-dark shadow-xl"
                                                style={{ backgroundImage: `url("${profilePic}")` }}
                                            ></div>
                                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                            </label>
                                        </div>
                                        <p className="text-sm text-text-secondary">Tap to change photo</p>
                                    </div>

                                    {/* Name Input */}
                                    <div className="flex-1 w-full flex flex-col gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-white font-bold text-sm uppercase tracking-wider">Display Name</label>
                                            <input
                                                type="text"
                                                value={userName}
                                                onChange={(e) => setUserName(e.target.value)}
                                                className="w-full bg-background-dark border border-surface-dark rounded-xl px-4 py-3 text-white text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-white font-bold text-sm uppercase tracking-wider">Goal Statement (Optional)</label>
                                            <textarea
                                                className="w-full bg-background-dark border border-surface-dark rounded-xl px-4 py-3 text-white text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all h-24 resize-none"
                                                placeholder="e.g. I want to feel more energetic during my luteal phase..."
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between pt-4 mt-auto">
                            <button
                                onClick={handleBack}
                                className="px-6 py-3 rounded-lg text-sm font-bold text-text-secondary hover:bg-surface-dark transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleNext}
                                className="px-8 py-3 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary-hover transition-colors flex items-center gap-2"
                            >
                                <span>{step === 4 ? 'Complete Setup' : 'Next Step'}</span>
                                {step < 4 ? <span className="material-symbols-outlined text-sm">arrow_forward</span> : <span className="material-symbols-outlined text-sm">check</span>}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Educational Context */}
                    <div className="w-full lg:w-[360px] flex flex-col gap-6">
                        {/* Info Card - Content changes based on step */}
                        <div className="bg-card-dark rounded-xl p-6 border border-primary/20 flex flex-col gap-4 relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all"></div>
                            <div className="flex items-center gap-3 text-primary mb-2">
                                <span className="material-symbols-outlined">
                                    {step === 2 ? 'fitness_center' : step === 3 ? 'restaurant' : 'person'}
                                </span>
                                <h4 className="font-bold text-sm tracking-wide uppercase">Why we ask</h4>
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-3 text-white">
                                    {step === 2 ? 'Syncing training with your cycle' :
                                        step === 3 ? 'Tailoring your plan' :
                                            'Personalizing your space'}
                                </h3>
                                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                                    {step === 2 && 'Your hormonal profile shifts throughout the month. Knowing your cycle phase helps us recommend phase-specific training.'}
                                    {step === 3 && 'We align your favorite activities with your energy levels. We recommend yoga during menstruation and HIIT during ovulation.'}
                                    {step === 4 && 'This helps us address you correctly and makes the dashboard feel like your personal health hub.'}
                                </p>
                                {step === 2 && (
                                    <ul className="space-y-3">
                                        <li className="flex gap-3 items-start">
                                            <div className="mt-1 size-1.5 rounded-full bg-primary shrink-0"></div>
                                            <span className="text-sm text-gray-300"><strong>Follicular Phase:</strong> High intensity & strength.</span>
                                        </li>
                                        <li className="flex gap-3 items-start">
                                            <div className="mt-1 size-1.5 rounded-full bg-primary shrink-0"></div>
                                            <span className="text-sm text-gray-300"><strong>Luteal Phase:</strong> Recovery & steady state cardio.</span>
                                        </li>
                                    </ul>
                                )}
                            </div>
                            {step === 2 && <div className="mt-4 h-32 rounded-lg bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuABHxzOqeeHp7_mZjabuo_gSUbETeuK_tRZ8K14baatJJwfInnd_1XmeR21PZ4WdXD60rCt7QEnPREKBMcB1Ddjxd-R7oNLSuDuUUOC779atbboBoTcF99lDyy6-SrKm_HRUVmbiOb49kqpiklkpAUaWnOi_TfKuCCJ_sGVsaiy24mBJBaH8iVrcI0OD5A0JkVYrLOmN9L5wElpQfBYt_oab77YgMOhgrNCqTMYgKx7UuNG8X15xkOwR-VcALi5KNV6cUppxGsfVEo")' }}></div>}
                        </div>

                        {/* Privacy Badge */}
                        <div className="bg-card-dark rounded-xl p-5 border border-surface-dark flex items-center gap-4">
                            <div className="size-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                                <span className="material-symbols-outlined">lock</span>
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-white">Privacy First</h5>
                                <p className="text-xs text-text-secondary mt-0.5">Your health data is encrypted locally and never shared with third parties.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CycleSetup;