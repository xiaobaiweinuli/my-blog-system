"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  avatarUrl: string;
  footerText: string;
  socialLinks?: { twitter?: string; github?: string; linkedin?: string };
  keywords?: string;
  ogImage?: string;
  favicon?: string;
  robots?: string;
  [key: string]: any;
}

const defaultSettings: SiteSettings = {
  siteTitle: '',
  siteDescription: '',
  avatarUrl: '',
  footerText: '',
  socialLinks: { twitter: '', github: '', linkedin: '' },
  keywords: '',
  ogImage: '',
  favicon: '',
  robots: '',
};

export const SettingsContext = createContext<SiteSettings>(defaultSettings);

export function useSettings() {
  return useContext(SettingsContext);
}

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    const cached = sessionStorage.getItem('siteSettings');
    if (cached) {
      setSettings(JSON.parse(cached));
    }
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        sessionStorage.setItem('siteSettings', JSON.stringify(data));
      });
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}; 