import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="bg-[#e0dac9]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="hover:text-white">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-white">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-white">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><Link to="/About_Us" className="hover:text-white">About Us</Link></li>
              <li><Link to="/terms" className="hover:text-white">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/rental-policy" className="hover:text-white">Renting Policy</Link></li>
              <li><Link to="/faqs" className="hover:text-white">FAQs</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li><Link className="hover:text-white">Fiction</Link></li>
              <li><Link className="hover:text-white">Non-Fiction</Link></li>
              <li><Link className="hover:text-white">Academic</Link></li>
              <li><Link className="hover:text-white">History</Link></li>
              <li><Link className="hover:text-white">Self-Help Book</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <MapPin size={16} />
                <span>Pokhara</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone size={16} />
                <span>+977 9876543210</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail size={16} />
                <span>customersupport@bookhub.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Separator className="bg-gray-800 w-4/5" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-4">
        <p className="text-center">
          © {new Date().getFullYear()} BookHub. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;