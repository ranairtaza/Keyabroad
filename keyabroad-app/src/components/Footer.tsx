import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Mail, Phone, ArrowRight } from 'lucide-react';
import { FaInstagram, FaFacebook, FaYoutube, FaLinkedin, FaTiktok } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white pt-24 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-5 pr-8">
            <div className="relative h-12 w-48 mb-6">
              <Image 
                src="/keyabroad-with-tagline-white.png" 
                alt="KeyAbroad Logo White" 
                fill 
                className="object-contain"
              />
            </div>
            <p className="text-slate-400 leading-relaxed text-lg max-w-md mb-8">
              Open the door to success. Your trusted partner for overseas education, admissions, and visas.
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/keyabroad/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-secondary transition-all" aria-label="Instagram">
                <FaInstagram size={18} />
              </a>
              <a href="https://www.facebook.com/keyabroad/#" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-secondary transition-all" aria-label="Facebook">
                <FaFacebook size={18} />
              </a>
              <a href="https://www.youtube.com/@KeyAbroad" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-secondary transition-all" aria-label="YouTube">
                <FaYoutube size={18} />
              </a>
              <a href="https://www.linkedin.com/company/keyabroad/?originalSubdomain=pk" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-secondary transition-all" aria-label="LinkedIn">
                <FaLinkedin size={18} />
              </a>
              <a href="https://www.tiktok.com/@keyabroad" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-secondary transition-all" aria-label="TikTok">
                <FaTiktok size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-white mb-8">Quick Links</h3>
            <ul className="space-y-4">
              {[
                { name: 'Home', href: '/' },
                { name: 'Services', href: '/services' },
                { name: 'Language Tests', href: '/language-tests' },
                { name: 'Destinations', href: '/destinations' },
                { name: 'About Us', href: '/about' },
                { name: 'Team', href: '/teams' },
                { name: 'Blog', href: '/blog' }
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href} 
                    className="text-slate-400 hover:text-white transition-all flex items-center group w-fit"
                  >
                    <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 mr-2 transition-all text-secondary" />
                    <span className="group-hover:translate-x-1 transition-transform">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div className="lg:col-span-4">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-white mb-8">Contact Us</h3>
            <ul className="space-y-6">
              <li className="flex items-start group">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mr-4 flex-shrink-0 group-hover:bg-slate-700 transition-colors">
                  <MapPin className="text-secondary" size={18} />
                </div>
                <span className="text-slate-400 mt-2 leading-relaxed">54 Ali Rd, Kohinoor City Faisalabad, 38000, Pakistan</span>
              </li>
              <li className="flex items-center group">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mr-4 flex-shrink-0 group-hover:bg-slate-700 transition-colors">
                  <Mail className="text-secondary" size={18} />
                </div>
                <a href="mailto:admissions@keyabroad.com" className="text-slate-400 hover:text-white transition-colors mt-1">
                  admissions@keyabroad.com
                </a>
              </li>
              <li className="flex items-center group">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mr-4 flex-shrink-0 group-hover:bg-slate-700 transition-colors">
                  <Phone className="text-secondary" size={18} />
                </div>
                <a href="https://wa.me/923217777897" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors mt-1">
                  +92 321 7777 897
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8 mt-12 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} KeyAbroad. All rights reserved.</p>
          <div className="flex gap-6"></div>
        </div>
      </div>
    </footer>
  );
}
