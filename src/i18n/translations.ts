export type Language = 'en' | 'es';

export interface Translations {
    // Navigation
    overview: string;
    dailyLog: string;
    trends: string;
    settings: string;
    personalizeExperience: string;
    setupProfile: string;
    pmosToolkit: string;
    routines: string;
    mealIdeas: string;
    weeklyPlanner: string;

    habits: string;
    medications: string;

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
    assistantTitle: string;
    assistantSubtitle: string;
    assistantOnline: string;
    suggestMeals: string;
    suggestCramps: string;
    suggestWorkout: string;
    uploadTooltip: string;
    quickActions: string;

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
    connectionError: string;
    invalidCredentials: string;
    noAccountForEmail: string;
    dontHaveAccount: string;
    signUp: string;
    guestBrowsing: string;
    guestSignIn: string;
    guestExplore: string;
    guestModalTitle: string;
    guestModalBody: string;
    guestLater: string;
    guestUser: string;
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
    navToday: string;
    navCycle: string;
    navPlan: string;
    navHealth: string;
    pmosLogMovedTitle: string;
    pmosLogMovedBody: string;
    pmosLogMovedCta: string;
    cycleLengthsTitle: string;
    shortestCycle: string;
    longestCycle: string;
    averageShort: string;
    cycleOfDays: string;
    untilNextPeriod: string;
    currentCycleDay: string;
    forecastHormonalNote: string;
    forecastFertilityTip: string;
    previousMonth: string;
    nextMonth: string;
    legendNewDays: string;
    legendSavedDays: string;
    legendFertile: string;
    averageCycleLabel: string;
    daysUnit: string;
    forecastTitle: string;
    confidenceLabel: string;
    confidenceHigh: string;
    confidenceMedium: string;
    confidenceLow: string;
    nextPeriodLabel: string;
    ovulationLabel: string;
    fertileWindowLabel: string;
    forecastIrregularNote: string;
    forecastDisclaimer: string;
    calendarHint: string;
    noDaysSelected: string;
    periodSingular: string;
    periodPlural: string;
    saveMarkedDays: string;
    clearSelection: string;
    noPeriodsYet: string;
    deletePeriod: string;
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

    fitbitSync: string;
    fitbitLoading: string;
    fitbitSteps: string;
    fitbitHeartRate: string;
    fitbitSleep: string;
    fitbitCalories: string;

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
    bodyTodayTitle: string;
    bodyConnectHint: string;
    bodyAdd: string;
    manualHealthToggle: string;
    manualHealthTitle: string;
    manualHealthSteps: string;
    manualHealthSleep: string;
    manualHealthActivity: string;
    manualHealthDate: string;
    manualHealthHours: string;
    manualHealthMinutes: string;
    manualHealthActivityType: string;
    manualHealthStart: string;
    manualHealthKcal: string;
    manualHealthSave: string;
    manualHealthSaved: string;
    manualHealthRecent: string;
    manualHealthDelete: string;
    manualHealthEmpty: string;
    manualHealthSleepNote: string;
    activeMinutesLabel: string;

    // Health Library & Articles
    articles: string;
    healthLibrary: string;
    searchArticles: string;
    filterAll: string;
    filterTraining: string;
    filterNutrition: string;
    filterPmos: string;
    filterRecovery: string;
    filterTracking: string;
    forRegularCycle: string;
    forPmos: string;
    keyTakeaway: string;
    actionInApp: string;
    readArticle: string;
    closeArticle: string;
    readTime: string;
    allAudiences: string;
    medicalDisclaimer: string;
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
        pmosToolkit: 'PMOS Toolkit',
        routines: 'Workouts',
        mealIdeas: 'Meal Ideas',
        weeklyPlanner: 'Weekly Plan',
        habits: 'Habits',
        medications: 'Medications',

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
        assistantTitle: 'CycleSync AI',
        assistantSubtitle: 'Cycle & wellness companion',
        assistantOnline: 'Online',
        suggestMeals: 'Phase-friendly foods?',
        suggestCramps: 'How to ease cramps?',
        suggestWorkout: 'Best workout for today?',
        uploadTooltip: 'Upload image or video',
        quickActions: 'Quick suggestions',

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
        invalidCredentials: 'Incorrect email or password. If you don\'t have an account yet, create one.',
        noAccountForEmail: 'No account exists for this email. Create one to continue.',
        connectionError: 'Could not reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, restart the dev server, and confirm the project is active in the Supabase dashboard.',
        dontHaveAccount: "Don't have an account?",
        signUp: 'Sign Up',
        guestBrowsing: 'Browsing as guest',
        guestSignIn: 'Sign in',
        guestExplore: 'Explore without an account',
        guestModalTitle: 'Create a free account to use this',
        guestModalBody: 'Logging, progress, medications and your personal data are saved to your account. Sign up to unlock them.',
        guestLater: 'Maybe later',
        guestUser: 'Guest',
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
        navToday: 'Today',
        navCycle: 'My cycle',
        navPlan: 'Plan',
        navHealth: 'Health',
        pmosLogMovedTitle: 'Daily symptom check-in',
        pmosLogMovedBody: 'Your symptoms and medication now live in the Daily Log, together with your mood and energy.',
        pmosLogMovedCta: 'Go to Daily Log',
        cycleLengthsTitle: 'Days between periods',
        shortestCycle: 'Shortest',
        longestCycle: 'Longest',
        averageShort: 'Average',
        cycleOfDays: 'Cycle of',
        untilNextPeriod: 'until',
        currentCycleDay: 'Current cycle: day',
        forecastHormonalNote: 'You use hormonal contraception, which usually prevents natural ovulation. Treat the ovulation and fertile dates as informational only.',
        forecastFertilityTip: 'Your chances are highest on the two days before ovulation and on ovulation day.',
        previousMonth: 'Previous month',
        nextMonth: 'Next month',
        legendNewDays: 'New days',
        legendSavedDays: 'Saved',
        legendFertile: 'Fertile window',
        averageCycleLabel: 'Average cycle',
        daysUnit: 'days',
        forecastTitle: 'Your estimates',
        confidenceLabel: 'Confidence',
        confidenceHigh: 'High',
        confidenceMedium: 'Medium',
        confidenceLow: 'Low',
        nextPeriodLabel: 'Next period',
        ovulationLabel: 'Ovulation',
        fertileWindowLabel: 'Fertile window',
        forecastIrregularNote: 'Your cycles vary a lot, so these dates are less reliable.',
        forecastDisclaimer: 'These are approximate estimates based on your history. They are not a contraceptive method or medical advice.',
        calendarHint: 'Tap the first day of a period, then tap its last day to fill the range. Go back month by month to add your history.',
        noDaysSelected: 'No days selected yet.',
        periodSingular: 'period',
        periodPlural: 'periods',
        saveMarkedDays: 'Save marked days',
        clearSelection: 'Clear selection',
        noPeriodsYet: 'No periods logged yet.',
        deletePeriod: 'Delete period',
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

            fitbitSync: 'Sync',
        fitbitLoading: 'Checking connection...',
        fitbitSteps: 'Steps',
        fitbitHeartRate: 'Heart Rate',
        fitbitSleep: 'Sleep',
        fitbitCalories: 'Calories',

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
            'Galaxy Watch data reaches CycleSync through Health Connect and the HC Webhook app.',
        distanceLabel: 'Distance',
        weightLabel: 'Weight',
        bodyTodayTitle: 'Your body today',
        bodyConnectHint: 'Connect your watch in Settings to sync automatically.',
        bodyAdd: 'Add',
        manualHealthToggle: 'Add data manually',
        manualHealthTitle: 'Manual entry',
        manualHealthSteps: 'Steps',
        manualHealthSleep: 'Sleep',
        manualHealthActivity: 'Activity',
        manualHealthDate: 'Date',
        manualHealthHours: 'Hours',
        manualHealthMinutes: 'Minutes',
        manualHealthActivityType: 'Activity (e.g. Yoga, Walk)',
        manualHealthStart: 'Start time',
        manualHealthKcal: 'Calories (optional)',
        manualHealthSave: 'Save',
        manualHealthSaved: 'Saved.',
        manualHealthRecent: 'Recent manual entries',
        manualHealthDelete: 'Delete',
        manualHealthEmpty: 'No manual entries yet.',
        manualHealthSleepNote: 'Date = the day you woke up.',
        activeMinutesLabel: 'Active minutes',

        // Health Library & Articles
        articles: 'Articles',
        healthLibrary: 'Health Library',
        searchArticles: 'Search articles, topics or symptoms...',
        filterAll: 'All',
        filterTraining: 'Training & Phases',
        filterNutrition: 'Nutrition & Insulin',
        filterPmos: 'PMOS / PCOS',
        filterRecovery: 'Recovery & Sleep',
        filterTracking: 'Cycle Tracking',
        forRegularCycle: 'Regular Cycle',
        forPmos: 'With PMOS / PCOS',
        keyTakeaway: 'Key Takeaway',
        actionInApp: 'In CycleSync App',
        readArticle: 'Read article',
        closeArticle: 'Close',
        readTime: 'min read',
        allAudiences: 'All Audiences',
        medicalDisclaimer: 'Educational information only. Does not replace professional medical advice, diagnosis, or personalized clinical treatment.',
    },
    es: {
        // Navigation
        overview: 'Resumen',
        dailyLog: 'Registro Diario',
        trends: 'Tendencias',
        settings: 'Configuración',
        personalizeExperience: 'Personalizar Experiencia',
        setupProfile: 'Configurar Perfil',
        pmosToolkit: 'Kit de PMOS',
        routines: 'Entrenamientos',
        mealIdeas: 'Ideas de Comidas',
        weeklyPlanner: 'Plan Semanal',
        habits: 'Hábitos',
        medications: 'Medicamentos',

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
        assistantTitle: 'CycleSync AI',
        assistantSubtitle: 'Tu compañera de ciclo y bienestar',
        assistantOnline: 'En línea',
        suggestMeals: '¿Qué comer según mi fase?',
        suggestCramps: '¿Cómo aliviar los cólicos?',
        suggestWorkout: '¿Qué ejercicio me conviene hoy?',
        uploadTooltip: 'Subir imagen o video',
        quickActions: 'Sugerencias rápidas',

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
        invalidCredentials: 'Correo o contraseña incorrectos. Si aún no tienes cuenta, créala.',
        noAccountForEmail: 'No existe una cuenta con este correo. Créala para continuar.',
        connectionError: 'No se pudo conectar con Supabase. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local, reinicia el servidor y confirma que el proyecto esté activo en el panel de Supabase.',
        dontHaveAccount: '¿No tienes una cuenta?',
        signUp: 'Regístrate',
        guestBrowsing: 'Navegando como invitada',
        guestSignIn: 'Iniciar sesión',
        guestExplore: 'Explorar sin cuenta',
        guestModalTitle: 'Crea una cuenta gratis para usar esto',
        guestModalBody: 'El registro diario, el progreso, las medicinas y tus datos personales se guardan en tu cuenta. Regístrate para desbloquearlos.',
        guestLater: 'Quizás después',
        guestUser: 'Invitada',
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
        navToday: 'Hoy',
        navCycle: 'Mi ciclo',
        navPlan: 'Plan',
        navHealth: 'Salud',
        pmosLogMovedTitle: 'Registro diario de síntomas',
        pmosLogMovedBody: 'Tus síntomas y tu medicación ahora están en el Registro Diario, junto con tu ánimo y energía.',
        pmosLogMovedCta: 'Ir al Registro Diario',
        cycleLengthsTitle: 'Días entre un período y otro',
        shortestCycle: 'Más corto',
        longestCycle: 'Más largo',
        averageShort: 'Promedio',
        cycleOfDays: 'Ciclo de',
        untilNextPeriod: 'hasta',
        currentCycleDay: 'Ciclo actual: día',
        forecastHormonalNote: 'Usas anticoncepción hormonal, que normalmente impide la ovulación natural. Toma las fechas de ovulación y ventana fértil solo como referencia.',
        forecastFertilityTip: 'Tus probabilidades son mayores los dos días antes de la ovulación y el día de la ovulación.',
        previousMonth: 'Mes anterior',
        nextMonth: 'Mes siguiente',
        legendNewDays: 'Días nuevos',
        legendSavedDays: 'Guardados',
        legendFertile: 'Ventana fértil',
        averageCycleLabel: 'Ciclo promedio',
        daysUnit: 'días',
        forecastTitle: 'Tus estimaciones',
        confidenceLabel: 'Confianza',
        confidenceHigh: 'Alta',
        confidenceMedium: 'Media',
        confidenceLow: 'Baja',
        nextPeriodLabel: 'Próxima menstruación',
        ovulationLabel: 'Ovulación',
        fertileWindowLabel: 'Ventana fértil',
        forecastIrregularNote: 'Tus ciclos varían bastante, así que estas fechas son menos confiables.',
        forecastDisclaimer: 'Son estimaciones aproximadas basadas en tu historial. No sirven como método anticonceptivo ni como consejo médico.',
        calendarHint: 'Toca el primer día de una regla y luego el último para marcar el rango. Retrocede mes a mes para agregar tu historial.',
        noDaysSelected: 'Aún no has marcado días.',
        periodSingular: 'regla',
        periodPlural: 'reglas',
        saveMarkedDays: 'Guardar días marcados',
        clearSelection: 'Limpiar selección',
        noPeriodsYet: 'Aún no hay períodos registrados.',
        deletePeriod: 'Eliminar período',
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

            fitbitSync: 'Sincronizar',
        fitbitLoading: 'Verificando conexión...',
        fitbitSteps: 'Pasos',
        fitbitHeartRate: 'Frecuencia',
        fitbitSleep: 'Sueño',
        fitbitCalories: 'Calorías',

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
            'Los datos del Galaxy Watch llegan a CycleSync mediante Health Connect y la app HC Webhook.',
        distanceLabel: 'Distancia',
        weightLabel: 'Peso',
        bodyTodayTitle: 'Tu cuerpo hoy',
        bodyConnectHint: 'Conecta tu reloj en Ajustes para sincronizar automáticamente.',
        bodyAdd: 'Añadir',
        manualHealthToggle: 'Añadir datos manualmente',
        manualHealthTitle: 'Registro manual',
        manualHealthSteps: 'Pasos',
        manualHealthSleep: 'Sueño',
        manualHealthActivity: 'Actividad',
        manualHealthDate: 'Fecha',
        manualHealthHours: 'Horas',
        manualHealthMinutes: 'Minutos',
        manualHealthActivityType: 'Actividad (ej. Yoga, Caminata)',
        manualHealthStart: 'Hora de inicio',
        manualHealthKcal: 'Calorías (opcional)',
        manualHealthSave: 'Guardar',
        manualHealthSaved: 'Guardado.',
        manualHealthRecent: 'Registros manuales recientes',
        manualHealthDelete: 'Eliminar',
        manualHealthEmpty: 'Aún no hay registros manuales.',
        manualHealthSleepNote: 'Fecha = el día en que despertaste.',
        activeMinutesLabel: 'Minutos activos',

        // Health Library & Articles
        articles: 'Artículos',
        healthLibrary: 'Biblioteca de Salud',
        searchArticles: 'Buscar artículos, temas o síntomas...',
        filterAll: 'Todos',
        filterTraining: 'Entrenamiento y Fases',
        filterNutrition: 'Nutrición e Insulina',
        filterPmos: 'PMOS / SOP',
        filterRecovery: 'Recuperación y Sueño',
        filterTracking: 'Seguimiento del Ciclo',
        forRegularCycle: 'En ciclo regular',
        forPmos: 'Con PMOS / SOP',
        keyTakeaway: 'Idea clave',
        actionInApp: 'En la app CycleSync',
        readArticle: 'Leer artículo',
        closeArticle: 'Cerrar',
        readTime: 'min de lectura',
        allAudiences: 'Todas las audiencias',
        medicalDisclaimer: 'Información educativa. No reemplaza el diagnóstico, valoración ni tratamiento médico personalizado.',
    },
};
