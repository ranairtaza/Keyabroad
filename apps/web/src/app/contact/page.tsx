"use client";

import { MapPin, Mail, Phone, Clock, ArrowRight } from "lucide-react";
import { Button } from "@keyabroad/ui/components/button";
import { Input } from "@keyabroad/ui/components/input";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 font-heading">Get in Touch</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Have questions about studying abroad? Our expert counselors are here to help you every step of the way.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information & Location */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 font-heading">Our Location</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <a href="https://www.google.com/maps/search/?api=1&query=54+Ali+Rd,+Kohinoor+City,+Faisalabad,+38000,+Pakistan" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 mr-4 hover:bg-blue-100 transition-colors" aria-label="View on Google Maps">
                    <MapPin />
                  </a>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Head Office</h3>
                    <p className="text-slate-600">54 Ali Rd, Kohinoor City<br />Faisalabad, 38000<br />Pakistan</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <a href="tel:+923217777897" className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0 mr-4 hover:bg-green-100 transition-colors">
                    <Phone />
                  </a>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Phone / WhatsApp</h3>
                    <a href="tel:+923217777897" className="text-slate-600 hover:text-green-600 transition-colors">+92 321 7777 897</a>
                  </div>
                </div>
                <div className="flex items-start">
                  <a href="mailto:admissions@keyabroad.com" className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0 mr-4 hover:bg-purple-100 transition-colors">
                    <Mail />
                  </a>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Email Address</h3>
                    <a href="mailto:admissions@keyabroad.com" className="text-slate-600 hover:text-purple-600 transition-colors">admissions@keyabroad.com</a>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0 mr-4">
                    <Clock />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Office Hours</h3>
                    <p className="text-slate-600">Monday - Saturday: 10:00 AM - 6:00 PM<br />Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Map (Location Form Visual) */}
            <div className="bg-slate-200 rounded-3xl overflow-hidden h-[300px] shadow-inner relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3405.021575281729!2d73.1118151!3d31.4135515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3922687a414e2d31%3A0x6b776269b2d6a50b!2sKohinoor%20City%2C%20Faisalabad!5e0!3m2!1sen!2spk!4v1695627194642!5m2!1sen!2spk"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
              ></iframe>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 font-heading">Send us a Message</h2>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Message sent successfully! We will get back to you soon."); }}>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                  <Input placeholder="John" className="h-12 bg-slate-50 border-slate-200" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                  <Input placeholder="Doe" className="h-12 bg-slate-50 border-slate-200" required />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <Input type="email" placeholder="john@example.com" className="h-12 bg-slate-50 border-slate-200" required />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                <Input type="tel" placeholder="+92 300 0000000" className="h-12 bg-slate-50 border-slate-200" required />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your Message</label>
                <textarea 
                  className="w-full min-h-[150px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="How can we help you?"
                  required
                ></textarea>
              </div>
              
              <Button type="submit" size="lg" className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/25">
                Send Message <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
