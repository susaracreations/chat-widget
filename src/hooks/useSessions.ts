import { useEffect, useState } from "react";
import { 
  db, 
  appId, 
  collection, 
  query, 
  orderBy, 
  onSnapshot 
} from "../utils/firebase";
import type { Website } from "./useWebsites";

export interface Session {
  id: string;
  userId: string;
  lastActive: any;
  platform: string;
  merchantId: string;
  websiteName?: string;
}

export function useSessions(merchantId: string = appId, websites: Website[] = []) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const websiteIdsKey = websites.map((w) => w.id).join(",");

  useEffect(() => {
    if (merchantId === "all") {
      if (websites.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const siteSessionsMap: Record<string, Session[]> = {};
      const unsubscribers: (() => void)[] = [];

      websites.forEach((site) => {
        const sessionsRef = collection(db, "merchants", site.id, "sessions");
        const q = query(sessionsRef, orderBy("lastActive", "desc"));

        const unsub = onSnapshot(
          q,
          (snap) => {
            const siteSessions: Session[] = [];
            snap.forEach((doc) => {
              const data = doc.data();
              siteSessions.push({
                id: doc.id,
                userId: data.userId || doc.id,
                lastActive: data.lastActive,
                platform: data.platform || site.domain || "unknown",
                merchantId: site.id,
                websiteName: site.name,
              });
            });
            siteSessionsMap[site.id] = siteSessions;

            // Flatten and sort all sessions by lastActive
            const combined = Object.values(siteSessionsMap).flat();
            combined.sort((a, b) => {
              const timeA = a.lastActive?.toMillis ? a.lastActive.toMillis() : (a.lastActive?.seconds ? a.lastActive.seconds * 1000 : 0);
              const timeB = b.lastActive?.toMillis ? b.lastActive.toMillis() : (b.lastActive?.seconds ? b.lastActive.seconds * 1000 : 0);
              return timeB - timeA;
            });
            setSessions(combined);
            setLoading(false);
          },
          (error) => {
            console.error(`Fetch sessions for site ${site.id} error:`, error);
          }
        );
        unsubscribers.push(unsub);
      });

      return () => {
        unsubscribers.forEach((unsub) => unsub());
      };
    } else {
      const siteInfo = websites.find((w) => w.id === merchantId);
      const sessionsRef = collection(db, "merchants", merchantId, "sessions");
      const q = query(sessionsRef, orderBy("lastActive", "desc"));

      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const activeSessions: Session[] = [];
          snap.forEach((doc) => {
            const data = doc.data();
            activeSessions.push({
              id: doc.id,
              userId: data.userId || doc.id,
              lastActive: data.lastActive,
              platform: data.platform || siteInfo?.domain || "unknown",
              merchantId: merchantId,
              websiteName: siteInfo?.name || "Current Site",
            });
          });
          setSessions(activeSessions);
          setLoading(false);
        },
        (error) => {
          console.error("Fetch sessions error:", error);
          setLoading(false);
        }
      );

      return unsubscribe;
    }
  }, [merchantId, websiteIdsKey, websites]);

  return { sessions, loading };
}
