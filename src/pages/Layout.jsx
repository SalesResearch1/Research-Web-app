

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, LayoutDashboard, BookCheck, Calculator, Search, Menu, X, HelpCircle, TrendingUp, Database } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { User } from "@/api/entities";
import { useEffect as useLayoutEffect } from 'react';
import { logPageVisit } from '@/components/utils/analytics';

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    title: "Safety Analyses",
    url: createPageUrl("SafetyAnalyses"),
    icon: BookCheck,
    adminOnly: false,
  },
  {
    title: "Regulatory Search",
    url: createPageUrl("RegulatorySearch"),
    icon: Search,
    adminOnly: false,
  },
  {
    title: "Calculators",
    url: createPageUrl("Calculators"),
    icon: Calculator,
    adminOnly: false,
  },
  {
    title: "Data Management",
    url: createPageUrl("DataManagement"),
    icon: Database,
    adminOnly: false,
  },
  {
    title: "Training & Help",
    url: createPageUrl("Training"),
    icon: HelpCircle,
    adminOnly: false,
  },
  {
    title: "Analytics",
    url: createPageUrl("Analytics"),
    icon: TrendingUp,
    adminOnly: true,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [visibleNavItems, setVisibleNavItems] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      setVisibleNavItems(navigationItems);
    } else {
      setVisibleNavItems(navigationItems.filter(item => !item.adminOnly));
    }
  }, [user]);

  // Log page visits
  useLayoutEffect(() => {
    if (currentPageName && user) {
      logPageVisit(currentPageName);
    }
  }, [currentPageName, user]);

  const isActive = (url) => {
    return location.pathname === url;
  };
  
  return (
    <div className="flex h-screen bg-slate-100">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex w-64 bg-white shadow-sm border-r border-slate-200 flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-slate-200">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">EHS Insight</h1>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Navigation</h2>
            <div className="space-y-1">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.url)
                      ? "bg-slate-200 text-slate-900 font-semibold"
                      : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header - Only visible on mobile/tablet */}
        <div className="lg:hidden bg-white shadow-sm border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900">EHS Insight</h1>
          </div>
          
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-slate-900">EHS Insight</h1>
              </div>
              
              <div className="space-y-2">
                {visibleNavItems.map((item) => (
                  <SheetClose asChild key={item.title}>
                    <Link
                      to={item.url}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors w-full ${
                        isActive(item.url)
                          ? "bg-slate-200 text-slate-900 font-semibold"
                          : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.title}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

