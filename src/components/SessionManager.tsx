import React, { useEffect, useState, useCallback, useRef } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Clock, AlertTriangle, LogOut, ShieldCheck } from 'lucide-react';

interface SessionManagerProps {
  userId: string;
  onLogout: () => void;
  children: React.ReactNode;
}

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_THRESHOLD = 2 * 60 * 1000; // 2 minutes warning

export const SessionManager: React.FC<SessionManagerProps> = ({ userId, onLogout, children }) => {
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('sentinel_session_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('sentinel_session_id', newId);
    return newId;
  });

  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimer = useRef<NodeJS.Timeout | null>(null);

  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
  }, []);

  // Heartbeat to Firestore
  useEffect(() => {
    if (!userId) return;

    const performHeartbeat = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          lastActive: serverTimestamp(),
          sessionId: sessionId,
          userAgent: navigator.userAgent
        });
      } catch (error) {
        console.error("Session heartbeat failed:", error);
      }
    };

    performHeartbeat(); // Initial
    heartbeatInterval.current = setInterval(performHeartbeat, 60000); // Every minute

    return () => {
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
    };
  }, [userId, sessionId]);

  // Activity Listeners
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
    };
  }, [updateActivity]);

  // Timeout Logic
  useEffect(() => {
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current);

    const timeSinceLastActivity = Date.now() - lastActivity;
    const timeLeft = INACTIVITY_TIMEOUT - timeSinceLastActivity;

    if (timeLeft <= 0) {
      onLogout();
    } else {
      if (timeLeft <= WARNING_THRESHOLD) {
        setShowWarning(true);
      }

      timeoutTimer.current = setTimeout(() => {
        const checkTime = Date.now() - lastActivity;
        if (checkTime >= INACTIVITY_TIMEOUT) {
          onLogout();
        } else if (checkTime >= INACTIVITY_TIMEOUT - WARNING_THRESHOLD) {
          setShowWarning(true);
        }
      }, Math.min(timeLeft, 10000)); // Check every 10s or when it should expire
    }

    return () => {
      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    };
  }, [lastActivity, onLogout]);

  // Concurrent Session Check
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      const data = snapshot.data();
      if (data && data.sessionId && data.sessionId !== sessionId) {
        // Another session has started elsewhere
        console.warn("Concurrent session detected. Logging out.");
        onLogout();
      }
    });

    return () => unsubscribe();
  }, [userId, sessionId, onLogout]);

  return (
    <>
      {children}
      
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] w-full max-w-md px-4"
          >
            <div className="bg-amber-600 text-white p-6 rounded-3xl shadow-2xl border border-amber-500/30 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg">Session Expiring</h4>
                  <p className="text-sm opacity-90">You've been inactive for a while. For your security, you will be logged out soon.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={updateActivity}
                  className="flex-1 py-3 bg-white text-amber-600 rounded-xl font-bold text-sm hover:bg-amber-50 transition-colors"
                >
                  Stay Logged In
                </button>
                <button
                  onClick={onLogout}
                  className="px-6 py-3 bg-amber-700/30 text-white rounded-xl font-bold text-sm hover:bg-amber-700/50 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Status Indicator (Subtle) */}
      <div className="fixed bottom-4 right-4 z-[50] flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border border-gray-100 dark:border-dark-border rounded-full shadow-sm">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-bold text-gray-500 dark:text-dark-muted uppercase tracking-wider flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-purple-deep" /> Secure Session Active
        </span>
      </div>
    </>
  );
};
