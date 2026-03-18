export type Language = 'en' | 'es';

export interface Translations {
    // Navigation
    overview: string;
    dailyLog: string;
    trends: string;
    settings: string;
    personalizeExperience: string;
    setupProfile: string;
    pcosToolkit: string;
    routines: string;
    mealIdeas: string;

    // Theme
    lightMode: string;
    darkMode: string;

    // Language
    language: string;

    // Common
    comingSoon: string;
    thisFeatureIsComingSoon: string;

    // User
    powerhouseArchetype: string;

    // SmartAssistant
    chat: string;
    image: string;
    video: string;
    typeMessage: string;
    send: string;

    // API Quota
    quotaExceeded: string;
    quotaExceededMessage: string;
    quotaResetTime: string;
    usingFallbackData: string;

    // Login
    welcomeBack: string;
    loginDescription: string;
    emailLabel: string;
    passwordLabel: string;
    forgotPassword: string;
    loginButton: string;
    dontHaveAccount: string;
    signUp: string;
    dataSecurityInfo: string;
    help: string;
    createAccount: string;
    registerDescription: string;
    fullNameLabel: string;
    confirmPasswordLabel: string;
    registerButton: string;
    alreadyHaveAccount: string;
    passwordsDoNotMatch: string;
    checkEmailTitle: string;
    checkEmailDescription: string;
    backToLogin: string;
    settingsTitle: string;
    profileSection: string;
    saveChanges: string;
    securitySection: string;
    updatePasswordTitle: string;
    newPasswordLabel: string;
    confirmNewPasswordLabel: string;
    updatePasswordButton: string;
    optionalStatement: string;
    changePhotoLabel: string;
    periodHistory: string;
    addPeriod: string;
    periodStartDate: string;
    periodEndDate: string;
    regularityStatus: string;
    regular: string;
    irregular: string;
    notEnoughData: string;
    cycleHistoryTitle: string;
    markDaysDescription: string;
}

export const translations: Record<Language, Translations> = {
    en: {
        // Navigation
        overview: 'Overview',
        dailyLog: 'Daily Log',
        trends: 'Trends',
        settings: 'Settings',
        personalizeExperience: 'Personalize Experience',
        setupProfile: 'Setup Profile',
        pcosToolkit: 'PCOS Toolkit',
        routines: 'Workouts',
        mealIdeas: 'Meal Ideas',

        // Theme
        lightMode: 'Light Mode',
        darkMode: 'Dark Mode',

        // Language
        language: 'Language',

        // Common
        comingSoon: 'Coming Soon',
        thisFeatureIsComingSoon: 'This feature is coming soon.',

        // User
        powerhouseArchetype: 'Powerhouse Archetype',

        // SmartAssistant
        chat: 'Chat',
        image: 'Image',
        video: 'Video',
        typeMessage: 'Type your message...',
        send: 'Send',

        // API Quota
        quotaExceeded: 'Daily Limit Reached',
        quotaExceededMessage: 'You\'ve reached the daily limit for detailed recipes. Tomorrow you\'ll have more!',
        quotaResetTime: 'Resets at midnight',
        usingFallbackData: 'Showing curated recipes',

        // Login
        welcomeBack: 'Welcome Back',
        loginDescription: 'Log in to your CycleSync account to access your personalized cycle training.',
        emailLabel: 'Email or Username',
        passwordLabel: 'Password',
        forgotPassword: 'Forgot Password?',
        loginButton: 'Log In',
        dontHaveAccount: "Don't have an account?",
        signUp: 'Sign Up',
        dataSecurityInfo: 'Your data is encrypted and stored locally.',
        help: 'Help',
        createAccount: 'Create Account',
        registerDescription: 'Join CycleSync to start your personalized journey today.',
        fullNameLabel: 'Full Name',
        confirmPasswordLabel: 'Confirm Password',
        registerButton: 'Create Account',
        alreadyHaveAccount: 'Already have an account?',
        passwordsDoNotMatch: 'Passwords do not match',
        checkEmailTitle: 'Check your email',
        checkEmailDescription: 'We have sent a confirmation link to your email. Please verify your account to start your personalized journey.',
        backToLogin: 'Back to Log In',
        settingsTitle: 'Settings',
        profileSection: 'Profile',
        saveChanges: 'Save Changes',
        securitySection: 'Security',
        updatePasswordTitle: 'Update Password',
        newPasswordLabel: 'New Password',
        confirmNewPasswordLabel: 'Confirm New Password',
        updatePasswordButton: 'Update Password',
        optionalStatement: 'Optional',
        changePhotoLabel: 'Change Photo',
        periodHistory: 'Period History',
        addPeriod: 'Add Period',
        periodStartDate: 'Start Date',
        periodEndDate: 'End Date',
        regularityStatus: 'Cycle Regularity',
        regular: 'Regular',
        irregular: 'Irregular',
        notEnoughData: 'Not enough data',
        cycleHistoryTitle: 'Cycle History',
        markDaysDescription: 'Log your previous periods to track regularity.',
    },
    es: {
        // Navigation
        overview: 'Resumen',
        dailyLog: 'Registro Diario',
        trends: 'Tendencias',
        settings: 'Configuración',
        personalizeExperience: 'Personalizar Experiencia',
        setupProfile: 'Configurar Perfil',
        pcosToolkit: 'Kit de PCOS',
        routines: 'Entrenamientos',
        mealIdeas: 'Ideas de Comidas',

        // Theme
        lightMode: 'Modo Claro',
        darkMode: 'Modo Oscuro',

        // Language
        language: 'Idioma',

        // Common
        comingSoon: 'Próximamente',
        thisFeatureIsComingSoon: 'Esta función estará disponible pronto.',

        // User
        powerhouseArchetype: 'Arquetipo Powerhouse',

        // SmartAssistant
        chat: 'Chat',
        image: 'Imagen',
        video: 'Video',
        typeMessage: 'Escribe tu mensaje...',
        send: 'Enviar',

        // API Quota
        quotaExceeded: 'Límite Diario Alcanzado',
        quotaExceededMessage: 'Has alcanzado el límite diario de recetas detalladas. ¡Mañana tendrás más!',
        quotaResetTime: 'Se reinicia a medianoche',
        usingFallbackData: 'Mostrando recetas seleccionadas',

        // Login
        welcomeBack: 'Bienvenida de nuevo',
        loginDescription: 'Inicia sesión en tu cuenta de CycleSync para acceder a tu entrenamiento personalizado del ciclo.',
        emailLabel: 'Correo o Usuario',
        passwordLabel: 'Contraseña',
        forgotPassword: '¿Olvidaste tu contraseña?',
        loginButton: 'Iniciar Sesión',
        dontHaveAccount: '¿No tienes una cuenta?',
        signUp: 'Regístrate',
        dataSecurityInfo: 'Tus datos están encriptados y se almacenan localmente.',
        help: 'Ayuda',
        createAccount: 'Crear Cuenta',
        registerDescription: 'Únete a CycleSync para comenzar tu viaje personalizado hoy mismo.',
        fullNameLabel: 'Nombre Completo',
        confirmPasswordLabel: 'Confirmar Contraseña',
        registerButton: 'Crear Cuenta',
        alreadyHaveAccount: '¿Ya tienes una cuenta?',
        passwordsDoNotMatch: 'Las contraseñas no coinciden',
        checkEmailTitle: 'Confirma tu correo',
        checkEmailDescription: 'Hemos enviado un enlace de confirmación a tu correo electrónico. Por favor, verifica tu cuenta para comenzar tu viaje personalizado.',
        backToLogin: 'Volver al Inicio de Sesión',
        settingsTitle: 'Configuración',
        profileSection: 'Perfil',
        saveChanges: 'Guardar Cambios',
        securitySection: 'Seguridad',
        updatePasswordTitle: 'Actualizar Contraseña',
        newPasswordLabel: 'Nueva Contraseña',
        confirmNewPasswordLabel: 'Confirmar Nueva Contraseña',
        updatePasswordButton: 'Actualizar Contraseña',
        optionalStatement: 'Opcional',
        changePhotoLabel: 'Cambiar Foto',
        periodHistory: 'Historial de Periodos',
        addPeriod: 'Agregar Periodo',
        periodStartDate: 'Fecha de Inicio',
        periodEndDate: 'Fecha de Fin',
        regularityStatus: 'Regularidad del Ciclo',
        regular: 'Regular',
        irregular: 'Irregular',
        notEnoughData: 'Datos insuficientes',
        cycleHistoryTitle: 'Historial de Ciclos',
        markDaysDescription: 'Registra tus periodos anteriores para analizar tu regularidad.',
    },
};
