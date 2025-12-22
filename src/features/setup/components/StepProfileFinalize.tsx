import React from 'react';

interface StepProfileFinalizeProps {
    userName: string;
    setUserName: (name: string) => void;
    profilePic: string;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const StepProfileFinalize: React.FC<StepProfileFinalizeProps> = ({
    userName,
    setUserName,
    profilePic,
    onImageUpload,
}) => {
    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">Finalize your profile</h1>
                <p className="text-muted-foreground text-base font-normal leading-normal">Let's make this space yours.</p>
            </div>


            <div className="bg-card rounded-xl p-8 border border-border shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative group">
                        <div
                            className="size-32 rounded-full bg-cover bg-center border-4 border-border shadow-xl"
                            style={{ backgroundImage: `url("${profilePic}")` }}
                        ></div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                            <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
                        </label>
                    </div>
                    <p className="text-sm text-muted-foreground">Tap to change photo</p>
                </div>


                <div className="flex-1 w-full flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-foreground font-bold text-sm uppercase tracking-wider">Display Name</label>
                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            placeholder="Enter your name"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-foreground font-bold text-sm uppercase tracking-wider">Goal Statement (Optional)</label>
                        <textarea
                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all h-24 resize-none"
                            placeholder="e.g. I want to feel more energetic during my luteal phase..."
                        ></textarea>
                    </div>
                </div>
            </div>
        </div>

    );
};
