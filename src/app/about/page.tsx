import InfoLayout from "@/components/info/InfoLayout";

export default function AboutPage() {
    return (
        <InfoLayout title="About Us">
            <p>
                Welcome to <strong>GetDocuFlight</strong>, your professional partner in streamlining the visa application process through advanced digital analysis.
                We combine artificial intelligence with deep industry data to help travelers organize their international travel documentation efficiently.
            </p>

            <h2 className="text-2xl font-bold text-heading mt-8 mb-4">Our Mission</h2>
            <p>
                Our mission is to reduce the uncertainty of visa applications through data-driven insights.
                By providing AI-powered predictive analysis and professional itinerary planning assistance, we empower travelers to prepare their documentation with precision.
            </p>

            <h2 className="text-2xl font-bold text-heading mt-8 mb-4">Our Technology</h2>
            <p>
                We leverage state of the art AI models to analyze your specific situation and provide accurate approval predictions.
                Our system is built with privacy and security at its core, ensuring your data is protected and handled according to global standards like GDPR.
            </p>

            <h2 className="text-2xl font-bold text-heading mt-8 mb-4">Why Choose Us?</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li><strong>Accuracy:</strong> Understand your approval probability before committing significantly to official processes.</li>
                <li><strong>Efficiency:</strong> Receive your digital itinerary plans and AI analysis typically within 1–2 working hours.</li>
                <li><strong>Security:</strong> We employ enterprise-grade encryption and strict data management to ensure your private information remains yours.</li>
            </ul>
        </InfoLayout>
    );
}
