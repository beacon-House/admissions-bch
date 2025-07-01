/**
 * Header Component v8.0
 * 
 * Purpose: Site navigation header with CTA button tracking using new Meta Pixel events.
 * 
 * Changes made:
 * - Updated to use new Meta Pixel event tracking system
 * - Implemented CTA_HEADER event firing
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { fireCTAEvents } from '@/lib/pixel';

interface HeaderProps {
  onEvaluation?: () => void;
  showCTA?: boolean;
}

export function Header({ onEvaluation, showCTA = true }: HeaderProps) {
  const navigate = useNavigate();
  const [showMobileCTA, setShowMobileCTA] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleCTAClick = () => {
    // FIRE META PIXEL CTA HEADER EVENT
    fireCTAEvents('header', { 
      button: 'header_request_evaluation',
      device_type: isMobile ? 'mobile' : 'desktop',
      path: window.location.pathname,
      timestamp: new Date().toISOString()
    });
    
    if (onEvaluation) {
      onEvaluation();
    } else {
      navigate('/application-form');
    }
  };

  const scrollToSection = (sectionId: string) => {
    // If we're on the landing page, scroll to the section
    if (window.location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If on a different page, navigate to the landing page with hash
      navigate(`/#${sectionId}`);
    }
  };

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check initially
    checkMobile();
    
    // Add resize listener to update when window changes size
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add scroll listener only on homepage and mobile
  useEffect(() => {
    if (window.location.pathname === '/' && isMobile) {
      const handleScroll = () => {
        const heroCTA = document.querySelector('.hero-cta');
        if (heroCTA) {
          const heroRect = heroCTA.getBoundingClientRect();
          setShowMobileCTA(heroRect.bottom < 0);
        }
      };

      window.addEventListener('scroll', handleScroll);
      
      // Run once on mount to check initial position
      handleScroll();
      
      return () => window.removeEventListener('scroll', handleScroll);
    } else {
      // If we're not on the homepage or not on mobile, reset the state
      setShowMobileCTA(false);
    }
  }, [isMobile]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <img 
                src="/bh ig logo.png"
                alt="Beacon House"
                className="h-12 w-auto"
              />
            </Link>

            {/* Navigation - Desktop only */}
            <nav className="hidden lg:flex items-center space-x-8">
              {[
                { name: 'Why Choose Us', href: 'why-us' },
                { name: 'Success Rates', href: 'success-rates' },
                { name: 'Our Process', href: 'process' },
                { name: 'Services', href: 'services' }
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="text-gray-600 hover:text-primary transition-colors duration-200 font-medium"
                >
                  {item.name}
                </button>
              ))}
            </nav>

            {/* CTA Button - Hide on mobile, show on tablet and up */}
            {showCTA && (
              <button
                onClick={handleCTAClick}
                className="hidden md:inline-flex bg-accent text-primary px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-accent-light transition-all duration-300 text-sm sm:text-base"
              >
                Request an Evaluation
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sticky CTA Button - Only shows after scrolling past hero CTA */}
      {showCTA && showMobileCTA && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 px-4 py-2 bg-white shadow-md mobile-sticky-cta">
          <button
            onClick={handleCTAClick}
            className="w-full bg-accent text-primary py-3 rounded-lg font-semibold hover:bg-accent-light transition-all duration-300 text-sm"
          >
            Request an Evaluation
          </button>
        </div>
      )}
    </>
  );
}