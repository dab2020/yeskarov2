export type Role = 'buyer' | 'seller' | 'admin';
export type ProjectStatus = 'draft' | 'pending_admin_approval' | 'funded' | 'in_progress' | 'completed' | 'disputed' | 'cancelled';
export type MilestoneStatus = 'pending' | 'submitted' | 'approved' | 'changes_requested' | 'disputed' | 'paid';

export interface User { id: string; name: string; email: string; role: Role; }
export interface Milestone {
  id: string; projectId: string; title: string; description: string; amount: number;
  dueDate: string; status: MilestoneStatus; order: number; submission?: string; feedback?: string;
}
export interface Project {
  id: string; buyerId: string; sellerId?: string; sellerEmail: string; title: string; description: string;
  totalAmount: number; currency: string; status: ProjectStatus; scope: string;
  deliverables: string[]; exclusions: string[]; deadline: string; milestones: Milestone[];
}
export interface QueueItem { id: string; projectId: string; title: string; person: string; amount: number; status: string; meta?: string; }
export interface Dispute {
  id: string; milestoneId: string; projectId: string; title: string; status: 'awaiting_other_party' | 'awaiting_ai' | 'awaiting_admin' | 'resolved';
  buyerStatement: string; sellerStatement: string; recommendation: 'full_release_to_seller' | 'full_refund_to_buyer' | 'partial_split';
  buyerSharePercent: number; sellerSharePercent: number; reasoning: string; confidence: number; finalRuling?: string;
}
