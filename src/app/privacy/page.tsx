export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-[700px] mx-auto">
        <h1 className="text-3xl font-black text-foreground mb-6">Privacy Policy</h1>
        <div className="prose prose-sm dark:prose-invert text-muted-foreground flex flex-col gap-4">
          <p><strong>Last updated:</strong> November 2026</p>

          <h2 className="text-lg font-bold text-foreground mt-4">1. Information We Collect</h2>
          <p>CycleSync collects the following types of information:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data:</strong> email address, name, and profile picture.</li>
            <li><strong>Health data:</strong> menstrual cycle logs, daily symptoms, mood, and PMOS tracking entries.</li>
            <li><strong>Sensitive entries:</strong> bleeding, basal temperature, sexual activity, lab results, medication, mental-health questionnaires and progress photos. Progress photos are stored in a private bucket and shown through short-lived links. Sexual activity and photos are never sent to the AI assistant or included in exported reports.</li>
            <li><strong>Wearable data:</strong> steps, heart rate, sleep, and activity data that you send from Health Connect or enter manually.</li>
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
            Your webhook token is stored server-side. We do not sell, share,
            or transfer your personal health data to third parties.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">4. Third-Party Services</h2>
          <p>CycleSync integrates with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Health Connect (optional):</strong> if you use the HC Webhook app on Android, you send the health metrics you choose to our servers via a private URL with a secret token. Data is stored in your CycleSync account only.</li>
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
          <p>
            Both are in <strong>Settings → Privacy and data</strong>. &ldquo;Download my data&rdquo; gives you a JSON file with all your records.
            &ldquo;Delete my account&rdquo; permanently removes your account, every record linked to it, your progress photos and your profile picture, and also clears the copy stored in this browser.
            You can also set a PIN lock in the same place. The PIN is kept only on your device and works as a privacy screen; it does not encrypt your data.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">6. Data Retention</h2>
          <p>
            All your data, files included, is deleted immediately and permanently when you delete your account from the app.
            Otherwise it is kept until you delete it.
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
