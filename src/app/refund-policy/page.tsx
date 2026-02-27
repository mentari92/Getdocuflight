import InfoLayout from "@/components/info/InfoLayout";

export default function RefundPolicyPage() {
    return (
        <InfoLayout title="Refund and Cancellation Policy">
            <p className="text-sm border-b border-gold-border pb-4 mb-8">Last Updated: February 28, 2026</p>

            <section>
                <h2 className="text-xl font-bold text-heading mb-3">1. Refund Eligibility</h2>
                <p>
                    Due to the instant and personalized nature of our digital advisory and documentation services, refunds are generally not provided once the AI analysis has been generated or the itinerary planning documents have been delivered to the user. However, if we fail to deliver the requested itinerary documents within the agreed timeframe, or if a severe technical error on our end prevents you from accessing our advisory services, you are fully entitled to a refund upon request.
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
                    If you encounter a technical issue or an error with your order, please contact our support team immediately at <strong>support@getdocuflight.com</strong>.
                    We will work with you to resolve the issue promptly, which may include re-processing the service, providing a credit for future use, or processing a full refund if the issue cannot be resolved.
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
