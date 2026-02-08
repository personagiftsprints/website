"use client"

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-12 text-gray-800">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="text-sm text-gray-500">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric"
          })}
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Overview</h2>
        <p>
          Persona Prints & Gifts is committed to protecting your privacy. This
          policy explains how we collect, use, and protect your personal data
          when you use our website and services.
        </p>
        <p>
          By using our website, you agree to the practices described in this
          Privacy Policy.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">2. Data We Collect</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Name and contact details</li>
          <li>Billing and delivery addresses</li>
          <li>Email address and phone number</li>
          <li>Payment and order information</li>
          <li>Uploaded images and personalisation details</li>
          <li>Technical data such as IP address and browser type</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">3. How We Use Your Data</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>To process and fulfil your orders</li>
          <li>To create personalised products</li>
          <li>To communicate with you about orders</li>
          <li>To provide customer support</li>
          <li>To comply with legal obligations</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">4. Data Sharing</h2>
        <p>
          We may share your data with trusted third parties such as payment
          providers and delivery partners, only to the extent necessary to
          provide our services.
        </p>
        <p className="font-medium">
          We do not sell or rent your personal data.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">5. Data Security</h2>
        <p>
          We take reasonable technical and organisational measures to protect
          your personal data, including secure payment processing and access
          controls.
        </p>
        <p>
          While we work to protect your data, you are responsible for keeping
          your account credentials secure.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">6. Your Rights</h2>
        <p>
          Under UK GDPR, you have rights including access, correction, deletion,
          restriction, and objection to processing of your personal data.
        </p>
        <p>
          To exercise your rights, please contact us using the details below.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">7. Cookies</h2>
        <p>
          We use cookies to ensure proper website functionality and improve user
          experience. You can control cookies through your browser settings.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">8. Children’s Privacy</h2>
        <p>
          Our website is not intended for individuals under 18 years of age. We
          do not knowingly collect data from children.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">9. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. Changes will be published
          on this page with an updated revision date.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">10. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or your personal
          data, please contact us:
        </p>

        <address className="not-italic space-y-1">
          <p className="font-medium">Persona Prints & Gifts</p>
          <p>Unit D, The Hive Mall</p>
          <p>27–31 Sankey Street</p>
          <p>Warrington, WA1 1XG</p>
          <p>United Kingdom</p>
          <p>Phone: 01925 949939</p>
          <p>
            Email:{" "}
            <a
              href="mailto:privacy@personaprintsandgifts.co.uk"
              className="underline"
            >
              privacy@personaprintsandgifts.co.uk
            </a>
          </p>
        </address>
      </section>

      <footer className="pt-8 border-t text-sm text-gray-500">
        © {new Date().getFullYear()} Persona Prints & Gifts
      </footer>
    </div>
  )
}
