import { Dispute, Project, QueueItem, User } from '@/types/domain';

export const demoUsers: Record<'buyer' | 'seller' | 'admin', User> = {
  buyer: { id: 'usr_buyer', name: 'Ajmal', email: 'buyer@yeskaro.demo', role: 'buyer' },
  seller: { id: 'usr_seller', name: 'Faraz', email: 'seller@yeskaro.demo', role: 'seller' },
  admin: { id: 'usr_admin', name: 'yesKaro Ops', email: 'admin@yeskaro.demo', role: 'admin' },
};

export const demoProjects: Project[] = [
  {
    id: 'prj_brand', buyerId: 'usr_buyer', sellerId: 'usr_seller', sellerEmail: 'seller@yeskaro.demo',
    title: 'Dastarkhwan brand launch', description: 'Identity and launch site for a new Pakistani food brand.',
    totalAmount: 180000, currency: 'PKR', status: 'in_progress', scope: 'Create a bilingual brand identity and responsive launch website.',
    deliverables: ['Visual identity system', 'Responsive five-page website', 'Launch asset pack'], exclusions: ['Product photography', 'Paid media'], deadline: '2026-10-12',
    milestones: [
      { id: 'ms_brand', projectId: 'prj_brand', title: 'Brand direction approved', description: 'Moodboard, logo routes and palette.', amount: 45000, dueDate: '2026-09-08', status: 'paid', order: 0, submission: 'Final identity deck and source files' },
      { id: 'ms_site', projectId: 'prj_brand', title: 'Website build', description: 'Responsive implementation of five approved pages.', amount: 90000, dueDate: '2026-09-28', status: 'submitted', order: 1, submission: 'Preview: https://example.com/dastarkhwan' },
      { id: 'ms_handover', projectId: 'prj_brand', title: 'QA & handover', description: 'Cross-device QA, training and source handover.', amount: 45000, dueDate: '2026-10-12', status: 'pending', order: 2 },
    ],
  },
  {
    id: 'prj_app', buyerId: 'usr_buyer', sellerId: 'usr_seller', sellerEmail: 'seller@yeskaro.demo',
    title: 'Retail inventory app', description: 'Mobile inventory prototype for three stores.', totalAmount: 320000, currency: 'PKR', status: 'funded',
    scope: 'Design and prototype a mobile inventory workflow.', deliverables: ['Research summary', 'Interactive prototype', 'Usability findings'], exclusions: ['Production engineering'], deadline: '2026-11-05',
    milestones: [
      { id: 'ms_research', projectId: 'prj_app', title: 'Research synthesis', description: 'Stakeholder interviews and workflow map.', amount: 64000, dueDate: '2026-09-18', status: 'pending', order: 0 },
      { id: 'ms_proto', projectId: 'prj_app', title: 'Interactive prototype', description: 'High-fidelity core flows.', amount: 192000, dueDate: '2026-10-20', status: 'pending', order: 1 },
      { id: 'ms_test', projectId: 'prj_app', title: 'Testing & handoff', description: 'Five sessions and annotated handoff.', amount: 64000, dueDate: '2026-11-05', status: 'pending', order: 2 },
    ],
  },
  {
    id: 'prj_campaign', buyerId: 'usr_buyer', sellerId: 'usr_seller', sellerEmail: 'seller@yeskaro.demo',
    title: 'Eid campaign films', description: 'Three social campaign edits.', totalAmount: 120000, currency: 'PKR', status: 'disputed',
    scope: 'Edit three 30-second campaign films from supplied footage.', deliverables: ['Three mastered films', 'Captioned social variants'], exclusions: ['Filming', 'Voice-over licensing'], deadline: '2026-08-26',
    milestones: [
      { id: 'ms_film', projectId: 'prj_campaign', title: 'Final campaign edits', description: 'Three masters and six social crops.', amount: 120000, dueDate: '2026-08-26', status: 'disputed', order: 0, submission: 'Nine review links supplied' },
    ],
  },
];

export const fundingQueue: QueueItem[] = [
  { id: 'fund_1', projectId: 'prj_new', title: 'Urdu learning portal', person: 'Sana Malik', amount: 240000, status: 'pending', meta: 'HBL transfer • uploaded 14 min ago' },
  { id: 'fund_2', projectId: 'prj_new2', title: 'Clinic booking redesign', person: 'Bilal Ahmed', amount: 95000, status: 'pending', meta: 'Meezan transfer • uploaded 1 hr ago' },
];
export const payoutQueue: QueueItem[] = [
  { id: 'pay_1', projectId: 'prj_brand', title: 'Website build', person: 'Faraz', amount: 90000, status: 'pending_admin_payout', meta: 'Bank Alfalah • PK••••9012' },
];
export const demoDisputes: Dispute[] = [
  { id: 'dis_1', milestoneId: 'ms_film', projectId: 'prj_campaign', title: 'Eid campaign films', status: 'awaiting_admin',
    buyerStatement: 'Two exports use the earlier product pack and the captions contain three spelling errors.',
    sellerStatement: 'All edits followed the approved storyboard. The product pack changed after final approval; caption corrections are minor.',
    recommendation: 'partial_split', buyerSharePercent: 25, sellerSharePercent: 75,
    reasoning: 'The approved storyboard supports the seller’s core delivery, while the documented caption defects leave a limited portion incomplete. A 75/25 split reflects substantial completion and the buyer’s reasonable correction cost.', confidence: 0.84 },
];
