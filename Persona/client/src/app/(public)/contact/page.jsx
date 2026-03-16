"use client"

import { useState } from "react"
import Navbar from "@/components/common/Navbar"
import Footer from "@/components/common/Footer"
import { Mail, Phone, MapPin, MessageCircle, Clock, Instagram } from "lucide-react"

const CONTACT_INFO = {
  whatsapp: {
    number: "+44 7436 131651",
    link: "https://wa.me/447436131651?text=Hello%20Persona%20Gifts!%20I%20have%20a%20query.",
  },
  email: "personagiftsprints@gmail.com",
  phone: "01925 949939",
  instagram: {
    handle: "@persona_gifts_prints",
    link: "https://www.instagram.com/persona_gifts_prints",
  },
  facebook: {
    name: "Persona Gifts & Prints",
    link: "https://www.facebook.com/people/Persona-Gifts-Prints/61585190722463",
  },
  address: {
    line1: "The Hive Mall, Unit D",
    line2: "27–31 Sankey Street, Warrington",
    line3: "WA1 1XG, United Kingdom",
  },
 hours: "Monday – Saturday: 9:30 AM – 4:30 PM",
}

function ContactCard({ icon: Icon, title, children, href, color }) {
  const Wrapper = href ? "a" : "div"
  const linkProps = href
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : {}

  return (
    <Wrapper
      {...linkProps}
      className={`group relative flex flex-col items-center text-center p-6 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 ${
        href ? "cursor-pointer hover:-translate-y-1" : ""
      }`}
    >
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${color}`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-gray-900 text-lg mb-1">{title}</h3>
      <div className="text-gray-500 text-sm leading-relaxed">{children}</div>
    </Wrapper>
  )
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleWhatsAppSend = (e) => {
    e.preventDefault()
    const text = `Hi Persona Gifts!%0A%0AName: ${form.name}%0AEmail: ${form.email}%0ASubject: ${form.subject}%0A%0AMessage: ${form.message}`
    window.open(`https://wa.me/447436131651?text=${text}`, "_blank")
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-50">
      

      {/* Hero */}
      <div className="w-full bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest text-[#f9a51b] uppercase mb-3">
            Get In Touch
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-orange-500 mb-3">
            We'd Love to Hear From You
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-base">
            Have a question about our personalised gifts? Need help with an order?
            Reach out to us through any of the channels below.
          </p>
        </div>
      </div>

      {/* Contact Cards */}
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-6 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <ContactCard
            icon={MessageCircle}
            title="WhatsApp"
            href={CONTACT_INFO.whatsapp.link}
            color="bg-[#25D366]"
          >
            <p>{CONTACT_INFO.whatsapp.number}</p>
            <p className="text-green-600 font-medium text-xs mt-1">
              Tap to chat instantly →
            </p>
          </ContactCard>

          <ContactCard
            icon={Mail}
            title="Email Us"
            href={`mailto:${CONTACT_INFO.email}`}
            color="bg-red-500"
          >
            <p>{CONTACT_INFO.email}</p>
            <p className="text-gray-400 text-xs mt-1">We reply within 24 hours</p>
          </ContactCard>

          <ContactCard
            icon={Phone}
            title="Call Us"
            href={`tel:${CONTACT_INFO.phone.replace(/\s/g, "")}`}
            color="bg-blue-500"
          >
            <p>{CONTACT_INFO.phone}</p>
            <p className="text-gray-400 text-xs mt-1">Mon–Sat, 9AM–7PM GMT</p>
          </ContactCard>

          <ContactCard
            icon={Instagram}
            title="Instagram"
            href={CONTACT_INFO.instagram.link}
            color="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
          >
            <p>{CONTACT_INFO.instagram.handle}</p>
            <p className="text-pink-500 font-medium text-xs mt-1">
              Follow us for updates →
            </p>
          </ContactCard>

          <ContactCard
            icon={MapPin}
            title="Our Location"
            color="bg-[#f9a51b]"
          >
            <p>{CONTACT_INFO.address.line1}</p>
            <p>{CONTACT_INFO.address.line2}</p>
            <p>{CONTACT_INFO.address.line3}</p>
          </ContactCard>

         <ContactCard icon={Clock} title="Working Hours" color="bg-gray-800">
  <p>{CONTACT_INFO.hours}</p>
  <p className="text-gray-400 text-xs mt-1">Sunday: 10:00 AM – 3:00 PM</p>
</ContactCard>
        </div>
      </div>

 
      {/* Google Maps Embed */}
      <div className="max-w-5xl mx-auto px-4 pb-14 w-full">
        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <iframe
            title="Persona Gifts Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2379.453127158361!2d-2.5982001870403275!3d53.38883377218601!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487b037b8977f7ff%3A0xd2859041811eb41e!2sPersona%20Gifts%20%26%20Prints!5e0!3m2!1sen!2sus!4v1772114399028!5m2!1sen!2sus"
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

   
    </div>
  )
}