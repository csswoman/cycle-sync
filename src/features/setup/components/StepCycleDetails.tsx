import React from 'react';

interface StepCycleDetailsProps {
    cycleLength: number;
    setCycleLength: (length: number) => void;
}

export const StepCycleDetails: React.FC<StepCycleDetailsProps> = ({ cycleLength, setCycleLength }) => {
    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">Let's sync with your physiology</h1>
                <p className="text-muted-foreground text-base font-normal leading-normal">Enter your cycle details to customize your training plan effectively.</p>
            </div>


            <div className="bg-card rounded-xl p-6 border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] mb-4 text-foreground">When was the first day of your last period?</h3>
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    <div className="flex-1 w-full max-w-[350px]">
                        <div className="flex items-center justify-between mb-4 text-foreground">
                            <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <p className="text-base font-bold text-center">September 2023</p>
                            <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-y-1 text-foreground">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <div key={i} className="text-center text-xs font-bold text-muted-foreground py-2">{day}</div>
                            ))}
                            <div></div><div></div><div></div>
                            {[1, 2, 3, 4].map(d => (
                                <button key={d} className="h-10 w-10 mx-auto flex items-center justify-center rounded-full text-sm hover:bg-secondary">{d}</button>
                            ))}
                            <button className="h-10 w-10 mx-auto flex items-center justify-center rounded-full text-sm bg-primary text-primary-foreground shadow-lg shadow-primary/40 font-bold">5</button>
                            {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(d => (
                                <button key={d} className="h-10 w-10 mx-auto flex items-center justify-center rounded-full text-sm hover:bg-secondary">{d}</button>
                            ))}
                        </div>

                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] text-foreground">Average Cycle Length</h3>
                        <p className="text-muted-foreground text-sm mt-1">Days between periods</p>
                    </div>
                    <div className="flex items-center justify-between mt-6 bg-secondary rounded-lg p-2 border border-border">
                        <button
                            onClick={() => setCycleLength(Math.max(20, cycleLength - 1))}
                            className="size-10 flex items-center justify-center rounded-md hover:bg-accent text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined">remove</span>
                        </button>
                        <span className="text-2xl font-bold text-foreground">{cycleLength}</span>
                        <button
                            onClick={() => setCycleLength(cycleLength + 1)}
                            className="size-10 flex items-center justify-center rounded-md hover:bg-accent text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined">add</span>
                        </button>
                    </div>
                </div>


                <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] text-foreground">Cycle Regularity</h3>
                        <p className="text-muted-foreground text-sm mt-1">Do you have irregular cycles or PCOS?</p>
                    </div>
                    <div className="mt-6 flex flex-col gap-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-border bg-secondary checked:bg-primary checked:border-primary transition-all" type="checkbox" />
                                <span className="absolute text-primary-foreground opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                                    </svg>
                                </span>
                            </div>
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Yes, my cycle is irregular</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-border bg-secondary checked:bg-primary checked:border-primary transition-all" type="checkbox" />
                                <span className="absolute text-primary-foreground opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                                    </svg>
                                </span>
                            </div>
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">I'm not sure / I don't track</span>
                        </label>
                    </div>
                </div>

            </div>
        </div>
    );
};
