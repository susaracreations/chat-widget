import { useEffect, useState } from "react";
import { 
  db, 
  appId, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  setDoc
} from "../utils/firebase";

export interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: any;
}

export function useChat(uid: string | undefined, merchantId: string = appId) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const messagesRef = collection(db, 'merchants', merchantId, 'sessions', uid, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs: Message[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          text: data.text || "",
          sender: data.sender || "",
          timestamp: data.timestamp
        });
      });
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error("Fetch messages error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [uid, merchantId]);

  const sendMessage = async (text: string, senderId: string) => {
    if (!uid || !text.trim()) return;

    try {
      const messagesRef = collection(db, 'merchants', merchantId, 'sessions', uid, 'messages');
      await addDoc(messagesRef, {
        text: text.trim(),
        sender: senderId,
        timestamp: serverTimestamp()
      });

      // Update session heartbeat
      const sessionRef = doc(db, 'merchants', merchantId, 'sessions', uid);
      await setDoc(sessionRef, { 
        lastActive: serverTimestamp(),
        userId: uid,
        platform: window.location.hostname
      }, { merge: true });
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  return { messages, loading, sendMessage };
}
