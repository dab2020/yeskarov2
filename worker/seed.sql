PRAGMA foreign_keys = ON;
INSERT OR IGNORE INTO users (id,email,password_hash,role,name) VALUES
 ('usr_admin','admin@yeskaro.demo','demo:Demo123!','admin','yesKaro Ops'),
 ('usr_buyer','buyer@yeskaro.demo','demo:Demo123!','buyer','Ajmal'),
 ('usr_seller','seller@yeskaro.demo','demo:Demo123!','seller','Faraz');

UPDATE users SET name = 'Ajmal' WHERE id = 'usr_buyer';
UPDATE users SET name = 'Faraz' WHERE id = 'usr_seller';

INSERT OR IGNORE INTO projects (id,buyer_id,seller_id,seller_email,title,description,structured_terms_json,total_amount,currency,status) VALUES
 ('prj_funded','usr_buyer','usr_seller','seller@yeskaro.demo','Retail inventory app','Mobile inventory prototype','{"scope":"Design an inventory workflow","deliverables":["Prototype"],"exclusions":["Production engineering"],"deadline":"2026-11-05"}',320000,'PKR','funded'),
 ('prj_active','usr_buyer','usr_seller','seller@yeskaro.demo','Dastarkhwan brand launch','Identity and launch site','{"scope":"Bilingual brand and website","deliverables":["Identity","Website"],"exclusions":["Photography"],"deadline":"2026-10-12"}',180000,'PKR','in_progress'),
 ('prj_disputed','usr_buyer','usr_seller','seller@yeskaro.demo','Eid campaign films','Three social edits','{"scope":"Edit three films","deliverables":["Three masters"],"exclusions":["Filming"],"deadline":"2026-08-26"}',120000,'PKR','disputed');

INSERT OR IGNORE INTO milestones (id,project_id,title,description,amount,order_index,status,due_date,submission_note) VALUES
 ('ms_brand','prj_active','Brand direction approved','Moodboard, logo routes and palette',45000,0,'paid','2026-09-08','Identity deck'),
 ('ms_site','prj_active','Website build','Responsive implementation',90000,1,'submitted','2026-09-28','https://example.com/dastarkhwan'),
 ('ms_handover','prj_active','QA & handover','QA, training and source handover',45000,2,'pending','2026-10-12',NULL),
 ('ms_film','prj_disputed','Final campaign edits','Three masters and six crops',120000,0,'disputed','2026-08-26','Nine review links supplied');
INSERT OR IGNORE INTO funding_requests (id,project_id,amount,screenshot_url,status) VALUES ('fund_demo','prj_funded',320000,'r2://demo/funding-receipt.png','approved');
INSERT OR IGNORE INTO payout_requests (id,milestone_id,seller_id,amount,status) VALUES ('pay_demo','ms_site','usr_seller',90000,'pending_admin_payout');
INSERT OR IGNORE INTO disputes (id,milestone_id,raised_by,status,buyer_statement,seller_statement,ai_recommendation_json) VALUES
 ('dis_demo','ms_film','usr_buyer','awaiting_admin','Two exports use an earlier product pack and captions have errors.','The pack changed after approval; caption fixes are minor.','{"recommendation":"partial_split","buyerSharePercent":25,"sellerSharePercent":75,"reasoning":"Core delivery is substantially complete, with a limited correction cost.","confidence":0.84}');
