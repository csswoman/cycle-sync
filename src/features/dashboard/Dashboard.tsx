import React from 'react';
import { View } from '@/types';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { DashboardHeader } from './components/DashboardHeader';
import { DailyActionPanel } from './components/DailyActionPanel';
import { SectionMovement } from './components/SectionMovement';
import { SectionNourishment } from './components/SectionNourishment';

interface DashboardProps {
    onNavigate: (view: View) => void;
    userName?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userName }) => {
    const nourishmentData = [
        {
            title: "Salmon & Quinoa Bowl",
            imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhhjTsyhqnm1zdZP93JOa_6ABVtIhKhUX4bxOTlzByglwEU6Y8dPHHFCvyp-aALjoVTqpr2-ZBhuTWUrrnBBIlDbE4zUyPXZ-GiWj2s0kMSiABx2hmWu9FFUlnqKSDgVQG3Uu7tu84plSj0X9RJ2TpOBkm0zQ1U6oEbDDjHlGPs3l9wagoTBbUQJvqWz2dYD-PKrVGMSuvwr9EzxEkcXu3oyCGxvdRgfEwG6ePnYz0ov0PPi3z-t3UFSc3qe32brbPdHkYJEc-9x8",
            focus: "Hormone Balance Focus",
            description: "Rich in Omega-3s and complex carbs.",
            why: "Complex carbs aid serotonin production which can dip during the late luteal phase, helping to stabilize mood and reduce cravings.",
            linkText: "View Recipe"
        },
        {
            title: "Magnesium Rich Snack",
            imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuChtgD126zZdUHP4U8G_DKhYxP2FJ9R15QhYL14_Vufbq-f2Hhcd4QXU7R9cd_efVoRcrdwVtafwkYu0Mz6Au5vQ4FTGg9qheKWQcxBm-9IDMIQh5Kj9Oe6m_1ntoRvvnWBlzFYXbPggIg2MNeHqhGLvbsyfs1Nbw6e9V8r5YpvRGZbwqq3Pmqfh1AbkqrK45abZlzx8bGI1XJxpv1mX3QlmIOmsnp3aS9Y4gSXRKEHCs66vTw8Z_fVpjk6w6X74sftm20i8rhqjhs",
            focus: "Symptom Management",
            description: "Dark chocolate (>70%) and raw almonds.",
            why: "Magnesium helps relax smooth muscle tissue in the uterus, potentially reducing the severity of upcoming cramps.",
            linkText: "Learn More"
        }
    ];

    return (
        <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
            <div className="max-w-[1100px] mx-auto p-6 md:p-10 flex flex-col gap-8 pb-20">
                <DashboardHeader phase="Luteal" day={22} focus="Stabilize Blood Sugar" userName={userName} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader title="Current Phase" icon="water_drop" />
                        <CardContent>
                            <p className="text-foreground text-2xl font-bold">Luteal</p>
                            <p className="text-xs text-muted-foreground mt-1">High Progesterone</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader title="Cycle Day" icon="calendar_today" />
                        <CardContent>
                            <p className="text-foreground text-2xl font-bold">Day 22</p>
                            <p className="text-xs text-muted-foreground mt-1">~6 Days to Menstruation</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader title="Archetype" icon="psychology" />
                        <CardContent>
                            <p className="text-foreground text-2xl font-bold">Powerhouse</p>
                            <p className="text-xs text-muted-foreground mt-1">Focus on Consistency</p>
                        </CardContent>
                    </Card>
                </div>

                <DailyActionPanel
                    title="Daily Check-In"
                    description="How are your symptoms today? Logging your mood and energy helps us refine your plan for tomorrow."
                    buttonText="Log Symptoms"
                    onAction={() => onNavigate(View.LOG)}
                />

                <SectionMovement
                    title="Low Impact Strength Flow"
                    description="A gentle but effective session combining slow strength movements with mobility. Designed to maintain muscle tone without adding stress."
                    duration="30 Min"
                    intensity="Low Impact"
                    imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuBhkMw5OiVrHssOpEse9L-QT9Bu5m6KhbS2Q0iFroBtbgs2Zepod0qFxAdS5MddjGO7t1G3zcamGliodgud5en1EXzSbzTGrx0VEsWcfgtDNcFuGfSulLPE12pg1gQ7GbQI_t2SryscKT0eHdQl9eOF5G1MGffb3Bve2y4lnRiWz9X5-XJWSdeAx2NxkbI31hZcYCTR1GH-k2IKABS89VufoS5sh36iV8rlyQMD7aIJGCVTUmJh9MTXDY5t6W-z5Ax095saet7A1A0"
                    whyItWorks="During the luteal phase, your body temperature is higher and your resting heart rate increases. We are focusing on strength maintenance to utilize fat for fuel without spiking cortisol levels, which can worsen PMS."
                />

                <SectionNourishment meals={nourishmentData} />

                <footer className="mt-8 pt-8 border-t border-border flex flex-col items-center justify-center gap-4 text-center">
                    <p className="text-xs text-muted-foreground max-w-md uppercase tracking-tighter">
                        Disclaimer: This plan is generated based on your tracked data. Listen to your body first. Consult a healthcare professional for specific medical advice regarding PCOS.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default Dashboard;
