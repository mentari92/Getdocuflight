import InfoLayout from "@/components/info/InfoLayout";

export default function RefundPolicyPage() {
    return (
        <InfoLayout title="Refund and Cancellation Policy">
            <p className="text-sm border-b border-gold-border pb-4 mb-8">Last Updated: February 27, 2026</p>

            <section>
                <h2 className="text-xl font-bold text-heading mb-3">1. Refund Eligibility</h2>
                <p>
                    Due to the instant and personalized nature of our digital advisory and documentation services, refunds are generally not provided once the AI analysis has been generated or the itinerary planning documents have been delivered to the user.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-bold text-heading mb-3">2. Order Cancellations</h2>
                <p>
                    Orders for itinerary planning assistance can be cancelled within 1 hour of purchase, provided that our analysts have not yet begun the manual verification or document preparation process. Once the document is in "Processing" status, it is ineligible for cancellation.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-bold text-heading mb-3">3. Service Issues</h2>
                <p>
                    If you encounter a technical issue or an error with your order, please contact our support team immediately.
                    We will work with you to resolve the issue, which may include re-issuing the service or providing a credit for future use.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-bold text-heading mb-3">4. Visa Rejections</h2>
                <p>
                    Please note that a visa rejection by a government authority is not grounds for a refund.
                    Our services provide support and assessments, but the final outcome is beyond our control.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-bold text-heading mb-3">5. Processing Refunds</h2>
                <p>
                    Approved refunds will be processed back to the original payment method within 5–10 business days.
                </p>
            </section>
        </InfoLayout>
    );
}
