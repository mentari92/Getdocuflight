import InfoLayout from "@/components/info/InfoLayout";

export default function TermsPage() {
    return (
        <InfoLayout title="Terms and Conditions">
            <p className="text-sm border-b border-gold-border pb-4 mb-8">Last Updated: February 21, 2026</p>

            <section>
                <h2 className="text-xl font-bold text-heading mb-3">1. Services Provided</h2>
                <p>
                    GetDocuFlight provides AI powered visa prediction assessments and dummy reservation services (flight and hotel) for informational and visa application support purposes.
                    Our predictions are based on statistical analysis and AI modeling and do not guarantee visa approval.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-bold text-heading mb-3">2. User Responsibilities</h2>
                <p>
                    Users are responsible for providing accurate and truthful information when using our services.
                    The dummy tickets provided are for visa application support and are not valid for actual travel.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-bold text-heading mb-3">3. Payments and Fees</h2>
                <p>
                    Fees for our services are clearly stated at the time of purchase.
                    All payments are processed securely through our authorized payment providers.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-bold text-heading mb-3">4. Limitation of Liability</h2>
                <p>
                    GetDocuFlight is not liable for any direct or indirect damages resulting from the use of our services,
                    including but not limited to visa rejections, travel delays, or financial losses.
                    The final decision on any visa application rests solely with the respective government authorities.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-bold text-heading mb-3">5. Termination</h2>
                <p>
                    We reserve the right to terminate or suspend access to our services for any user who violates these terms or engages in fraudulent activity.
                </p>
            </section>
        </InfoLayout>
    );
}
