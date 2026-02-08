"use client"

export default function TermsAndConditions() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      {/* Disclaimer Section */}
      <section className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-yellow-800">Important Disclaimer</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p className="font-semibold mb-2">
                Disclaimer: In case of any discrepancy or difference, the English version will take precedence over any translation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Electronic Record Declaration */}
      <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Electronic Record Declaration</h2>
        <div className="space-y-4 text-gray-700">
          <p>
            This document is an electronic record in terms of the applicable laws and does not require any physical or digital signatures.
          </p>
          <p>
            This document is published in accordance with the provisions that require publishing the rules and regulations, privacy policy and Terms of Use for access or usage of this website.
          </p>
          <p>
            Your use of this website and services are governed by the following terms and conditions ("Terms of Use"). By using this website, you agree to be bound by these terms and conditions.
          </p>
          <p className="font-medium mt-4">
            ACCESSING, BROWSING OR OTHERWISE USING THIS SITE INDICATES YOUR AGREEMENT TO ALL THE TERMS AND CONDITIONS UNDER THESE TERMS OF USE, SO PLEASE READ THEM CAREFULLY BEFORE PROCEEDING.
          </p>
        </div>
      </section>

      {/* Membership Eligibility */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Membership Eligibility</h2>
        <div className="space-y-3 text-gray-700">
          <p>
            Transaction on this website is available only to persons who can form legally binding contracts. 
            Persons who are "incompetent to contract" including un-discharged insolvents etc. are not eligible to use this website.
          </p>
          <p>
            If you are a minor i.e. under the age of 18 years, you may use this website or access content only under the 
            supervision and prior consent/permission of a parent or legal guardian.
          </p>
          <p>
            As a minor if you wish to transact on this website, such transaction may be made by your legal guardian or parents. 
            We reserve the right to terminate your access if it is discovered that you are under the age of 18 years and 
            transacting without proper supervision.
          </p>
        </div>
      </section>

      {/* Account and Registration Obligations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Your Account and Registration Obligations</h2>
        <div className="space-y-3 text-gray-700">
          <p>
            If you use this website, you shall be responsible for maintaining the confidentiality of your account 
            information and for all activities that occur under your account.
          </p>
          <p>
            You agree to provide true, accurate, current and complete information. We reserve the right to 
            suspend or terminate your account if we have reasonable grounds to suspect that the information 
            provided is untrue, inaccurate, or not in accordance with these Terms of Use.
          </p>
          <p>
            You must maintain confidentiality of your login credentials and not share them with any other person. 
            You agree to ensure that you log out from your account at the end of each session and immediately 
            notify us of any unauthorized use of your account.
          </p>
          <p>
            We shall not be liable for any loss or damage arising from your failure to comply with these security obligations.
          </p>
        </div>
      </section>

      {/* Main Terms Sections */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">About Us</h2>
        <p>
          This website is operated by <strong>Persona Prints & Gifts</strong>.
        </p>

        <div className="space-y-1">
          <p className="font-medium">Business Address</p>
          <address className="not-italic">
            Persona Prints & Gifts<br />
            Unit D, The Hive Mall<br />
            27-31 Sankey Street<br />
            Warrington<br />
            WA1 1XG<br />
            United Kingdom
          </address>
          <p>
            <strong>Contact Number:</strong> 01925 949939
          </p>
        </div>

        <p className="font-medium">
          By using our website and placing an order, you agree to these Terms & Conditions.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Products & Personalisation</h2>
        <ul className="space-y-2 list-disc list-inside">
          <li>We sell personalised and printed gift items made to order.</li>
          <li>Images are for illustration purposes only.</li>
          <li>
            <strong>You are responsible</strong> for ensuring all personalisation details are correct.
          </li>
          <li>Personalisation details cannot be changed after ordering.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Ordering & Acceptance</h2>
        <ul className="space-y-2 list-disc list-inside">
          <li>Orders are placed online through our website.</li>
          <li>You will receive an order confirmation email.</li>
          <li>An order is accepted once production begins or dispatch occurs.</li>
          <li>We may cancel orders due to errors or availability.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Prices & Payment</h2>
        <ul className="space-y-2 list-disc list-inside">
          <li>All prices are in GBP (£).</li>
          <li>We are not VAT registered.</li>
          <li>Payment is required at checkout.</li>
          <li>Price changes do not affect placed orders.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Delivery</h2>
        <ul className="space-y-2 list-disc list-inside">
          <li>Delivery times are estimates.</li>
          <li>We are not responsible for courier delays.</li>
          <li>Responsibility passes on delivery.</li>
        </ul>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Returns & Refunds</h2>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Personalised Items</h3>
          <p>
            Personalised items are <strong>non-refundable</strong> unless faulty or incorrect.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Faulty or Incorrect Items</h3>
          <ol className="space-y-1 list-decimal list-inside">
            <li>Contact us within 48 hours</li>
            <li>Provide your order number</li>
            <li>Provide photographic evidence</li>
          </ol>
          <p>We will offer a replacement or refund where appropriate.</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Non-Personalised Items</h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>Return within 14 days</li>
            <li>Items must be unused</li>
            <li>Return postage is the customer's responsibility</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Cancellations</h2>
        <ul className="space-y-2 list-disc list-inside">
          <li>Personalised orders cannot be cancelled after production starts.</li>
          <li>Non-personalised orders may be cancelled before dispatch.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Intellectual Property</h2>
        <p>
          All website content is the property of Persona Prints & Gifts and may not be reused without permission.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Liability</h2>
        <ul className="space-y-2 list-disc list-inside">
          <li>No liability for indirect losses.</li>
          <li>Liability is limited to the order value.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Privacy & Data Protection</h2>
        <p>
          We process personal data in accordance with UK GDPR.
        </p>
        <p>
          See our{" "}
          <a href="/privacy" className="underline hover:text-blue-700 transition-colors">
            Privacy Policy
          </a>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Governing Law</h2>
        <p>
          These terms are governed by the laws of England and Wales, and any disputes shall be subject to 
          the exclusive jurisdiction of the courts of England and Wales.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Contact Us</h2>
        <p>If you have questions, contact us:</p>

        <div className="space-y-1">
          <p className="font-medium">Persona Prints & Gifts</p>
          <address className="not-italic">
            Unit D, The Hive Mall<br />
            27-31 Sankey Street<br />
            Warrington<br />
            WA1 1XG<br />
            United Kingdom
          </address>
          <p>Phone: 01925 949939</p>
          <p>
            Email:{" "}
            <a
              href="mailto:info@personaprintsandgifts.co.uk"
              className="underline hover:text-blue-700 transition-colors"
            >
              info@personaprintsandgifts.co.uk
            </a>
          </p>
        </div>
      </section>

      {/* Final Acceptance Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
        <div className="text-center">
          <p className="font-bold text-lg text-blue-800 mb-2">
            By using our website and placing an order, you acknowledge that:
          </p>
          <ul className="text-blue-700 space-y-2">
            <li>✓ You have read, understood, and agree to be bound by these Terms & Conditions</li>
            <li>✓ This is an electronic record and does not require physical signature</li>
            <li>✓ You are eligible to enter into legally binding contracts</li>
            <li>✓ All information provided by you is true and accurate</li>
          </ul>
        </div>
      </div>

      <div className="pt-6 text-sm text-gray-500 text-center border-t border-gray-200">
        <p>
          Last Updated: {new Date().toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </p>
      </div>
    </div>
  )
}