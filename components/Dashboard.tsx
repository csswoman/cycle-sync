import React from 'react';
import { View } from '../types';

interface DashboardProps {
    onNavigate: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
        <div className="max-w-[1100px] mx-auto p-6 md:p-10 flex flex-col gap-8 pb-20">
            {/* Page Heading */}
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">Daily Personalized Plan</h1>
                    <div className="flex flex-wrap items-center gap-2 text-[#ad93c8] text-sm md:text-base">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium border border-primary/20">Phase: Luteal</span>
                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                        <span>Day 22</span>
                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">target</span>
                            Focus: Stabilize Blood Sugar
                        </span>
                    </div>
                </div>
            </header>

            {/* Stats / Context Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1 rounded-xl p-5 border border-border-dark bg-card-dark hover:border-primary/50 transition-colors cursor-default group">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[#ad93c8] text-sm font-medium uppercase tracking-wider">Current Phase</p>
                        <span className="material-symbols-outlined text-primary opacity-50 group-hover:opacity-100 transition-opacity">water_drop</span>
                    </div>
                    <p className="text-white text-2xl font-bold">Luteal</p>
                    <p className="text-xs text-gray-400 mt-1">High Progesterone</p>
                </div>
                <div className="flex flex-col gap-1 rounded-xl p-5 border border-border-dark bg-card-dark hover:border-primary/50 transition-colors cursor-default group">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[#ad93c8] text-sm font-medium uppercase tracking-wider">Cycle Day</p>
                        <span className="material-symbols-outlined text-primary opacity-50 group-hover:opacity-100 transition-opacity">calendar_today</span>
                    </div>
                    <p className="text-white text-2xl font-bold">Day 22</p>
                    <p className="text-xs text-gray-400 mt-1">~6 Days to Menstruation</p>
                </div>
                <div className="flex flex-col gap-1 rounded-xl p-5 border border-border-dark bg-card-dark hover:border-primary/50 transition-colors cursor-default group">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[#ad93c8] text-sm font-medium uppercase tracking-wider">Archetype</p>
                        <span className="material-symbols-outlined text-primary opacity-50 group-hover:opacity-100 transition-opacity">psychology</span>
                    </div>
                    <p className="text-white text-2xl font-bold">Powerhouse</p>
                    <p className="text-xs text-gray-400 mt-1">Focus on Consistency</p>
                </div>
            </div>

            {/* Action Panel: Daily Check-in */}
            <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-card-dark to-[#2a1d36] p-1">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-5 md:p-6 rounded-[10px] bg-card-dark/50 backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-primary/10 text-primary hidden sm:block">
                            <span className="material-symbols-outlined">edit_note</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-white text-lg font-bold">Daily Check-In</p>
                            <p className="text-[#ad93c8] text-sm leading-normal max-w-lg">How are your symptoms today? Logging your mood and energy helps us refine your plan for tomorrow.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => onNavigate(View.LOG)}
                        className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-6 py-2.5 text-white text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        <span>Log Symptoms</span>
                    </button>
                </div>
            </div>

            {/* Section: Movement */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-2">
                    <span className="material-symbols-outlined text-primary">self_improvement</span>
                    <h2 className="text-white text-xl font-bold">Movement</h2>
                </div>
                {/* Hero Workout Card */}
                <div className="group relative overflow-hidden rounded-2xl border border-border-dark bg-card-dark">
                    <div className="flex flex-col lg:flex-row">
                        {/* Image Side */}
                        <div className="relative w-full lg:w-2/5 h-64 lg:h-auto overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-card-dark via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-card-dark z-10 opacity-80"></div>
                            <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBhkMw5OiVrHssOpEse9L-QT9Bu5m6KhbS2Q0iFroBtbgs2Zepod0qFxAdS5MddjGO7t1G3zcamGliodgud5en1EXzSbzTGrx0VEsWcfgtDNcFuGfSulLPE12pg1gQ7GbQI_t2SryscKT0eHdQl9eOF5G1MGffb3Bve2y4lnRiWz9X5-XJWSdeAx2NxkbI31hZcYCTR1GH-k2IKABS89VufoS5sh36iV8rlyQMD7aIJGCVTUmJh9MTXDY5t6W-z5Ax095saet7A1A0")'}}>
                            </div>
                            <div className="absolute top-4 left-4 z-20 flex gap-2">
                                <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/10">30 Min</span>
                                <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/10">Low Impact</span>
                            </div>
                        </div>
                        {/* Content Side */}
                        <div className="flex flex-1 flex-col justify-center p-6 lg:p-8 gap-6 relative z-20">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Low Impact Strength Flow</h3>
                                <p className="text-[#ad93c8] text-sm md:text-base leading-relaxed">
                                    A gentle but effective session combining slow strength movements with mobility. Designed to maintain muscle tone without adding stress.
                                </p>
                            </div>
                            {/* Why This Works Box */}
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 relative">
                                <div className="absolute -top-3 left-4 px-2 bg-card-dark text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">science</span>
                                    Why this works
                                </div>
                                <p className="text-sm text-gray-300 italic pt-1">
                                    "During the luteal phase, your body temperature is higher and your resting heart rate increases. We are focusing on strength maintenance to utilize fat for fuel without spiking cortisol levels, which can worsen PMS."
                                </p>
                            </div>
                            <div className="flex items-center gap-4 mt-auto pt-2">
                                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-white font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40">
                                    <span className="material-symbols-outlined">play_arrow</span>
                                    Start Session
                                </button>
                                <button className="p-3 rounded-lg border border-border-dark text-[#ad93c8] hover:text-white hover:bg-white/5 transition-colors" title="Swap Activity">
                                    <span className="material-symbols-outlined">swap_horiz</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section: Nourishment */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-2 mt-4">
                    <span className="material-symbols-outlined text-primary">nutrition</span>
                    <h2 className="text-white text-xl font-bold">Nourishment</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Meal Card */}
                    <div className="flex flex-col rounded-xl border border-border-dark bg-card-dark overflow-hidden hover:border-border-dark/80 transition-all group">
                        <div className="h-48 w-full bg-cover bg-center relative" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAhhjTsyhqnm1zdZP93JOa_6ABVtIhKhUX4bxOTlzByglwEU6Y8dPHHFCvyp-aALjoVTqpr2-ZBhuTWUrrnBBIlDbE4zUyPXZ-GiWj2s0kMSiABx2hmWu9FFUlnqKSDgVQG3Uu7tu84plSj0X9RJ2TpOBkm0zQ1U6oEbDDjHlGPs3l9wagoTBbUQJvqWz2dYD-PKrVGMSuvwr9EzxEkcXu3oyCGxvdRgfEwG6ePnYz0ov0PPi3z-t3UFSc3qe32brbPdHkYJEc-9x8")'}}>
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                            <div className="absolute bottom-4 left-4">
                                <h3 className="text-white text-xl font-bold shadow-black drop-shadow-md">Salmon &amp; Quinoa Bowl</h3>
                            </div>
                        </div>
                        <div className="p-5 flex flex-col gap-4 h-full">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary mt-0.5">verified</span>
                                <div className="flex flex-col gap-1">
                                    <span className="text-white font-medium text-sm">Hormone Balance Focus</span>
                                    <p className="text-[#ad93c8] text-sm leading-relaxed">
                                        Rich in Omega-3s and complex carbs.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-auto bg-[#1a1122] p-3 rounded-lg border border-white/5">
                                <p className="text-xs text-gray-400">
                                    <span className="text-primary font-semibold">Why:</span> Complex carbs aid serotonin production which can dip during the late luteal phase, helping to stabilize mood and reduce cravings.
                                </p>
                            </div>
                            <button className="text-sm font-medium text-white underline decoration-primary underline-offset-4 decoration-2 hover:text-primary transition-colors text-left mt-2">
                                View Recipe
                            </button>
                        </div>
                    </div>
                    {/* Ingredient Focus Card */}
                    <div className="flex flex-col rounded-xl border border-border-dark bg-card-dark overflow-hidden hover:border-border-dark/80 transition-all group">
                        <div className="h-48 w-full bg-cover bg-center relative" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuChtgD126zZdUHP4U8G_DKhYxP2FJ9R15QhYL14_Vufbq-f2Hhcd4QXU7R9cd_efVoRcrdwVtafwkYu0Mz6Au5vQ4FTGg9qheKWQcxBm-9IDMIQh5Kj9Oe6m_1ntoRvvnWBlzFYXbPggIg2MNeHqhGLvbsyfs1Nbw6e9V8r5YpvRGZbwqq3Pmqfh1AbkqrK45abZlzx8bGI1XJxpv1mX3QlmIOmsnp3aS9Y4gSXRKEHCs66vTw8Z_fVpjk6w6X74sftm20i8rhqjhs")'}}>
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                            <div className="absolute bottom-4 left-4">
                                <h3 className="text-white text-xl font-bold shadow-black drop-shadow-md">Magnesium Rich Snack</h3>
                            </div>
                        </div>
                        <div className="p-5 flex flex-col gap-4 h-full">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary mt-0.5">verified</span>
                                <div className="flex flex-col gap-1">
                                    <span className="text-white font-medium text-sm">Symptom Management</span>
                                    <p className="text-[#ad93c8] text-sm leading-relaxed">
                                        Dark chocolate (&gt;70%) and raw almonds.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-auto bg-[#1a1122] p-3 rounded-lg border border-white/5">
                                <p className="text-xs text-gray-400">
                                    <span className="text-primary font-semibold">Why:</span> Magnesium helps relax smooth muscle tissue in the uterus, potentially reducing the severity of upcoming cramps.
                                </p>
                            </div>
                            <button className="text-sm font-medium text-white underline decoration-primary underline-offset-4 decoration-2 hover:text-primary transition-colors text-left mt-2">
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="mt-8 pt-8 border-t border-border-dark flex flex-col items-center justify-center gap-4 text-center">
                <p className="text-xs text-[#ad93c8] max-w-md">
                    Disclaimer: This plan is generated based on your tracked data. Listen to your body first. Consult a healthcare professional for specific medical advice regarding PCOS.
                </p>
            </footer>
        </div>
    </div>
  );
};

export default Dashboard;