import InfoLayout from "@/components/info/InfoLayout";

export default function PrivacyPage() {
    return (
        <InfoLayout title="Privacy Policy">
            <p className="text-sm border-b border-gold-border pb-4 mb-8">Last Updated: February 21, 2026</p>

            <section>
                <h2 className="text-xl font-bold text-heading mb-3">1. Information We Collect</h2>
                <p>
                    We collect information that you provide to us when creating an account, ordering services, or uploading documents.
                    This may include your name, email address, and travel related documents.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-bold text-heading mb-3">2. How We Use Your Data</h2>
                <p>
                    Your data is used solely to provide the services you requested.
                    Documents uploaded for AI analysis are processed securely and are automatically deleted 24 hours after analysis is complete.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-bold text-heading mb-3">3. Data Security and GDPR</h2>
                <p>
                    We are committed to data security. We use industry standard encryption and follow GDPR principles for data handling.
                    Your information is stored on secure servers and access is strictly controlled.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-bold text-heading mb-3">4. Third Party Sharing</h2>
                <p>
                    We do not sell your personal data. We may share information with trusted third party providers necessary to deliver our services,
                    such as payment processors or AI engine partners, under strict confidentiality agreements.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-bold text-heading mb-3">5. Your Rights</h2>
                <p>
                    You have the right to access, correct, or delete your personal information at any time.
                    You can manage your data directly from your dashboard or contact our support team for assistance.
                </p>
            </section>
        </InfoLayout>
    );
}
