export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-[700px] mx-auto">
        <h1 className="text-3xl font-black text-foreground mb-6">Privacy Policy</h1>
        <div className="prose prose-sm dark:prose-invert text-muted-foreground flex flex-col gap-4">
          <p><strong>Last updated:</strong> March 18, 2026</p>

          <h2 className="text-lg font-bold text-foreground mt-4">1. Information We Collect</h2>
          <p>CycleSync collects the following types of information:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data:</strong> email address, name, and profile picture.</li>
            <li><strong>Health data:</strong> menstrual cycle logs, daily symptoms, mood, and PCOS tracking entries.</li>
            <li><strong>Wearable data:</strong> when you connect Fitbit, we access steps, heart rate, sleep, and activity data through the Fitbit Web API.</li>
          </ul>

          <h2 className="text-lg font-bold text-foreground mt-4">2. How We Use Your Data</h2>
          <p>Your data is used exclusively to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide personalized cycle-based recommendations.</li>
            <li>Display your health metrics from connected wearables.</li>
            <li>Generate health reports for your personal use.</li>
          </ul>

          <h2 className="text-lg font-bold text-foreground mt-4">3. Data Storage & Security</h2>
          <p>
            Your data is stored securely using Supabase with row-level security policies.
            Fitbit OAuth tokens are encrypted and stored server-side. We do not sell, share,
            or transfer your personal health data to third parties.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">4. Third-Party Services</h2>
          <p>CycleSync integrates with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Fitbit:</strong> to read health and activity data. Subject to <a href="https://www.fitbit.com/legal/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Fitbit&apos;s Privacy Policy</a>.</li>
            <li><strong>Supabase:</strong> for authentication and data storage.</li>
          </ul>

          <h2 className="text-lg font-bold text-foreground mt-4">5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access all your stored data.</li>
            <li>Disconnect wearable integrations at any time.</li>
            <li>Delete your account and all associated data.</li>
            <li>Export your health data.</li>
          </ul>

          <h2 className="text-lg font-bold text-foreground mt-4">6. Data Retention</h2>
          <p>
            Fitbit tokens are deleted immediately when you disconnect the integration.
            Your account data is retained until you request deletion.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">7. Contact</h2>
          <p>
            For privacy-related questions, please contact us through the application.
          </p>
        </div>
      </div>
    </div>
  );
}
