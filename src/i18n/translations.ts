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

    habits: string;

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

    // Forgot / Reset Password
    forgotPasswordTitle: string;
    forgotPasswordDescription: string;
    sendResetLink: string;
    resetLinkSent: string;
    resetLinkSentDescription: string;
    resetPasswordTitle: string;
    resetPasswordDescription: string;
    resetPasswordButton: string;
    passwordResetSuccess: string;

    // Magic Link
    orContinueWith: string;
    magicLink: string;
    sendMagicLink: string;
    magicLinkSent: string;
    magicLinkSentDescription: string;
    checkSpamFolder: string;

    // Export
    exportReport: string;

    // Fitbit
    fitbitSection: string;
    fitbitDescription: string;
    fitbitConnect: string;
    fitbitConnected: string;
    fitbitDisconnect: string;
    fitbitSync: string;
    fitbitLoading: string;
    fitbitSteps: string;
    fitbitHeartRate: string;
    fitbitSleep: string;
    fitbitCalories: string;
    fitbitSleepDetails: string;
    fitbitError: string;
    fitbitConnectionSuccess: string;

    // Health Connect webhook (Samsung / Galaxy Watch)
    healthWebhookSection: string;
    healthWebhookDescription: string;
    healthWebhookLoading: string;
    healthWebhookGenerate: string;
    healthWebhookRotate: string;
    healthWebhookUrlLabel: string;
    healthWebhookCopy: string;
    healthWebhookSecretHint: string;
    healthWebhookTokenCreated: string;
    healthWebhookCopied: string;
    healthWebhookStep1: string;
    healthWebhookStep2: string;
    healthWebhookStep3: string;
    healthWebhookStep4: string;
    wearableSectionTitle: string;
    wearableHealthConnectHint: string;
    distanceLabel: string;
    weightLabel: string;
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
        habits: 'Habits',

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

        // Forgot / Reset Password
        forgotPasswordTitle: 'Reset your password',
        forgotPasswordDescription: 'Enter your email and we\'ll send you a link to reset your password.',
        sendResetLink: 'Send Reset Link',
        resetLinkSent: 'Check your email',
        resetLinkSentDescription: 'We\'ve sent a password reset link to your email. Click the link to set a new password.',
        resetPasswordTitle: 'Set new password',
        resetPasswordDescription: 'Enter your new password below.',
        resetPasswordButton: 'Update Password',
        passwordResetSuccess: 'Password updated successfully!',

        // Magic Link
        orContinueWith: 'or continue with',
        magicLink: 'Magic Link',
        sendMagicLink: 'Send Magic Link',
        magicLinkSent: 'Magic link sent!',
        magicLinkSentDescription: 'We\'ve sent a login link to your email. Click it to sign in instantly.',
        checkSpamFolder: 'Didn\'t receive the email? Check your spam folder.',

        // Export
        exportReport: 'Export Report',

        // Fitbit
        fitbitSection: 'Wearable',
        fitbitDescription: 'Connect your Fitbit or Samsung Galaxy Watch (via Health Connect + Fitbit) to sync steps, heart rate, sleep, and more.',
        fitbitConnect: 'Connect Fitbit',
        fitbitConnected: 'Connected to Fitbit',
        fitbitDisconnect: 'Disconnect',
        fitbitSync: 'Sync',
        fitbitLoading: 'Checking connection...',
        fitbitSteps: 'Steps',
        fitbitHeartRate: 'Heart Rate',
        fitbitSleep: 'Sleep',
        fitbitCalories: 'Calories',
        fitbitSleepDetails: 'Sleep Breakdown',
        fitbitError: 'Could not connect to Fitbit. Please try again.',
        fitbitConnectionSuccess: 'Fitbit connected successfully!',

        healthWebhookSection: 'Samsung & Health Connect',
        healthWebhookDescription:
            'Paste the webhook URL in the HC Webhook app on Android. Data from Samsung Health / Galaxy Watch (via Health Connect) syncs to CycleSync every 15+ minutes.',
        healthWebhookLoading: 'Loading…',
        healthWebhookGenerate: 'Generate webhook URL',
        healthWebhookRotate: 'Regenerate URL (old link stops working)',
        healthWebhookUrlLabel: 'Webhook URL (paste in HC Webhook)',
        healthWebhookCopy: 'Copy',
        healthWebhookSecretHint: 'Token prefix',
        healthWebhookTokenCreated: 'New URL created and copied to clipboard.',
        healthWebhookCopied: 'Copied to clipboard.',
        healthWebhookStep1: 'Open HC Webhook → add this URL under Webhooks.',
        healthWebhookStep2: 'Grant Health Connect permissions for steps, sleep, heart rate, etc.',
        healthWebhookStep3: 'Choose data types and Save configuration.',
        healthWebhookStep4: 'Tap Sync Now in HC Webhook or wait for the interval. On Vercel, add SUPABASE_SERVICE_ROLE_KEY (Supabase → Settings → API → service_role).',
        wearableSectionTitle: 'Wearable',
        wearableHealthConnectHint:
            'Best for Galaxy Watch: use Health Connect below. Fitbit API only sees data on Fitbit servers (not Health Connect tiles).',
        distanceLabel: 'Distance',
        weightLabel: 'Weight',
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
        habits: 'Hábitos',

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

        // Forgot / Reset Password
        forgotPasswordTitle: 'Restablecer contraseña',
        forgotPasswordDescription: 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.',
        sendResetLink: 'Enviar enlace',
        resetLinkSent: 'Revisa tu correo',
        resetLinkSentDescription: 'Hemos enviado un enlace para restablecer tu contraseña. Haz clic en el enlace para crear una nueva.',
        resetPasswordTitle: 'Nueva contraseña',
        resetPasswordDescription: 'Ingresa tu nueva contraseña a continuación.',
        resetPasswordButton: 'Actualizar Contraseña',
        passwordResetSuccess: '¡Contraseña actualizada exitosamente!',

        // Magic Link
        orContinueWith: 'o continuar con',
        magicLink: 'Enlace Mágico',
        sendMagicLink: 'Enviar Enlace Mágico',
        magicLinkSent: '¡Enlace mágico enviado!',
        magicLinkSentDescription: 'Hemos enviado un enlace de inicio de sesión a tu correo. Haz clic para iniciar sesión al instante.',
        checkSpamFolder: '¿No recibiste el correo? Revisa tu carpeta de spam.',

        // Export
        exportReport: 'Exportar Reporte',

        // Fitbit
        fitbitSection: 'Wearable',
        fitbitDescription: 'Conecta tu Fitbit o Samsung Galaxy Watch (vía Health Connect + Fitbit) para sincronizar pasos, frecuencia cardíaca, sueño y más.',
        fitbitConnect: 'Conectar Fitbit',
        fitbitConnected: 'Conectado a Fitbit',
        fitbitDisconnect: 'Desconectar',
        fitbitSync: 'Sincronizar',
        fitbitLoading: 'Verificando conexión...',
        fitbitSteps: 'Pasos',
        fitbitHeartRate: 'Frecuencia',
        fitbitSleep: 'Sueño',
        fitbitCalories: 'Calorías',
        fitbitSleepDetails: 'Desglose del Sueño',
        fitbitError: 'No se pudo conectar con Fitbit. Intenta de nuevo.',
        fitbitConnectionSuccess: '¡Fitbit conectado exitosamente!',

        healthWebhookSection: 'Samsung y Health Connect',
        healthWebhookDescription:
            'Pega la URL del webhook en la app HC Webhook en Android. Los datos de Samsung Health / Galaxy Watch (vía Health Connect) se sincronizan con CycleSync cada 15+ minutos.',
        healthWebhookLoading: 'Cargando…',
        healthWebhookGenerate: 'Generar URL del webhook',
        healthWebhookRotate: 'Regenerar URL (el enlace anterior deja de funcionar)',
        healthWebhookUrlLabel: 'URL del webhook (pegar en HC Webhook)',
        healthWebhookCopy: 'Copiar',
        healthWebhookSecretHint: 'Prefijo del token',
        healthWebhookTokenCreated: 'Nueva URL creada y copiada al portapapeles.',
        healthWebhookCopied: 'Copiado al portapapeles.',
        healthWebhookStep1: 'Abre HC Webhook → añade esta URL en Webhooks.',
        healthWebhookStep2: 'Concede permisos de Health Connect (pasos, sueño, frecuencia cardíaca, etc.).',
        healthWebhookStep3: 'Elige tipos de datos y guarda la configuración.',
        healthWebhookStep4: 'Pulsa Sincronizar ahora en HC Webhook o espera el intervalo. En Vercel, añade SUPABASE_SERVICE_ROLE_KEY (Supabase → Ajustes → API → service_role).',
        wearableSectionTitle: 'Wearable',
        wearableHealthConnectHint:
            'Ideal para Galaxy Watch: usa Health Connect abajo. La API de Fitbit solo ve datos en los servidores de Fitbit (no los datos de Health Connect en la app).',
        distanceLabel: 'Distancia',
        weightLabel: 'Peso',
    },
};
