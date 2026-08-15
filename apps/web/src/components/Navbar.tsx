"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Menu, ChevronDown, Phone, Mail, Clock, X } from 'lucide-react';
import { FaInstagram, FaFacebook, FaYoutube, FaLinkedin, FaTiktok } from 'react-icons/fa';
import { destinations } from '@/data/destinations';
import { useState } from 'react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileDestinationsOpen, setIsMobileDestinationsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full shadow-md relative bg-white">
      {/* Top Bar - Hidden on mobile to save space */}
      <div className="hidden md:block w-full bg-primary text-gray-100 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-white" fill="currentColor" />
              <a href="https://wa.me/923217777897" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-[#8dc63f] transition-colors">+92 321 7777 897</a>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-white" fill="currentColor" />
              <a href="mailto:admissions@keyabroad.com" className="hover:text-[#8dc63f] transition-colors font-medium">admissions@keyabroad.com</a>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-white" />
              <span className="font-medium">10:00 AM - 6:00 PM (Sunday Off)</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <a href="https://www.instagram.com/keyabroad/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#8dc63f] transition-colors" aria-label="Instagram"><FaInstagram size={16} /></a>
            <a href="https://www.facebook.com/keyabroad/#" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#8dc63f] transition-colors" aria-label="Facebook"><FaFacebook size={16} /></a>
            <a href="https://www.youtube.com/@KeyAbroad" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#8dc63f] transition-colors" aria-label="YouTube"><FaYoutube size={16} /></a>
            <a href="https://www.linkedin.com/company/keyabroad/?originalSubdomain=pk" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#8dc63f] transition-colors" aria-label="LinkedIn"><FaLinkedin size={16} /></a>
            <a href="https://www.tiktok.com/@keyabroad" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#8dc63f] transition-colors" aria-label="TikTok"><FaTiktok size={16} /></a>
          </div>
        </div>
      </div>
      
      {/* Bottom Main Area */}
      <div className="relative w-full bg-white">
        {/* Green angled background on the right */}
        <div 
          className="hidden md:block absolute top-0 right-0 h-full w-[calc(100%-230px)] lg:w-[calc(100%-270px)] bg-secondary"
          style={{ clipPath: 'polygon(40px 0, 100% 0, 100% 100%, 0 100%)' }}
        ></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo area */}
            <div className="flex-shrink-0 flex items-center bg-white pr-4 h-full relative z-20">
              <Link href="/">
                <Image 
                  src="/keyabroad-with-tagline.png" 
                  alt="KeyAbroad Logo" 
                  width={220} 
                  height={70} 
                  className="h-10 md:h-12 w-auto object-contain"
                  priority
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-grow justify-end lg:justify-center space-x-3 xl:space-x-6 items-center h-full relative z-20 pl-4 lg:pl-10">
              <Link href="/" className="text-white hover:text-blue-100 transition-colors font-bold text-[14px] xl:text-[15px]">Home</Link>
              <Link href="/counseling" className="text-white hover:text-blue-100 transition-colors font-bold text-[14px] xl:text-[15px]">Counseling</Link>
              <Link href="/language-tests" className="text-white hover:text-blue-100 transition-colors font-bold text-[14px] xl:text-[15px] whitespace-nowrap">Language Tests</Link>
              
              <div className="relative group h-full flex items-center">
                <Link href="/destinations" className="text-white group-hover:text-[#8dc63f] transition-colors font-bold text-[14px] xl:text-[15px] flex items-center py-2">
                  Destinations <ChevronDown className="ml-1 w-4 h-4" />
                </Link>
                <div className="absolute top-full mt-[-8px] left-[-20px] w-56 bg-white rounded-b-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 max-h-[500px] overflow-y-auto border border-slate-100 z-50">
                  <div className="py-4 flex flex-col">
                    {destinations.map((dest) => (
                      <Link 
                        key={dest.id} 
                        href={`/destinations/${dest.id}`}
                        className="px-8 py-3 text-[15px] font-bold text-slate-800 hover:text-[#8dc63f] hover:bg-slate-50 transition-colors block"
                      >
                        {dest.name === "United Kingdom" ? "UK" : dest.name === "United States" || dest.name === "USA" ? "USA" : dest.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* More Dropdown */}
              <div className="relative group h-full flex items-center">
                <button className="text-white group-hover:text-[#8dc63f] transition-colors font-bold text-[14px] xl:text-[15px] flex items-center py-2 outline-none">
                  More <ChevronDown className="ml-1 w-4 h-4" />
                </button>
                <div className="absolute top-full mt-[-8px] left-[-20px] w-48 bg-white rounded-b-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-slate-100 z-50">
                  <div className="py-4 flex flex-col">
                    <Link href="/about" className="px-6 py-3 text-[15px] font-bold text-slate-800 hover:text-[#8dc63f] hover:bg-slate-50 transition-colors block">About Us</Link>
                    <Link href="/services" className="px-6 py-3 text-[15px] font-bold text-slate-800 hover:text-[#8dc63f] hover:bg-slate-50 transition-colors block">Premium Services</Link>
                    <Link href="/scholarships" className="px-6 py-3 text-[15px] font-bold text-slate-800 hover:text-[#8dc63f] hover:bg-slate-50 transition-colors block">Scholarships</Link>
                    <Link href="/compare" className="px-6 py-3 text-[15px] font-bold text-slate-800 hover:text-[#8dc63f] hover:bg-slate-50 transition-colors block">Compare Programs</Link>
                    <Link href="/cost-calculator" className="px-6 py-3 text-[15px] font-bold text-slate-800 hover:text-[#8dc63f] hover:bg-slate-50 transition-colors block">Cost Calculator</Link>
                    <Link href="/ai-advisor" className="px-6 py-3 text-[15px] font-bold text-slate-800 hover:text-[#8dc63f] hover:bg-slate-50 transition-colors block">AI Matcher</Link>
                    <Link href="/teams" className="px-6 py-3 text-[15px] font-bold text-slate-800 hover:text-[#8dc63f] hover:bg-slate-50 transition-colors block">Team</Link>
                    <Link href="/careers" className="px-6 py-3 text-[15px] font-bold text-slate-800 hover:text-[#8dc63f] hover:bg-slate-50 transition-colors block">Careers</Link>
                    <Link href="/walk-in" className="px-6 py-3 text-[15px] font-bold text-slate-800 hover:text-[#8dc63f] hover:bg-slate-50 transition-colors block">Office Walk-In</Link>
                    <Link href="/blog" className="px-6 py-3 text-[15px] font-bold text-slate-800 hover:text-[#8dc63f] hover:bg-slate-50 transition-colors block">Blog</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Us Button */}
            <div className="hidden md:flex flex-shrink-0 items-center pl-4 relative z-20">
              <Link href="/book-appointment" className="px-5 py-2.5 rounded-full bg-white text-secondary hover:bg-slate-100 transition-all font-bold text-[15px] xl:text-base shadow-md hover:shadow-lg whitespace-nowrap">
                Book Appointment
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-800 hover:text-primary transition-colors p-2"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-2xl border-t border-slate-100 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="flex flex-col px-6 py-4 space-y-2">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-800 hover:text-primary hover:bg-slate-50 rounded-lg">Home</Link>
            <Link href="/counseling" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-800 hover:text-primary hover:bg-slate-50 rounded-lg">Counseling</Link>
            <Link href="/language-tests" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-800 hover:text-primary hover:bg-slate-50 rounded-lg">Language Tests</Link>
            
            <div className="px-4 py-2">
              <div className="flex justify-between items-center">
                <Link href="/destinations" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-slate-800 hover:text-primary py-2">
                  Destinations
                </Link>
                <button 
                  onClick={() => setIsMobileDestinationsOpen(!isMobileDestinationsOpen)}
                  className="p-2 text-slate-500 hover:text-primary"
                  aria-label="Toggle destinations"
                >
                  <ChevronDown className={`w-6 h-6 transition-transform ${isMobileDestinationsOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              
              {/* Dropdown with scroll */}
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isMobileDestinationsOpen ? 'max-h-[40vh] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
              >
                <div className="pl-4 py-2 flex flex-col space-y-4 border-l-2 border-slate-200 overflow-y-auto max-h-[38vh]">
                  {destinations.map((dest) => (
                    <Link 
                      key={dest.id} 
                      href={`/destinations/${dest.id}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-base font-semibold text-slate-600 hover:text-primary block py-1"
                    >
                      {dest.name === "United Kingdom" ? "UK" : dest.name === "United States" || dest.name === "USA" ? "USA" : dest.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-800 hover:text-primary hover:bg-slate-50 rounded-lg">About Us</Link>
            <Link href="/services" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-800 hover:text-primary hover:bg-slate-50 rounded-lg">Premium Services</Link>
            <Link href="/scholarships" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-800 hover:text-primary hover:bg-slate-50 rounded-lg">Scholarships</Link>
            <Link href="/compare" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-800 hover:text-primary hover:bg-slate-50 rounded-lg">Compare Programs</Link>
            <Link href="/cost-calculator" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-800 hover:text-primary hover:bg-slate-50 rounded-lg">Cost Calculator</Link>
            <Link href="/ai-advisor" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-800 hover:text-primary hover:bg-slate-50 rounded-lg">AI Matcher</Link>
            <Link href="/teams" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-800 hover:text-primary hover:bg-slate-50 rounded-lg">Team</Link>
            <Link href="/careers" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-800 hover:text-primary hover:bg-slate-50 rounded-lg">Careers</Link>
            <Link href="/walk-in" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-800 hover:text-primary hover:bg-slate-50 rounded-lg">Office Walk-In</Link>
            <Link href="/blog" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-bold text-slate-800 hover:text-primary hover:bg-slate-50 rounded-lg">Blog</Link>
            <div className="pt-4 pb-2">
              <Link href="/#contact" onClick={() => setIsMobileMenuOpen(false)} className="block w-full px-4 py-4 text-center text-lg font-bold text-white bg-primary rounded-xl shadow-md hover:bg-secondary transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
