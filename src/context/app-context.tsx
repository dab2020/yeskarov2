import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { demoDisputes, demoProjects, demoUsers, fundingQueue, payoutQueue } from '@/data/demo';
import { Dispute, MilestoneStatus, Project, QueueItem, Role, User } from '@/types/domain';
import { login, me, setApiToken, signup } from '@/lib/api';
import { clearSessionToken, readSessionToken, writeSessionToken } from '@/lib/session';

interface AppState {
  user: User | null;
  projects: Project[];
  funding: QueueItem[];
  payouts: QueueItem[];
  disputes: Dispute[];
  notifications: string[];
  loginAs: (role: Role) => void;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, role: 'buyer' | 'seller') => Promise<void>;
  logout: () => void;
  addProject: (project: Project) => void;
  updateMilestone: (id: string, status: MilestoneStatus, note?: string) => void;
  actOnQueue: (kind: 'funding' | 'payout', id: string, action: 'approve' | 'reject') => void;
  resolveDispute: (id: string, buyerPercent: number, note: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(demoUsers.buyer);
  const [projects, setProjects] = useState(demoProjects);
  const [funding, setFunding] = useState(fundingQueue);
  const [payouts, setPayouts] = useState(payoutQueue);
  const [disputes, setDisputes] = useState(demoDisputes);
  const [notifications, setNotifications] = useState([
    'Faraz submitted “Website build” for review.',
    'Your Retail inventory app escrow is funded.',
    'Admin mediation is ready for Eid campaign films.',
  ]);

  useEffect(() => { void readSessionToken().then(async (token) => { if (!token) return; setApiToken(token); try { setUser((await me()).user); } catch { setApiToken(null); await clearSessionToken(); } }); }, []);

  const value = useMemo<AppState>(() => ({
    user, projects, funding, payouts, disputes, notifications,
    loginAs: (role) => setUser(demoUsers[role]),
    loginWithPassword: async (email, password) => { const result = await login(email, password); setApiToken(result.token); await writeSessionToken(result.token); setUser(result.user); },
    signUp: async (name, email, password, role) => { const result = await signup(name, email, password, role); setApiToken(result.token); await writeSessionToken(result.token); setUser(result.user); },
    logout: () => { setApiToken(null); void clearSessionToken(); setUser(null); },
    addProject: (project) => {
      setProjects((current) => [project, ...current]);
      setNotifications((current) => [`${project.title} was sent for funding review.`, ...current]);
    },
    updateMilestone: (id, status, note) => {
      setProjects((current) => current.map((project) => ({
        ...project,
        milestones: project.milestones.map((milestone) => milestone.id === id
          ? { ...milestone, status, ...(status === 'submitted' ? { submission: note } : { feedback: note }) }
          : milestone),
      })));
      setNotifications((current) => [`Milestone status changed to ${status.replaceAll('_', ' ')}.`, ...current]);
    },
    actOnQueue: (kind, id, action) => {
      const setter = kind === 'funding' ? setFunding : setPayouts;
      setter((current) => current.map((item) => item.id === id ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' } : item));
      setNotifications((current) => [`Admin ${action}d ${kind} request ${id}.`, ...current]);
    },
    resolveDispute: (id, buyerPercent, note) => setDisputes((current) => current.map((item) => item.id === id ? {
      ...item, status: 'resolved', buyerSharePercent: buyerPercent, sellerSharePercent: 100 - buyerPercent,
      finalRuling: note || `Buyer ${buyerPercent}% / Seller ${100 - buyerPercent}%`,
    } : item)),
  }), [user, projects, funding, payouts, disputes, notifications]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
