"use client";
import React from "react";
import {
  MailIcon,
  SmartPhone01Icon,
  MapPinIcon,
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  DribbbleIcon,
  GlobeIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react";
import {FooterBackgroundGradient} from "@/components/ui/hover-footer";
import { TextHoverEffect } from "@/components/ui/hover-footer";

function HoverFooter() {
  // Footer link data
  const footerLinks: Array<{
    title: string
    links: Array<{ label: string; href: string; pulse?: boolean }>
  }> = [
    // {
    //   title: "About Us",
    //   links: [
    //     { label: "Company History", href: "#" },
    //     { label: "Meet the Team", href: "#" },
    //     { label: "Employee Handbook", href: "#" },
    //     { label: "Careers", href: "#" },
    //   ],
    // },
    {
      title: "Helpful Links",
      links: [
        { label: "FAQs", href: "#" },
        { label: "Support", href: "#" },
      ],
    },
  ];

  // Contact info data
  const contactInfo = [
    {
      icon: <HugeiconsIcon icon={MailIcon} size={18} className="text-primary" />,
      text: "mcarreradev12@gmail.com",
      href: "mailto:mcarreradev12@gmail.com",
    },
    {
      icon: <HugeiconsIcon icon={SmartPhone01Icon} size={18} className="text-primary" />,
      text: "+54 1154793056",
      href: "tel:+54 1154793056",
    },
    {
      icon: <HugeiconsIcon icon={MapPinIcon} size={18} className="text-primary" />,
      text: "Buenos Aires, ARG",
    },
  ];

  // Social media icons
  const socialLinks = [
    { icon: <HugeiconsIcon icon={TwitterIcon} size={20} />, label: "Twitter", href: "#" },
    { icon: <HugeiconsIcon icon={GlobeIcon} size={20} />, label: "Globe", href: "#" },
  ];

  return (
    <footer className="border-t-4 border-tertiary relative overflow-hidden w-full bg-background">
      <div className="max-w-7xl mx-auto p-14 z-40 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-8 lg:gap-16 pb-12">
          {/* Brand section */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-primary text-3xl font-extrabold">
                &hearts;
              </span>
              <span className="text-foreground text-3xl font-bold">WaitlistFast</span>
            </div>
            <p className="text-sm leading-relaxed">
              WaitlistFast is a modern React and Next.js based UI component library.
            </p>
          </div>

          {/* Footer link sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-foreground text-lg font-semibold mb-6">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label} className="relative">
                    <a
                      href={link.href}
                      className="hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                    {link.pulse && (
                      <span className="absolute top-0 right-[-10px] w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact section */}
          <div>
            <h4 className="text-foreground text-lg font-semibold mb-6">
              Contact Us
            </h4>
            <ul className="space-y-4">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-center space-x-3">
                  {item.icon}
                  {item.href ? (
                    <a
                      href={item.href}
                      className="hover:text-primary transition-colors"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="hover:text-primary transition-colors">
                      {item.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="border-t border-border my-8" />

        {/* Footer bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm space-y-4 md:space-y-0">
          {/* Social icons */}
          <div className="flex space-x-6 text-muted-foreground">
            {socialLinks.map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="hover:text-primary transition-colors"
              >
                {icon}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} WaitlistFast. All rights reserved.
          </p>
        </div>
      </div>

      {/* Text hover effect */}
      <div className="lg:flex hidden h-[30rem] -mt-52 -mb-36">
        <TextHoverEffect text="WAITLISTFAST" className="z-50" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}

export default HoverFooter;