export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-[700px] mx-auto">
        <h1 className="text-3xl font-black text-foreground mb-6">Terms of Service</h1>
        <div className="prose prose-sm dark:prose-invert text-muted-foreground flex flex-col gap-4">
          <p><strong>Last updated:</strong> March 18, 2026</p>

          <h2 className="text-lg font-bold text-foreground mt-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using CycleSync, you agree to be bound by these Terms of Service.
            If you do not agree, please do not use the application.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">2. Description of Service</h2>
          <p>
            CycleSync is a holistic health application designed for menstrual cycle tracking,
            wellness recommendations, and integration with wearable health devices. The app
            provides personalized insights based on cycle phases, nutrition, exercise, and
            health data from connected devices.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">3. Health Disclaimer</h2>
          <p>
            CycleSync is not a medical device and is intended for informational and wellness
            purposes only. Data from wearable devices (including Fitbit and Samsung Health) is
            not intended for the diagnosis, treatment, or prevention of any medical condition.
            Always consult a healthcare professional for medical advice.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">4. Third-Party Integrations</h2>
          <p>
            CycleSync may integrate with third-party services such as Fitbit. Your use of these
            integrations is subject to the respective third-party terms of service and privacy
            policies. CycleSync is not responsible for the availability or accuracy of
            third-party data.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">5. User Data</h2>
          <p>
            You retain ownership of all health data you provide or sync through CycleSync.
            You may disconnect third-party integrations and delete your data at any time
            through the Settings page.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">6. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of CycleSync
            after changes constitutes acceptance of the updated terms.
          </p>
        </div>
      </div>
    </div>
  );
}
