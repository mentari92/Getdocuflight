import InfoLayout from "@/components/info/InfoLayout";

export default function AboutPage() {
    return (
        <InfoLayout title="About Us">
            <p>
                Welcome to <strong>GetDocuFlight</strong>, your trusted partner in simplifying the visa application process.
                We combine advanced technology with deep industry knowledge to help travelers navigate the complexities of international travel documentation.
            </p>

            <h2 className="text-2xl font-bold text-heading mt-8 mb-4">Our Mission</h2>
            <p>
                Our mission is to reduce the stress and uncertainty of visa applications.
                By providing AI powered predictions and verified travel reservations, we empower travelers to apply with confidence and clarity.
            </p>

            <h2 className="text-2xl font-bold text-heading mt-8 mb-4">Our Technology</h2>
            <p>
                We leverage state of the art AI models to analyze your specific situation and provide accurate approval predictions.
                Our system is built with privacy and security at its core, ensuring your data is protected and handled according to global standards like GDPR.
            </p>

            <h2 className="text-2xl font-bold text-heading mt-8 mb-4">Why Choose Us?</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li><strong>Confidence:</strong> Know your chances before you spend time and money on official applications.</li>
                <li><strong>Speed:</strong> Get your verified reservations and AI analysis typically within 24 hours.</li>
                <li><strong>Security:</strong> We use industry standard encryption and data deletion policies to keep your information safe.</li>
            </ul>
        </InfoLayout>
    );
}
