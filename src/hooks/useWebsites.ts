import { useEffect, useState } from "react";
import { 
  db, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp,
  appId 
} from "../utils/firebase";

export interface WidgetConfig {
  themeMode: "light" | "dark";
  primaryColor: string;
  userBubbleColor: string;
  position: "bottom-right" | "bottom-left";
  borderRadius: number; // 4, 12, 18, 24
  launcherStyle: "circle" | "pill";
  launcherText: string;
  title: string;
  subtitle: string;
  showTimestamps: boolean;
  quickPrompts: string[];
}

export interface Website {
  id: string;
  name: string;
  domain: string;
  themeColor: string;
  welcomeMessage: string;
  config?: Partial<WidgetConfig>;
  createdAt?: any;
}

export const defaultWidgetConfig: WidgetConfig = {
  themeMode: "light",
  primaryColor: "#4f46e5",
  userBubbleColor: "#4f46e5",
  position: "bottom-right",
  borderRadius: 16,
  launcherStyle: "circle",
  launcherText: "Chat with us",
  title: "Live Support",
  subtitle: "Typically replies in a few minutes",
  showTimestamps: true,
  quickPrompts: ["Pricing details", "Talk to an agent", "Report an issue"],
};

export function useWebsites() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const websitesRef = collection(db, "websites");

    const unsubscribe = onSnapshot(websitesRef, async (snapshot) => {
      if (snapshot.empty) {
        // Seed default website if none exists
        const defaultSite: Website = {
          id: appId,
          name: "Main Production Site",
          domain: "example.com",
          themeColor: "#4f46e5",
          welcomeMessage: "Typically replies in a few minutes",
          config: defaultWidgetConfig,
        };
        try {
          await setDoc(doc(db, "websites", appId), {
            ...defaultSite,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          console.error("Failed to seed default website:", err);
        }
        setWebsites([defaultSite]);
      } else {
        const sites: Website[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          sites.push({
            id: docSnap.id,
            name: data.name || "Untitled Website",
            domain: data.domain || "unknown",
            themeColor: data.themeColor || data.config?.primaryColor || "#4f46e5",
            welcomeMessage: data.welcomeMessage || data.config?.subtitle || "Typically replies in a few minutes",
            config: {
              ...defaultWidgetConfig,
              primaryColor: data.themeColor || defaultWidgetConfig.primaryColor,
              subtitle: data.welcomeMessage || defaultWidgetConfig.subtitle,
              ...(data.config || {}),
            },
            createdAt: data.createdAt,
          });
        });
        setWebsites(sites);
      }
      setLoading(false);
    }, (error) => {
      console.error("Fetch websites error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const addWebsite = async (siteData: { 
    name: string; 
    domain: string; 
    themeColor?: string; 
    welcomeMessage?: string;
    config?: Partial<WidgetConfig>;
  }) => {
    const cleanId = "site_" + siteData.name.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Math.random().toString(36).substring(2, 7);
    const initialConfig: WidgetConfig = {
      ...defaultWidgetConfig,
      primaryColor: siteData.themeColor || defaultWidgetConfig.primaryColor,
      userBubbleColor: siteData.themeColor || defaultWidgetConfig.userBubbleColor,
      subtitle: siteData.welcomeMessage || defaultWidgetConfig.subtitle,
      title: `${siteData.name.trim()} Support`,
      ...(siteData.config || {}),
    };

    const newSite: Website = {
      id: cleanId,
      name: siteData.name.trim(),
      domain: siteData.domain.trim().replace(/^https?:\/\//, ""),
      themeColor: initialConfig.primaryColor,
      welcomeMessage: initialConfig.subtitle,
      config: initialConfig,
    };

    await setDoc(doc(db, "websites", cleanId), {
      ...newSite,
      createdAt: serverTimestamp(),
    });

    return newSite;
  };

  const updateWebsite = async (id: string, updates: Partial<Website>) => {
    const siteRef = doc(db, "websites", id);
    await updateDoc(siteRef, updates);
  };

  const deleteWebsite = async (id: string) => {
    const siteRef = doc(db, "websites", id);
    await deleteDoc(siteRef);
  };

  return {
    websites,
    loading,
    addWebsite,
    updateWebsite,
    deleteWebsite,
  };
}
