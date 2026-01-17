"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Share2,
  Tag,
  ChevronDown,
} from "lucide-react";

import Logo from "@/assets/logo-colored.png";
import Button from "./components/Button";

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  delay = 0,
}) => (
  <div
    className="group relative bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:bg-gray-800/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">
      <div className="w-12 h-12 bg-gradient-to-bl from-pastel-blue to-accent-blue rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">
        {title}
      </h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  </div>
);



interface FloatingElementProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down";
}

const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  delay = 0,
  direction = "up",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transform transition-all duration-1000 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : direction === "up"
          ? "translate-y-8 opacity-0"
          : "-translate-y-2 opacity-0"
      }`}
    >
      {children}
    </div>
  );
};

const AnimatedBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[#000000]">
        {/* <div
          className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{
            left: mousePosition.x * 0.1 - 192,
            top: mousePosition.y * 0.1 - 192,
          }}
        />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" /> */}
      </div>
      {/* <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" /> */}
    </div>
  );
};

export default function Page() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="flex items-center justify-center min-h-screen text-white bg-black">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="relative w-full min-h-screen text-white overflow-hidden">
      <AnimatedBackground />
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 isolate transition-all duration-300 bg-black backdrop-blur border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={Logo} alt="Snippit Logo" width={80} height={80} />
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/auth/sign-in"
              className="text-gray-200 hover:text-blue-300 transition-colors"
            >
              Sign In
            </Link>

            <Link href="/auth/sign-up">
              <Button variant="custom-blue" size="md">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20">
        <FloatingElement delay={200}>
          <div>
            <Image
              src={Logo}
              alt="Snippit Logo"
              width={120}
              height={120}
              className="mx-auto"
            />
          </div>
        </FloatingElement>

        <FloatingElement delay={400}>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
            Capture. Curate.
            <br />
            <span className="bg-gradient-to-bl from-blue-100 via-pastel-blue to-accent-blue bg-clip-text text-transparent">
              Rediscover.
            </span>
          </h1>
        </FloatingElement>

        <FloatingElement delay={600}>
          <p className="max-w-2xl text-lg text-gray-400 mb-8">
            What you read, hear, and watch shapes you. Snippit helps you keep
            the moments that matter — and find them when they matter most.
          </p>
        </FloatingElement>

        <FloatingElement delay={800}>
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link href="/auth/sign-up">
              <Button
                type="button"
                variant="gradient-blue"
                size="lg"
                className="flex items-center justify-center gap-2"
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </FloatingElement>

        <div className="absolute bottom-4 animate-bounce">
          <ChevronDown className="w-6 h-6 text-gray-400" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-10 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-bl from-blue-100 via-pastel-blue to-accent-blue bg-clip-text text-transparent ">
              From Content Chaos to Curated Clarity
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Snippit streamlines the way you retain, revisit, and share
              insights across content formats — from articles and podcasts to
              films and lectures.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={BookOpen}
              title="Capture Anything"
              description="Clip key moments from movies, podcasts, videos, articles, and more. No more scattered notes."
              delay={200}
            />
            <FeatureCard
              icon={Tag}
              title="Organize Effortlessly"
              description="Tag-based collections with visual card browsing, advanced filtering, and custom collections that grow with you."
              delay={400}
            />
            <FeatureCard
              icon={Share2}
              title="Privacy & Sharing"
              description="Private by default with selective sharing and clean highlight formats."
              delay={600}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-28 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-5xl font-bold mb-8">
            Turn content into lasting knowledge
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Don’t just consume — retain. Snippit transforms your daily content
            into a personalized, searchable knowledge base.
          </p>
          <Link href="/auth/sign-up">
            <Button type="button" variant="gradient-blue" size="lg">
              Start Curating Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative pt-16 px-10 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Image src={Logo} alt="Snippit Logo" width={100} height={100} />
              <p className="text-gray-400 mb-4">
                Transform your content consumption into lasting knowledge.
              </p>
              <div className="flex gap-4">
                {/* Social media icons would go here */}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Integrations
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="py-8 border-t border-gray-800 text-center text-gray-500">
            <p>© {new Date().getFullYear()} Snippit. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
