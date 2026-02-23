import InfoLayout from "@/components/info/InfoLayout";

export default function ContactPage() {
    return (
        <InfoLayout title="Contact Us">
            <p>
                Have questions about your visa prediction or dummy ticket order? We are here to help.
                Our support team is available during standard business hours to assist you.
            </p>

            <div className="bg-primary-50 border border-primary/20 rounded-2xl p-8 mt-10">
                <h2 className="text-xl font-bold text-heading mb-4">Live Support</h2>
                <p className="text-body mb-6">
                    The fastest way to get help is through our <strong>Live Chat</strong> widget,
                    available in the bottom right corner of our website.
                    Our agents are typically online from 9:00 AM to 6:00 PM (GMT+7).
                </p>
                <button className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all">
                    Open Live Chat
                </button>
            </div>

            <div className="mt-12 space-y-8">
                <div>
                    <h3 className="text-lg font-bold text-heading">Email Support</h3>
                    <p className="text-body">
                        For general inquiries or bulk orders, please email us at: <br />
                        <a href="mailto:support@getdocuflight.com" className="text-primary font-bold hover:underline">support@getdocuflight.com</a>
                    </p>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-heading">Operating Hours</h3>
                    <p className="text-body">
                        Monday – Friday: 9:00 AM – 6:00 PM (GMT+7)<br />
                        Saturday: 10:00 AM – 2:00 PM (GMT+7)<br />
                        Sunday: Closed
                    </p>
                </div>
            </div>
        </InfoLayout>
    );
}
