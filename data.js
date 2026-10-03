/*
 * Trendzo (closetx) process map. All content lives here; app.js only draws it.
 * Internal keys: section 'manual' = TOP half "Built today", section 'auto' = BOTTOM half "Proposed".
 * Position = (stage, sub, lane). Types: trigger | action | doc | decision | external | gap | auto | approve | store
 *   auto = system step · approve = human desk step · doc = human updates a record/file · action = human step · gap = missing/buggy
 * Bottom nodes carry change: add | modify | remove and `replaces` (ids of top nodes they change). A bottom node without `change` is an unchanged anchor.
 * Source: read-only review of the closetx repo (backend, customer/driver/retailer apps, web portal, CRM). Anything inferred is `assumed`.
 */
(function () {
  var meta = {
    brand: 'Trendzo', mark: 'TZ', subtitle: 'Process map', btnTop: 'Built today', btnBottom: 'Proposed',
    topTitle: 'Built today', bottomTitle: 'Proposed: add · automate · modify · remove',
    labels: {
      pains: 'Gaps and risks', automations: 'Improvements that address this', replacedBy: 'Proposed change', replaces: 'Changes',
      solves: 'What this changes vs today', today: 'Today', newCap: 'New capability. Nothing built today does this.', effort: 'Manual work removed',
      touchTop: 'Human touch', touchBottom: 'Human in the loop', assumed: 'Inferred from the code or from how similar marketplaces work. Not confirmed with the team.',
      secTop: 'Built today', secBottom: 'Proposed', noCounterpart: 'Left as is'
    },
    laneLabels: { top: { 7: 'Screens, consoles and tables (built)' }, bottom: { 7: 'Screens, consoles and tables (proposed)' } },
    tags: { auto: '⚙ SYSTEM', gap: '✗ GAP' },
    typeName: { trigger: 'Start / end / event', action: 'Human step', doc: 'Human updates a record or file', decision: 'Decision', external: 'External party or service', gap: 'Gap, bug or missing piece', auto: 'System step (automatic)', approve: 'Human desk step', store: 'Screen, console or table' },
    role: {
      trigger: 'Marks where a flow starts, ends or is set off by an event.',
      action: 'A step a person carries out. It does not write a record on its own.',
      doc: 'A step where a person has to enter, upload or update a record or file by hand.',
      external: 'A party or service outside Trendzo. The flow waits on it.',
      gap: 'Something missing, stubbed, buggy or unowned in today\'s build.',
      auto: 'A step the system runs by itself, with no person involved.',
      approve: 'A desk step: a person must accept, approve, decide, scan or confirm. The system does the rest.',
      store: 'Where the data lives or is worked on: a table, console or screen.'
    },
    decisionTop: 'A branch the system or a person decides today.', decisionBottom: 'A rule the system applies, so nobody has to judge it.',
    legend: [
      ['pill', '--bd:var(--fg-faint);--bg:var(--sunken)', 'Start / end / event'], ['', '', 'Human step'],
      ['', '--bd:var(--warning-border);--bg:var(--warning-soft)', 'Human updates a record'], ['dia', '--bd:var(--info);--bg:var(--info-soft)', 'Decision'],
      ['dash', '--bd:var(--fg-subtle)', 'External party / service'], ['dash', '--bd:var(--danger);--bg:var(--danger-soft)', 'Gap, bug or missing'],
      ['', '--bd:var(--accent-border);--bg:var(--accent-soft)', 'System step'], ['', '--bd:var(--success);--bg:var(--success-soft)', 'Human desk step'],
      ['', '--bd:var(--success);--bg:var(--surface)', '＋ Add'], ['', '--bd:var(--info);--bg:var(--surface)', '↻ Modify'],
      ['dash', '--bd:var(--fg-faint);--bg:var(--sunken)', '✕ Remove'], ['loop', '', 'Loop / retry']
    ]
  };

  var stages = [
    { id: 0, label: 'Onboard & go live' }, { id: 1, label: 'Browse, order & pay' }, { id: 2, label: 'Accept & fulfil' }, { id: 3, label: 'Deliver' },
    { id: 4, label: 'Return & refund' }, { id: 5, label: 'Settle & pay out' }, { id: 6, label: 'GST & tax (retailers)' }, { id: 7, label: 'Oversight & support' }
  ];
  var lanes = ['Shopper', 'Retailer store staff', 'Driver', 'Admin / ops team', 'Platform (backend & sweeps)', 'Retailer GST & finance', 'External parties & services', 'Screens, consoles and tables'];

  var pains = {
    G1: 'Admin previews and runs every payout cycle by hand', G2: 'Payout completion needs a hand-typed bank reference', G3: 'Razorpay settlement file is uploaded and matched by hand',
    G4: 'COD cash is not netted against payouts', G5: 'Driver cash deposits confirmed one by one by ops', G6: 'Retailer must accept in 180 s; one candidate store, no failover',
    G7: 'Express orders get no dispatch priority', G8: 'Packed order with no driver only raises an alert', G9: 'Stuck returns only alert; a human must confirm arrival',
    G10: 'Cash refunds are settled by hand', G11: 'Replacement and pickup dispute decisions do nothing', G12: 'GSTIN is checked for length only', G13: 'GSTIN, PAN and penny-drop results are recorded by hand',
    G14: 'AI catalog has no admin review and no regenerate', G15: 'Web push never sent, no app push token, daily digest never emailed', G16: 'Several shopper screens still run on mock data',
    G17: 'No partial-quantity returns or exchanges', G18: 'Commission invoice issuer is the placeholder PLATFORM-GSTIN', G19: 'Commission invoice uses retailer series and wrong place of supply; not reversed on returns',
    G20: 'Month-close button fails (period format); closing does not lock the period', G21: 'GSTR-3B is not built (returns 501)', G22: 'No GSTR-8; TCS file lacks per-supplier split',
    G23: 'TCS 1% vs statutory 0.5%; invoice and payout use different bases', G24: 'No TDS 194-O ledger, no Form 26Q / 16A', G25: 'No e-invoice (IRN / QR) and no e-way bill',
    G26: 'Composition dealers get a tax invoice online, not a bill of supply', G27: 'Online orders are never B2B (buyer GSTIN null)', G28: 'Shoppers cannot fetch their invoices',
    G29: 'Statement PDF disabled; holds and TCS show 0', G30: 'Retailer downloads invoices one by one; CA files by hand', G31: 'Failed invoice issuing is only logged; nothing retries',
    G32: 'Admin GST-returns screen cannot start a new period', G33: 'Dead code (disputes module, retired CheckoutScreen)', G34: 'Nothing scheduled: cycles, month close and GST files are triggered by humans',
    G35: 'Retailer GST summary leaves out online credit notes'
  };

  var automations = {
    I1: 'Scheduled payout cycles, approve by exception', I2: 'Payout marked complete from bank confirmation', I3: 'Razorpay settlement reconciled through the API', I4: 'COD cash netted against payouts',
    I5: 'Cash deposits auto-matched, exceptions only', I6: 'Auto-accept rules and failover to the next store', I7: 'Express dispatch priority', I8: 'Escalation ladders for stuck orders, returns and tickets',
    I9: 'Wallet as the default cash-refund route', I10: 'Rule engine for small disputes', I11: 'GSTIN checksum and live verification', I12: 'Auto-verify PAN and bank (penny-drop API)',
    I13: 'AI catalog: regenerate, sampling review, auto-publish', I14: 'Real push, token registration and working email digest', I15: 'Wire or hide mock-data screens', I16: 'Partial returns and exchanges',
    I17: 'Fix commission invoice issuer, series, place of supply and reversal', I18: 'Working month close with period lock', I19: 'GSTR-1 per retailer GSTIN', I20: 'GSTR-3B summary', I21: 'GSTR-8 and the correct TCS rate',
    I22: 'TDS 194-O ledger and forms', I23: 'E-invoice and e-way bill', I24: 'Bill of supply online for composition dealers', I25: 'Buyer GSTIN capture for B2B', I26: 'Shopper invoice screen and email',
    I27: 'Retailer GST pack and fixed statements', I28: 'Read-only CA role and share link', I29: 'Invoice retry queue with alerts', I30: 'Filing calendar and reminders', I31: 'GSTR-2B reconciliation',
    I32: 'GST health dashboard', I33: 'Scheduled GST file generation', I34: 'Remove dead code', I35: 'Live rider map', I36: 'Low-stock alerts', I37: 'WhatsApp / push order alerts'
  };

  var nodes = [], edges = [];
  function node(sec, id, st, sub, lane, type, label, actor, summary, o) {
    var n = { id: id, section: sec, stage: st, sub: sub, lane: lane, type: type, label: label, actor: actor, summary: summary };
    for (var k in (o || {})) n[k] = o[k];
    nodes.push(n);
  }
  function T(id, st, sub, lane, type, label, actor, summary, o) { node('manual', id, st, sub, lane, type, label, actor, summary, o); }
  function B(id, st, sub, lane, type, label, actor, summary, o) { node('auto', id, st, sub, lane, type, label, actor, summary, o); }
  function E(from, to, o) {
    var e = { from: from, to: to, id: from + '>' + to };
    if (edges.some(function (x) { return x.id === e.id; })) e.id += '#2';
    for (var k in (o || {})) e[k] = o[k];
    edges.push(e);
  }
  function ex(o, x) { for (var k in x) o[k] = x[k]; return o; }
  function y(x) { return ex({ label: 'Yes' }, x || {}); }
  function n(x) { return ex({ label: 'No' }, x || {}); }
  function loop(l, x) { return ex({ kind: 'loop', label: l }, x || {}); }
  function tch(verb, doc, fields) { return { verb: verb, doc: doc, fields: fields }; }

  /* =========================================================================
   *  TOP HALF: BUILT TODAY
   * ========================================================================= */

  /* ---- 1 Onboard & go live ---- */
  T('t_visit', 0, 0, 3, 'trigger', 'Sales exec visits a store', 'Field-sales exec', 'Prospect retailers are found by visits, tracked in a separate CRM with a 10-step funnel from "store visited" to "onboarding completed".', { evidence: 'retailer-crm, backend src/crm' });
  T('t_crm', 0, 1, 3, 'doc', 'Update lead, visit and follow-up in CRM', 'Field-sales exec', 'Sales staff record visits, follow-ups, documents and targets by hand. The CRM has its own database and shares only the admin login.', { touch: tch('update', 's_crm', ['Visit and follow-up notes', 'Documents', 'Funnel step']), automations: ['I12'], evidence: 'retailer-crm README' });
  T('t_apply', 0, 1, 1, 'action', 'Retailer applies or signs up', 'Retailer owner', 'Two tracks: apply first (admin approves, then the account is created) or sign up first (admin approves the account, then the store).', { evidence: 'backend docs/retailer-onboarding-API.md' });
  T('t_chk', 0, 2, 3, 'doc', 'Admin checks documents and records GSTIN / PAN by hand', 'Admin / ops', 'Admin requests documents, messages the applicant and types the result of GSTIN, PAN and bank penny-drop checks into the console. GSTIN is only checked for 15 characters in code.', { touch: tch('record', 's_onb', ['Document status', 'GSTIN / PAN / penny-drop result', 'Messages to applicant']), pains: ['G12', 'G13'], automations: ['I11', 'I12'], evidence: 'backend modules/admin/onboarding; shared/validation/common.ts' });
  T('t_appr', 0, 3, 3, 'decision', 'Approve the application?', 'Admin / ops', 'Admin approves or rejects. Approval creates an active account plus a store in onboarding (10% fee) or, on the signup-first track, waits for a store approval (15% fee).', { automations: ['I12'] });
  T('t_rej', 0, 3, 1, 'action', 'Applicant fixes and resubmits', 'Retailer owner', 'A rejected applicant can resubmit with corrected documents.', {});
  T('t_terms', 0, 4, 1, 'action', 'Retailer accepts terms and uploads KYC documents', 'Retailer owner', 'Terms and privacy must be accepted before going live; KYC documents are uploaded in the app.', { evidence: 'retailer-app' });
  T('t_kyc', 0, 4, 3, 'approve', 'Admin decides each KYC document', 'Admin / ops', 'Admin opens a KYC cycle and decides each document and the cycle. Overdue cycles are swept and the store is auto-paused after a grace period.', { touch: tch('decide', 's_onb', ['Document decision', 'Cycle decision']), automations: ['I12'], evidence: 'backend shared/kyc/sweep.ts' });
  T('t_ai1', 0, 5, 1, 'action', 'Retailer shoots photos and picks AI options', 'Retailer staff', 'AI catalog beta: select photos, capture, configure. Needs the ai_catalog.generate permission; a store may hold 30 open drafts.', { evidence: 'backend modules/retailer/ai-catalog-beta' });
  T('t_aigen', 0, 6, 4, 'auto', 'Generate images and listing copy', 'Platform (Vertex / Gemini / OpenRouter)', 'Images (optionally printed onto the garment first, one per angle) and product copy run in parallel. Result is ready_for_review or failed, with no retry.', { evidence: 'backend shared/ai-catalog' });
  T('t_aiacc', 0, 7, 1, 'decision', 'Retailer accepts the result?', 'Retailer staff', 'Accept moves on; reject sends the retailer back to capture. There is no regenerate step in the beta.', { pains: ['G14'], automations: ['I13'] });
  T('t_aipub', 0, 8, 1, 'approve', 'Retailer publishes the draft, then publishes again', 'Retailer staff', 'Accepting creates a draft listing. The retailer must then publish that draft through the normal listings flow, so there are two publish steps.', { touch: tch('publish', 's_cat', ['Product details', 'Chosen images', 'Description (falls back to AI copy)']), pains: ['G14'], automations: ['I13'] });
  T('t_gapai', 0, 8, 3, 'gap', 'No admin review of AI output', 'Nobody', 'Nothing checks the generated images or copy before a listing goes live.', { pains: ['G14'], automations: ['I13'] });
  T('t_live', 0, 9, 4, 'auto', 'First published listing flips the store to active', 'Platform', 'The store goes live when the first listing is published with terms accepted.', { evidence: 'backend modules/retailer/listings' });
  T('s_crm', 0, 1, 7, 'store', 'Field-sales CRM', 'Next.js + MongoDB', 'Leads, visits, follow-ups, targets.', {});
  T('s_onb', 0, 2, 7, 'store', 'Admin onboarding and KYC console', 'Web portal (admin)', 'Applications, verification checks, KYC cycles, change requests.', {});
  T('s_cat', 0, 8, 7, 'store', 'Listings and catalog tables', 'Backend + retailer app', 'Listings, variants, media, AI submissions.', {});
  E('t_visit', 't_crm'); E('t_crm', 't_apply', { handoff: 'Prospect convinced' });
  E('t_apply', 't_chk'); E('t_chk', 't_appr'); E('t_appr', 't_rej', n({ condition: 'Rejected' })); E('t_rej', 't_chk', loop('Resubmit'));
  E('t_appr', 't_terms', y({ condition: 'Approved' })); E('t_terms', 't_kyc', { handoff: 'KYC documents' }); E('t_kyc', 't_ai1', { label: 'Cleared' });
  E('t_ai1', 't_aigen', { handoff: 'Photos and options' }); E('t_aigen', 't_aiacc', { handoff: 'Images + copy' }); E('t_aiacc', 't_ai1', n({ kind: 'loop', condition: 'Rejected', label: 'No: retake' }));
  E('t_aiacc', 't_aipub', y({ condition: 'Accepted' })); E('t_aipub', 't_gapai'); E('t_aipub', 't_live');

  /* ---- 2 Browse, order & pay ---- */
  T('o_mock', 1, 0, 4, 'gap', 'Several shopper screens run on mock data', 'Nobody', 'Image search shows newest products; mood board, community feed, style quiz and measurements use mock data. Shown to shoppers as if real.', { pains: ['G16'], automations: ['I15'], evidence: 'customer-app src/screens' });
  T('o_browse', 1, 0, 0, 'trigger', 'Shopper browses as a guest', 'Shopper', 'Home, categories, product pages and search work without signing in. Location prompt finds nearby stores by pincode.', { evidence: 'customer-app' });
  T('o_try', 1, 1, 0, 'action', 'Try on a product (optional)', 'Shopper', 'Person photo uploaded; a try-on image comes back. Rate-limited; needs sign-in.', { evidence: 'customer-app, backend modules/consumer/tryon' });
  T('o_vertex', 1, 1, 6, 'external', 'Vertex virtual try-on', 'Google Vertex AI', 'Model virtual-try-on-001 renders the garment on the person photo.', {});
  T('o_otp', 1, 2, 0, 'decision', 'Signed in?', 'Shopper', 'Sign-in is only forced at buy, try-on or prize claim, through a phone and OTP sheet.', { evidence: 'customer-app AuthSheet.tsx' });
  T('o_sms', 1, 3, 6, 'external', 'OTP via MSG91 or Slide', 'MSG91 / Slide', 'OTP is sent and checked. A 503 leaves the shopper as a guest. First login creates the account.', {});
  T('o_cart', 1, 4, 0, 'action', 'Cart grouped by delivery method', 'Shopper', 'Express, standard, pickup, Try-and-Buy. Pickup cannot span stores; Try-and-Buy blocks COD.', { evidence: 'customer-app CartScreen.tsx' });
  T('o_quote', 1, 4, 4, 'auto', 'Price quote and promotions', 'Platform', 'Server prices each group and returns rejected coupon codes with reasons.', { evidence: 'backend modules/pricing' });
  T('o_place', 1, 5, 4, 'auto', 'Place order in one transaction', 'Platform', 'Duplicate-request check, stock reserve, promotions, pricing, order rows and payment row, all together. A 409 means price changed or stock ran out.', { evidence: 'backend shared/orders/place-order.ts' });
  T('o_mode', 1, 6, 4, 'decision', 'Cash on delivery or online?', 'Platform', 'COD confirms at once. Online orders stay pending until Razorpay captures.', {});
  T('o_cod', 1, 7, 4, 'auto', 'COD: order confirmed at once', 'Platform', 'The payment row stays pending until cash is collected.', {});
  T('o_pay', 1, 7, 0, 'action', 'Pay with Razorpay (card or UPI)', 'Shopper', 'Razorpay checkout; the app then calls verify-payment.', {});
  T('o_rzp', 1, 8, 6, 'external', 'Razorpay', 'Razorpay', 'Captures payment and sends a signed webhook.', {});
  T('o_cap', 1, 8, 4, 'decision', 'Payment captured?', 'Platform', 'Two paths confirm a payment: verify-payment and the webhook. An order moves on only when the payment row says succeeded.', { evidence: 'backend modules/webhooks/razorpay.routes.ts' });
  T('o_fail', 1, 9, 0, 'action', 'Retry payment from order tracking', 'Shopper', 'A failed or dismissed payment sets payment_failed; the shopper retries from tracking.', {});
  T('o_orph', 1, 9, 4, 'auto', 'Orphan capture: auto-refund and alert admins', 'Platform', 'A capture with no order to attach to is logged, refunded on the live gateway and raised to admins.', { evidence: 'backend shared/payments/orphan-capture.ts' });
  T('s_ord', 1, 5, 7, 'store', 'Orders and payments tables', 'Backend (Postgres)', 'Orders, order items, payments, stock reservations.', {});
  E('o_browse', 'o_try', { label: 'Optional' }); E('o_try', 'o_vertex', { handoff: 'Person photo + product' }); E('o_vertex', 'o_try', loop('Try-on image'));
  E('o_browse', 'o_otp'); E('o_try', 'o_otp', { label: 'Needs sign-in' }); E('o_otp', 'o_sms', n({ condition: 'Guest' })); E('o_sms', 'o_cart', { label: 'Signed in' }); E('o_otp', 'o_cart', y());
  E('o_cart', 'o_quote', { handoff: 'Cart groups' }); E('o_quote', 'o_place'); E('o_place', 'o_mode'); E('o_mode', 'o_cod', y({ label: 'COD' })); E('o_mode', 'o_pay', n({ label: 'Online' }));
  E('o_pay', 'o_rzp'); E('o_rzp', 'o_cap'); E('o_cap', 'o_fail', n({ condition: 'Failed' })); E('o_fail', 'o_pay', loop('Retry')); E('o_cap', 'o_orph', n({ label: 'No order', condition: 'Capture with no order' }));
  E('o_cod', 'f_route'); E('o_cap', 'f_route', y({ condition: 'Captured' }));

  /* ---- 3 Accept & fulfil ---- */
  T('f_route', 2, 0, 4, 'auto', 'Route to the store; start the 180 s timer', 'Platform', 'confirmed to routing is automatic. There is only ever one candidate store, so nothing is actually re-routed.', { pains: ['G6'], automations: ['I6'], evidence: 'backend shared/orders/routing.ts' });
  T('f_acc', 2, 1, 1, 'decision', 'Retailer accepts in time?', 'Retailer store staff', 'Accept moves on; a reject or a timeout counts as one attempt.', { pains: ['G6'], automations: ['I6', 'I37'] });
  T('f_att', 2, 1, 4, 'decision', 'Three attempts used?', 'Platform', 'After three attempts the order is cancelled as routing_exhausted. Each retry goes to the same store.', { pains: ['G6'], automations: ['I6'] });
  T('f_cancel', 2, 2, 4, 'auto', 'Cancel (routing_exhausted) and refund', 'Platform', 'Stock is released and the refund is created.', {});
  T('f_pack', 2, 2, 1, 'approve', 'Retailer packs the order', 'Retailer store staff', 'Done on the web orders board. Order fulfilment is not in the retailer mobile app.', { touch: tch('pack', 's_ordc', ['Mark packed']), evidence: 'webprotal retailer orders board' });
  T('f_mode', 2, 3, 4, 'decision', 'Delivery method?', 'Platform', 'Three handoffs after packing: driver, store pickup, or an outside courier override.', {});
  T('f_offer', 2, 4, 2, 'action', 'Driver claims the offer (FCM wakes the app)', 'Driver', 'Offers arrive by long-poll plus an FCM push. Driver accounts are active immediately, with no approval step.', { evidence: 'driver-app, backend modules/driver/offers' });
  T('f_pickup', 2, 4, 1, 'action', 'Customer shows the pickup code at the store', 'Retailer store staff', 'Store pickup completes on a code; no driver is involved.', {});
  T('f_nodrv', 2, 5, 3, 'gap', 'Packed, no driver after 15 min: alert only', 'Nobody', 'The sweep only alerts. A human has to notice and act.', { pains: ['G8', 'G7'], automations: ['I8', 'I7'], evidence: 'backend shared/orders/lifecycle-sweeps.ts' });
  T('f_adm', 2, 6, 3, 'approve', 'Admin assigns a driver by hand', 'Admin / ops', 'Dispatch console: assign or unassign a driver on an order. Express orders get no dispatch priority.', { touch: tch('assign', 's_adm', ['Driver', 'Order']), pains: ['G7', 'G8'], automations: ['I7', 'I8'], evidence: 'backend modules/admin/dispatch' });
  T('f_code', 2, 7, 1, 'approve', 'Retailer verifies driver code or courier', 'Retailer store staff', 'Handoff verified against the driver code. For an outside courier the retailer enters name and phone, which is a manual override.', { touch: tch('verify', 's_ordc', ['Driver code or courier name + phone']) });
  T('s_ordc', 2, 2, 7, 'store', 'Retailer orders board (web)', 'Web portal (retailer)', 'Accept, pack, hand over, mark delivered, confirm arrival, returns.', {});
  T('s_adm', 2, 6, 7, 'store', 'Admin dispatch console', 'Web portal (admin)', 'Assign drivers and reverse pickups.', {});
  E('f_route', 'f_acc'); E('f_acc', 'f_pack', y({ condition: 'Accepted' })); E('f_acc', 'f_att', n({ condition: 'Rejected or timed out' })); E('f_att', 'f_route', loop('Retry same store', { condition: 'Attempts left' }));
  E('f_att', 'f_cancel', y({ condition: 'Out of attempts' })); E('f_pack', 'f_mode'); E('f_mode', 'f_offer', { label: 'Driver' }); E('f_mode', 'f_pickup', { label: 'Pickup' });
  E('f_offer', 'f_nodrv', n({ label: 'Nobody claims' })); E('f_nodrv', 'f_adm'); E('f_adm', 'f_code', { label: 'Driver assigned' }); E('f_offer', 'f_code', { label: 'Claimed', handoff: 'Driver code' });
  E('f_code', 'd_dep', { handoff: 'Parcel handed over' }); E('f_pickup', 'd_close', { label: 'Collected' });

  /* ---- 4 Deliver ---- */
  T('d_dep', 3, 0, 2, 'action', 'Driver departs', 'Driver', 'picked_up to out_for_delivery.', {});
  T('d_tbq', 3, 1, 4, 'decision', 'Try-and-Buy order?', 'Platform', 'Try-and-Buy opens a door window with a timer instead of a plain handover.', {});
  T('d_door', 3, 2, 0, 'action', 'Shopper tries items: keep, return or refuse', 'Shopper + driver', 'Per-item decision with photo and reason. The window can be extended once. A refused item the store decides on is recorded separately.', { evidence: 'driver-app DoorScreen.tsx' });
  T('d_otp', 3, 2, 2, 'decision', 'Someone home and OTP correct?', 'Driver', 'Delivery needs the customer OTP, a photo and, for COD, the cash amount.', {});
  T('d_done', 3, 3, 2, 'action', 'Deliver: OTP, photo, COD cash', 'Driver', 'Order moves to delivered.', {});
  T('d_undel', 3, 4, 2, 'action', 'Undelivered: photo and reason', 'Driver', 'Records why delivery failed.', {});
  T('d_sys', 3, 4, 4, 'auto', 'On delivery: invoices, loyalty, earnings, stock', 'Platform', 'Issues the tax invoice and the commission invoice, grants loyalty points, records driver earnings and marks items delivered.', { evidence: 'backend shared/orders/transition.ts' });
  T('d_retry', 3, 5, 4, 'decision', 'Retries left?', 'Platform', 'Another attempt while within the retry budget, otherwise return to store.', {});
  T('d_close', 3, 6, 4, 'auto', 'Auto-close after 7 days', 'Platform', 'Unless a return is pending or an issue is open.', {});
  T('d_ret', 3, 6, 2, 'action', 'Driver returns the parcel to the store', 'Driver', 'returning_to_store.', {});
  T('d_arr', 3, 7, 1, 'approve', 'Retailer confirms the goods arrived', 'Retailer store staff', 'A human must confirm arrival. If nobody does, a sweep alerts after 24 h.', { touch: tch('confirm', 's_ordc', ['Goods arrived']), pains: ['G9'], automations: ['I8'] });
  T('d_rsys', 3, 8, 4, 'auto', 'Arrival: accept door returns, cancel and refund', 'Platform', 'Door returns are auto-accepted, the order is cancelled and refunded.', {});
  E('d_dep', 'd_tbq'); E('d_tbq', 'd_door', y()); E('d_tbq', 'd_otp', n()); E('d_otp', 'd_done', y()); E('d_otp', 'd_undel', n({ condition: 'Nobody home / wrong OTP' }));
  E('d_done', 'd_sys'); E('d_door', 'd_sys', { label: 'Anything kept' }); E('d_door', 'd_ret', { label: 'Nothing kept' }); E('d_undel', 'd_retry'); E('d_retry', 'd_dep', y({ kind: 'loop', label: 'Yes: another attempt' }));
  E('d_retry', 'd_ret', n({ condition: 'No attempts left' })); E('d_ret', 'd_arr', { handoff: 'Parcel back at store' }); E('d_arr', 'd_rsys'); E('d_sys', 'd_close'); E('d_sys', 'g_inv', { label: 'Invoices issued', handoff: 'Delivered order' });
  E('d_rsys', 'r_restock', { label: 'Refund', handoff: 'Cancelled order' });

  /* ---- 5 Return & refund ---- */
  T('r_req', 4, 0, 0, 'action', 'Shopper requests a return (7 days)', 'Shopper', 'Order, item, reason. A return covers the whole line: no partial quantity and no exchange.', { pains: ['G17'], automations: ['I16'], evidence: 'customer-app, backend shared/returns' });
  T('r_ctr', 4, 1, 1, 'action', 'Counter return at the store', 'Retailer store staff', 'A walk-in return within 7 days.', {});
  T('r_elig', 4, 1, 4, 'decision', 'Within the window and returnable?', 'Platform', 'Final-sale items, expired windows and an open return are refused.', {});
  T('r_deny', 4, 2, 0, 'action', 'Request refused with the reason', 'Shopper', 'Window expired, final sale, or already open.', {});
  T('r_pick', 4, 2, 2, 'action', 'Driver collects the item (OTP and photo)', 'Driver', 'Claim, collect with OTP and photo (plus cash handed back for COD), deliver to store. Unclaimed pickups alert after 12 h.', { pains: ['G9'], automations: ['I8'], evidence: 'backend modules/driver/reverse-pickups' });
  T('r_recv', 4, 3, 4, 'auto', 'Goods received: 24 h check window starts', 'Platform', 'The retailer has 24 hours to check the item.', {});
  T('r_chk', 4, 4, 1, 'decision', 'Retailer accepts the return?', 'Retailer store staff', 'Accept refunds and restocks. Decline opens a dispute and holds the item.', {});
  T('r_auto', 4, 4, 4, 'auto', 'No answer in 24 h: auto-accept', 'Platform', 'A sweep accepts when the window expires.', {});
  T('r_disp', 4, 5, 4, 'auto', 'Open dispute and hold the amount from payout', 'Platform', 'The disputed amount is held against the retailer\'s next payout.', {});
  T('r_adm', 4, 6, 3, 'approve', 'Admin decides: refund, split or none', 'Admin / ops', 'Every dispute is decided by an admin.', { touch: tch('decide', 's_ret', ['Refund / split / none']), automations: ['I10'], evidence: 'backend shared/issues decideIssue' });
  T('r_gap', 4, 7, 3, 'gap', 'Replacement and pickup decisions do nothing', 'Nobody', 'An audit found that some dispute outcomes are recorded but trigger no action. The older disputes module is dead code.', { pains: ['G11', 'G33'], automations: ['I10', 'I34'], evidence: 'docs/FLOW_ASSESSMENT.md' });
  T('r_restock', 4, 6, 4, 'auto', 'Restock and create the refund', 'Platform', 'Stock goes back on accept; a refund row is created.', {});
  T('r_chan', 4, 7, 4, 'decision', 'Refund channel?', 'Platform', 'Chosen when the refund row is created: wallet, original payment, cash, or manual payout.', { evidence: 'backend shared/refunds/resolve-destination.ts' });
  T('r_wallet', 4, 8, 4, 'auto', 'Wallet: instant', 'Platform', 'Credited at once.', {});
  T('r_card', 4, 8, 6, 'external', 'Razorpay refund (original payment)', 'Razorpay', 'Simulated in dev.', {});
  T('r_cash', 4, 8, 1, 'action', 'Cash: driver or retailer hands it over', 'Retailer / driver', 'The retailer pays at the counter, or the driver hands cash back at pickup.', { pains: ['G10'], automations: ['I9'] });
  T('r_man', 4, 8, 3, 'approve', 'Manual payout desk: admin enters the payment reference', 'Admin / ops', 'Waits on the payout desk. Admin closes it with a payment reference or redirects it to wallet. COD cash refunds are settled by hand here.', { touch: tch('enter ref', 's_ret', ['Payment reference']), pains: ['G10'], automations: ['I9'], evidence: 'backend modules/admin/returns' });
  T('r_fail', 4, 9, 4, 'auto', 'refund.failed: new leg, alert, 15 min auto-retry', 'Platform', 'A failed refund opens a retry leg and alerts admins; the 60 s sweep retries stuck original-payment legs after 15 minutes.', { automations: ['I8'] });
  T('s_ret', 4, 3, 7, 'store', 'Returns, refunds and disputes tables', 'Backend + admin console', 'Return rows, refund legs, issues, held items.', {});
  E('r_req', 'r_elig'); E('r_ctr', 'r_recv'); E('r_elig', 'r_deny', n()); E('r_elig', 'r_pick', y()); E('r_pick', 'r_recv'); E('r_recv', 'r_chk'); E('r_chk', 'r_disp', n({ condition: 'Declined' }));
  E('r_recv', 'r_auto', { label: 'Silent 24 h' }); E('r_auto', 'r_restock'); E('r_chk', 'r_restock', y()); E('r_disp', 'r_adm'); E('r_adm', 'r_restock', { label: 'Refund' }); E('r_adm', 'r_gap', { label: 'Replacement / pickup' });
  E('r_restock', 'r_chan'); E('r_chan', 'r_wallet', { label: 'Wallet' }); E('r_chan', 'r_card', { label: 'Original' }); E('r_chan', 'r_cash', { label: 'Cash' }); E('r_chan', 'r_man', { label: 'Manual' });
  E('r_card', 'r_fail', n({ label: 'Failed' })); E('r_fail', 'r_chan', loop('Retry leg'));

  /* ---- 6 Settle & pay out ---- */
  T('s_cod', 5, 0, 2, 'action', 'Driver deposits COD cash', 'Driver', 'Cash balance and deposits are tracked in the driver app.', { evidence: 'backend modules/driver/cash' });
  T('s_codok', 5, 0, 3, 'approve', 'Ops confirms or rejects each deposit', 'Admin / ops', 'One deposit at a time on the COD deposit desk.', { touch: tch('confirm', 's_set', ['Deposit confirmed or rejected']), pains: ['G5'], automations: ['I5'] });
  T('s_gapcod', 5, 0, 4, 'gap', 'COD cash is not netted against payouts', 'Nobody', 'COD collected by drivers is not reconciled against what the retailer is owed.', { pains: ['G4'], automations: ['I4'], evidence: 'docs/FLOW_ASSESSMENT.md' });
  T('s_rzp', 5, 0, 6, 'external', 'Razorpay settlement file', 'Razorpay', 'Gateway settlement report.', {});
  T('s_upl', 5, 1, 3, 'doc', 'Admin uploads settlement file, fixes mismatches', 'Admin / ops', 'The file is matched to payments and mismatches are flagged, then resolved by hand.', { touch: tch('upload', 's_set', ['Settlement file', 'Mismatch resolution']), pains: ['G3'], automations: ['I3'], evidence: 'backend shared/payments/reconcile.ts' });
  T('s_early', 5, 1, 1, 'action', 'Retailer requests early disbursement', 'Retailer owner', 'Pays out the last 30 days ahead of the cycle.', {});
  T('s_prev', 5, 2, 3, 'approve', 'Admin previews a store\'s payout cycle (holds, adjustments)', 'Admin / ops', 'Nothing is scheduled. An admin previews each store separately: gross, commission, GST on commission, refunds, holds, adjustments, TCS.', { touch: tch('preview', 's_set', ['Store', 'Cycle', 'Holds and adjustments']), pains: ['G1', 'G34'], automations: ['I1'], evidence: 'backend shared/settlement/run-cycle.ts' });
  T('s_run', 5, 3, 3, 'approve', 'Admin runs the cycle', 'Admin / ops', 'Creates the payout.', { touch: tch('run', 's_set', ['Run cycle']), pains: ['G1'], automations: ['I1'] });
  T('s_math', 5, 3, 4, 'auto', 'Net payout calculated', 'Platform', 'Gross − commission − 18% GST on commission + discount reimbursement − refunds − dispute holds ± adjustments − TCS.', { pains: ['G23'], evidence: 'backend shared/settlement/payout-math.ts' });
  T('s_start', 5, 4, 3, 'approve', 'Admin starts the payout', 'Admin / ops', 'pending to processing.', { touch: tch('start', 's_set', ['Start payout']), pains: ['G1'], automations: ['I1'] });
  T('s_bank', 5, 5, 6, 'external', 'Bank transfer (offline)', 'Bank', 'The transfer is made outside the platform.', {});
  T('s_earlyok', 5, 5, 3, 'approve', 'Admin approves and executes the early payout', 'Admin / ops', 'Two admin steps: approve, then execute.', { touch: tch('approve', 's_set', ['Approve', 'Execute']), automations: ['I1'] });
  T('s_done', 5, 6, 3, 'doc', 'Admin marks complete with the bank reference', 'Admin / ops', 'The reference is typed in by hand.', { touch: tch('enter ref', 's_set', ['Bank reference']), pains: ['G2'], automations: ['I2'] });
  T('s_see', 5, 7, 1, 'action', 'Retailer sees the payout', 'Retailer owner', 'Payout screens in the web portal.', {});
  T('s_set', 5, 3, 7, 'store', 'Admin billing and payouts consoles', 'Web portal (admin)', 'Payout pipeline, billing console, COD desk, reconciliation.', {});
  E('s_cod', 's_codok'); E('s_codok', 's_gapcod', { label: 'Not netted' }); E('s_rzp', 's_upl', { handoff: 'Settlement report' }); E('s_upl', 's_prev', { label: 'Reconciled' }); E('s_prev', 's_run'); E('s_run', 's_math');
  E('s_math', 's_start'); E('s_start', 's_bank', { handoff: 'Payout instruction' }); E('s_bank', 's_done', { handoff: 'Bank confirmation' }); E('s_done', 's_see'); E('s_early', 's_earlyok'); E('s_earlyok', 's_bank');
  E('s_see', 'g_dlr', { label: 'Retailer asks CA' });

  /* ---- 7 GST & tax (retailers) ---- */
  T('g_inv', 6, 0, 4, 'auto', 'Tax and commission invoices issued on delivery', 'Platform', 'TAX-A series to the shopper; COMM-A (SAC 9985 at 18%) from the platform to the retailer. Also supplementary invoice for a kept held item and a credit note on a successful refund.', { evidence: 'backend shared/invoicing/issuance.ts, settlement/commission-invoice.ts' });
  T('g_pos', 6, 0, 1, 'auto', 'Counter sale: POS invoice or bill of supply', 'Platform (POS)', 'Issued inside the sale (POS-A series). Composition dealers get a Bill of Supply here.', { evidence: 'backend shared/pos/pos-invoice.ts' });
  T('g_num', 6, 1, 4, 'auto', 'Gap-free numbering, HSN and rates, PDF stored', 'Platform', 'Numbers run per legal entity, financial year and series. HSN is copied onto each line; rates follow the 2025 slabs. PDFs are uploaded after the database write.', { evidence: 'backend shared/invoicing/numbering.ts, pos/gst-rates.ts' });
  T('g_fail', 6, 2, 4, 'gap', 'Failed invoice issuing is only logged', 'Nobody', 'When automatic issuing fails it writes to the console log. Nothing retries a missing invoice or PDF; admins re-issue from invoice-ops by hand.', { pains: ['G31'], automations: ['I29'] });
  T('g_iss', 6, 3, 4, 'gap', 'Commission invoice: placeholder issuer GSTIN', 'Nobody', 'Issuer is the string PLATFORM-GSTIN with a placeholder address; it is numbered in the retailer\'s series; CGST/SGST vs IGST uses the consumer\'s state; commission is never reversed when an item is returned. Unusable for the retailer\'s input tax credit as it stands.', { pains: ['G18', 'G19'], automations: ['I17'], evidence: 'backend shared/settlement/commission-invoice.ts:106' });
  T('g_comp', 6, 4, 4, 'gap', 'Composition dealers get a tax invoice online', 'Nobody', 'Issuing ignores the store\'s GST scheme. Only the POS path produces a Bill of Supply.', { pains: ['G26'], automations: ['I24'] });
  T('g_b2b', 6, 5, 4, 'gap', 'Online orders are never B2B', 'Nobody', 'The buyer GSTIN is always null.', { pains: ['G27'], automations: ['I25'] });
  T('g_tcs', 6, 6, 4, 'gap', 'TCS rate and base inconsistent', 'Nobody', 'Default 1% where the statutory rate is 0.5%. TCS is added to the invoice total but checkout leaves it out, and the base is after discounts on the invoice but before discounts in payout and statement maths.', { pains: ['G23'], automations: ['I21'], evidence: 'backend config/env.ts:103; shared/invoicing/issuance.ts:161' });
  T('g_cons', 6, 7, 0, 'gap', 'Shoppers cannot fetch their invoices', 'Nobody', 'No invoice endpoint exists under the consumer modules.', { pains: ['G28'], automations: ['I26'] });
  T('g_dlr', 6, 1, 5, 'action', 'Retailer downloads each invoice PDF one by one', 'Retailer finance', 'Tax invoices, commission invoices and credit notes are separate downloads.', { pains: ['G30'], automations: ['I27'], evidence: 'webprotal retailer tax-invoices, commission-invoices' });
  T('g_csv', 6, 2, 5, 'action', 'Retailer exports GST and HSN CSV', 'Retailer finance', 'The summary leaves out online credit notes.', { pains: ['G35', 'G30'], automations: ['I19', 'I27'], evidence: 'backend modules/retailer/reports/gst-reports.controller.ts' });
  T('g_stm', 6, 3, 5, 'gap', 'Retailer statement: PDF button disabled, holds and TCS show 0', 'Nobody', 'The list returns payouts, but liability bookings are always empty and the Download PDF button is permanently disabled.', { pains: ['G29'], automations: ['I27'], evidence: 'webprotal retailer billing-statement-detail.tsx:36' });
  T('g_ca', 6, 5, 6, 'external', 'Retailer\'s CA files GSTR-1 / 3B by hand', 'CA', 'Nothing flows to the GST portal from the platform.', { pains: ['G30'], automations: ['I19', 'I20', 'I28'] });
  T('g_portal', 6, 6, 6, 'external', 'GST portal', 'GSTN', 'Manual filing only.', {});
  T('g_3b', 6, 4, 5, 'gap', 'GSTR-3B is not built', 'Nobody', 'The endpoint returns 501.', { pains: ['G21'], automations: ['I20'], evidence: 'backend modules/admin/invoicing/invoicing.controller.ts:102' });
  T('g_8', 6, 5, 5, 'gap', 'No GSTR-8; TCS file lacks per-supplier totals and tax split', 'Nobody', 'The TCS export is a flat invoice list with no CGST / SGST / IGST split, and credit notes are ignored.', { pains: ['G22'], automations: ['I21'] });
  T('g_tds', 6, 6, 5, 'gap', 'No TDS 194-O ledger, no Form 26Q / 16A', 'Nobody', 'TDS appears only in the terms text.', { pains: ['G24'], automations: ['I22'] });
  T('g_einv', 6, 7, 5, 'gap', 'No e-invoice (IRN / QR) and no e-way bill', 'Nobody', 'Not built for retailers that need them.', { pains: ['G25'], automations: ['I23'] });
  T('g_close', 6, 3, 3, 'approve', 'Admin clicks "Trigger month close"', 'Admin / ops', 'Writes billing statements and PDFs, the TCS CSV and GST files, for each store.', { touch: tch('trigger', 's_gstc', ['Period']), pains: ['G34'], automations: ['I18', 'I33'], evidence: 'backend shared/settlement/statement.ts' });
  T('g_err', 6, 4, 3, 'gap', 'Month close fails (422); period never locked', 'Nobody', 'The button posts "October 2026" and the API accepts only YYYY-MM. closedAt is always null, GST file status is hard-coded to pending, and closing does not lock the period.', { pains: ['G20'], automations: ['I18'], evidence: 'backend modules/admin/settlement validators:37' });
  T('g_gen', 6, 5, 3, 'doc', 'Admin generates GSTR-1 B2C CSV, hands it to a CA', 'Admin / ops', 'One CSV covering every store\'s GSTIN. Credit-note rows have no GSTIN or tax split.', { touch: tch('generate', 's_gstc', ['Period', 'File type']), pains: ['G22', 'G30'], automations: ['I19', 'I33'], evidence: 'backend shared/invoicing/gst-csv.ts' });
  T('g_nonew', 6, 6, 3, 'gap', 'Screen cannot start a new period', 'Nobody', 'The GST-returns screen can only regenerate files that already exist.', { pains: ['G32'], automations: ['I33'], evidence: 'webprotal admin/gst-returns.tsx:61' });
  T('g_gstin', 6, 7, 3, 'gap', 'GSTIN checked for length only', 'Nobody', 'No checksum and no online lookup; marked relaxed for MVP in code.', { pains: ['G12'], automations: ['I11'] });
  T('s_gst', 6, 1, 7, 'store', 'Invoices, credit notes and statements tables', 'Backend (Postgres)', 'invoices, credit_notes, billing_statements, gst_return_files, numbering.', {});
  T('s_gstc', 6, 4, 7, 'store', 'Admin billing, invoice-ops and GST-returns consoles', 'Web portal (admin)', 'Month close, re-issue, numbering rules, GST files.', {});
  E('g_inv', 'g_num'); E('g_pos', 'g_num'); E('g_num', 'g_fail', { label: 'Issue fails' }); E('g_inv', 'g_iss'); E('g_inv', 'g_comp'); E('g_inv', 'g_b2b'); E('g_inv', 'g_cons');
  E('g_num', 'g_dlr'); E('g_dlr', 'g_csv'); E('g_csv', 'g_ca', { handoff: 'GST and HSN CSV' }); E('g_close', 'g_err'); E('g_close', 'g_tcs', { label: 'Computes TCS' }); E('g_err', 'g_gen', { label: 'If it works' });
  E('g_gen', 'g_nonew'); E('g_gen', 'g_ca', { handoff: 'CSV to CA' }); E('g_ca', 'g_portal', { handoff: 'Manual filing' }); E('g_close', 'g_stm', { label: 'Statements' });
  E('g_ca', 'g_3b', { label: 'GSTR-3B' }); E('g_ca', 'g_8'); E('g_ca', 'g_tds'); E('g_ca', 'g_einv');

  /* ---- 8 Oversight & support ---- */
  T('v_iss', 7, 0, 0, 'action', 'Shopper raises a support ticket (tied to an order)', 'Shopper', 'There are no tickets outside an order.', { evidence: 'customer-app, backend modules/consumer/issues' });
  T('v_adm', 7, 1, 3, 'approve', 'Admin assigns, asks for evidence and decides', 'Admin / ops', 'Support tickets and disputes are worked by hand, with bulk-close.', { touch: tch('decide', 's_ops', ['Assign', 'Request evidence', 'Decision']), automations: ['I8'] });
  T('v_mod', 7, 2, 3, 'approve', 'Admin moderates listings, community and reels', 'Admin / ops', 'Listing flags, appeals, takedowns.', { touch: tch('moderate', 's_ops', ['Flag decision']) });
  T('v_kyc', 7, 3, 4, 'auto', 'KYC sweep: overdue cycles, auto-pause after grace', 'Platform', 'Marks overdue cycles and pauses the store; reopens when cleared.', { evidence: 'backend shared/kyc/enforcement.ts' });
  T('v_kycr', 7, 4, 3, 'approve', 'Admin re-verifies KYC and decides change requests', 'Admin / ops', 'Bank, GSTIN, legal name and address changes are decided by an admin.', { touch: tch('decide', 's_ops', ['Change request decision']), automations: ['I12'] });
  T('v_notif', 7, 0, 4, 'gap', 'Notifications are in-app only', 'Nobody', 'Web push is only logged (VAPID not set up). The customer app never registers a push token. FCM is used only to wake driver apps.', { pains: ['G15'], automations: ['I14'] });
  T('v_dig', 7, 1, 4, 'gap', 'Daily digest is written but never emailed', 'Nobody', 'Rows go to email_outbox; an admin triggers it and no mail sender exists.', { pains: ['G15'], automations: ['I14'] });
  T('v_dead', 7, 2, 4, 'gap', 'Dead code: disputes module, retired CheckoutScreen', 'Nobody', 'Unused code that still looks live.', { pains: ['G33'], automations: ['I34'] });
  T('v_sched', 7, 3, 3, 'gap', 'Only order sweeps are scheduled', 'Nobody', 'In-process timers run every 60 s (and the bulk-mockup worker every 5 s). Payouts, month close and GST files all wait for a human.', { pains: ['G34'], automations: ['I1', 'I33'], evidence: 'backend background-jobs.ts' });
  T('v_rep', 7, 5, 3, 'action', 'Admin reads reports and exports CSVs', 'Admin / ops', 'Headline, funnel, operational and compliance reports; listing, inventory and TCS exports.', {});
  T('s_ops', 7, 1, 7, 'store', 'Support, moderation and reports consoles', 'Web portal (admin)', 'Issues, disputes, moderation, reports.', {});
  E('v_iss', 'v_adm'); E('v_adm', 'v_mod', { label: 'Content reports' }); E('v_kyc', 'v_kycr', { label: 'Overdue' }); E('v_notif', 'v_dig'); E('v_adm', 'v_rep');

  /* =========================================================================
   *  BOTTOM HALF: PROPOSED
   * ========================================================================= */

  /* ---- 1 Onboard ---- */
  B('b_crm', 0, 0, 3, 'auto', 'Application auto-creates the CRM lead', 'Platform', 'An app application creates or links the CRM lead, so sales sees the funnel without re-typing.', { change: 'add', replaces: ['t_crm'], automations: ['I12'], why: 'Sales re-keys visits and leads in a separate system today.' });
  B('b_apply', 0, 1, 1, 'action', 'Retailer applies or signs up (as today)', 'Retailer owner', 'Unchanged.', { replaces: ['t_apply'] });
  B('b_gstin', 0, 2, 4, 'auto', 'Automatic GSTIN, PAN and bank verification', 'Platform', 'Validates the GSTIN structure and status, and runs PAN and bank verification through an API instead of an admin typing the result.', { change: 'modify', replaces: ['t_chk'], automations: ['I11', 'I12'], pains: ['G12', 'G13'], why: 'GSTIN is checked for length only and admins record checks by hand.' });
  B('b_appr', 0, 3, 4, 'decision', 'All checks clean?', 'Platform (rule)', 'Clean applications are approved automatically; anything flagged goes to a person.', { change: 'modify', replaces: ['t_appr'], automations: ['I12'], why: 'Every application waits for an admin today.' });
  B('b_exc', 0, 4, 3, 'approve', 'Admin reviews flagged applications and KYC only', 'Admin / ops', 'The desk sees exceptions, not the whole queue.', { change: 'modify', replaces: ['t_kyc', 't_appr'], touch: tch('review', 'bs_onb', ['Flagged items only']), automations: ['I12'] });
  B('b_ai', 0, 5, 4, 'auto', 'AI catalog: quality score and regenerate', 'Platform', 'Each result gets an automatic quality check; a weak result can be regenerated without starting over.', { change: 'modify', replaces: ['t_aigen', 't_aiacc'], automations: ['I13'], pains: ['G14'], why: 'The beta has one attempt, no retry and no regenerate.' });
  B('b_aisamp', 0, 6, 3, 'approve', 'Admin samples AI output; auto-publish when it passes', 'Admin / ops', 'A sample of generated listings is reviewed; passing listings publish on their own.', { change: 'add', replaces: ['t_gapai'], touch: tch('review', 'bs_onb', ['Sampled listings']), automations: ['I13'], why: 'No one reviews AI output today.' });
  B('b_aipub', 0, 7, 1, 'approve', 'Retailer approves once; the listing goes live', 'Retailer staff', 'One approval replaces accept, publish draft, publish again.', { change: 'modify', replaces: ['t_aipub'], touch: tch('approve', 'bs_onb', ['Approve listing']), automations: ['I13'], why: 'Two separate publish steps today.' });
  B('b_live', 0, 8, 4, 'auto', 'Store goes live on the first listing (as today)', 'Platform', 'Unchanged.', { replaces: ['t_live'] });
  B('bs_onb', 0, 3, 7, 'store', 'Onboarding and catalog review queue', 'Web portal (admin)', 'Exceptions and samples only.', { change: 'modify', replaces: ['s_onb'] });
  E('b_crm', 'b_apply'); E('b_apply', 'b_gstin'); E('b_gstin', 'b_appr'); E('b_appr', 'b_ai', y({ condition: 'Clean' })); E('b_appr', 'b_exc', n({ condition: 'Flagged' })); E('b_exc', 'b_ai', { label: 'Cleared' });
  E('b_ai', 'b_aisamp', { handoff: 'Scored listings' }); E('b_aisamp', 'b_aipub'); E('b_aipub', 'b_live'); E('b_ai', 'b_ai', loop('Regenerate', { condition: 'Score too low' }));

  /* ---- 2 Order ---- */
  B('b_mock', 1, 0, 4, 'auto', 'Wire or hide mock-data screens', 'Platform', 'Each mock screen is either connected to real data or removed from the app until it is.', { change: 'modify', replaces: ['o_mock'], automations: ['I15'], pains: ['G16'], why: 'Shoppers see mock results as real.' });
  B('b_cart', 1, 1, 0, 'action', 'Browse, sign in, cart (as today)', 'Shopper', 'Unchanged.', { replaces: ['o_browse', 'o_cart'] });
  B('b_gstcap', 1, 2, 0, 'action', 'Optional business GSTIN at checkout', 'Shopper', 'A business buyer can add a GSTIN and get a B2B invoice.', { change: 'add', replaces: [], automations: ['I25'], why: 'Online orders are never B2B today.' });
  B('b_tcs', 1, 3, 4, 'auto', 'One TCS base and the statutory 0.5% rate', 'Platform', 'Checkout, invoice and payout use the same base and the same rate.', { change: 'modify', replaces: ['g_tcs'], automations: ['I21'], pains: ['G23'], why: 'Invoice, checkout and payout disagree today.' });
  B('b_place', 1, 4, 4, 'auto', 'Place order and take payment (as today)', 'Platform', 'Unchanged.', { replaces: ['o_place', 'o_cap'] });
  B('b_pushtok', 1, 5, 0, 'auto', 'App registers a push token; shopper gets order updates', 'Platform + app', 'Real push for status changes instead of polling the order screen.', { change: 'add', replaces: ['v_notif'], automations: ['I14'], pains: ['G15'], why: 'The app never registers a token and the backend never sends web push.' });
  E('b_mock', 'b_cart'); E('b_cart', 'b_gstcap'); E('b_gstcap', 'b_tcs', { handoff: 'Buyer GSTIN if any' }); E('b_tcs', 'b_place'); E('b_place', 'b_pushtok'); E('b_place', 'b_route');

  /* ---- 3 Fulfil ---- */
  B('b_route', 2, 0, 4, 'auto', 'Rank candidate stores; fail over on reject or timeout', 'Platform', 'More than one store is considered. A reject or a timeout moves to the next store instead of retrying the same one.', { change: 'modify', replaces: ['f_route', 'f_att'], automations: ['I6'], pains: ['G6'], why: 'One candidate store; three tries on it, then cancel.' });
  B('b_lowstock', 2, 0, 1, 'auto', 'Low-stock alert to the retailer', 'Platform', 'Warns before an item sells out and orders start failing.', { change: 'add', replaces: [], automations: ['I36'], why: 'Only a low-stock filter exists today.' });
  B('b_autoacc', 2, 1, 1, 'auto', 'Auto-accept rules; alert only the rest', 'Platform', 'In-hours orders for in-stock items are accepted automatically; the retailer is alerted on the rest.', { change: 'add', replaces: ['f_acc'], automations: ['I6', 'I37'], pains: ['G6'], why: 'Every order needs a human accept inside 180 seconds.' });
  B('b_pack', 2, 2, 1, 'approve', 'Retailer packs (as today)', 'Retailer store staff', 'Unchanged.', { replaces: ['f_pack'], touch: tch('pack', 'bs_adm', ['Mark packed']) });
  B('b_prio', 2, 3, 4, 'auto', 'Express orders jump the dispatch queue', 'Platform', 'Express gets priority in driver offers and assignment.', { change: 'add', replaces: [], automations: ['I7'], pains: ['G7'], why: 'Express is not prioritised today.' });
  B('b_dispatch', 2, 4, 4, 'auto', 'Auto-assign nearest driver; escalate by ladder', 'Platform', 'If nobody claims, the system assigns, then widens the radius, then alerts. Admin is the last step, not the first.', { change: 'modify', replaces: ['f_nodrv', 'f_adm'], automations: ['I8'], pains: ['G8'], why: 'A single alert at 15 minutes and a manual assign.' });
  B('b_code', 2, 5, 1, 'approve', 'Store verifies the driver code (as today)', 'Retailer store staff', 'Unchanged.', { replaces: ['f_code'], touch: tch('verify', 'bs_adm', ['Driver code']) });
  B('bs_adm', 2, 2, 7, 'store', 'Retailer orders board and admin exception queue', 'Web portal', 'Admin sees only exceptions.', { change: 'modify', replaces: ['s_adm', 's_ordc'] });
  E('b_route', 'b_autoacc'); E('b_lowstock', 'b_autoacc'); E('b_autoacc', 'b_pack'); E('b_pack', 'b_prio'); E('b_prio', 'b_dispatch'); E('b_dispatch', 'b_code'); E('b_code', 'b_deliv');

  /* ---- 4 Deliver ---- */
  B('b_map', 3, 0, 0, 'auto', 'Live rider map for the shopper', 'Platform + app', 'The shopper watches the driver instead of polling a status line.', { change: 'add', replaces: [], automations: ['I35'], why: 'There is no live rider map today.' });
  B('b_deliv', 3, 1, 2, 'action', 'Driver delivers: OTP and photo (as today)', 'Driver', 'Unchanged.', { replaces: ['d_done', 'd_otp'] });
  B('b_codnet', 3, 2, 4, 'auto', 'COD amount joins the driver and store settlement', 'Platform', 'Collected cash is recorded against the order for netting at payout time.', { change: 'add', replaces: ['s_gapcod'], automations: ['I4'], pains: ['G4'], why: 'COD cash is not reconciled to payouts.' });
  B('b_arrive', 3, 3, 4, 'auto', 'Return arrival confirmed by scan', 'Platform + retailer app', 'A scan confirms arrival; if nobody scans, escalate instead of one alert.', { change: 'modify', replaces: ['d_arr'], automations: ['I8'], pains: ['G9'], why: 'A human has to remember to confirm.' });
  E('b_deliv', 'b_codnet'); E('b_deliv', 'b_map'); E('b_codnet', 'b_arrive', { label: 'Failed delivery' }); E('b_arrive', 'b_partial', { label: 'Returns' });

  /* ---- 5 Return & refund ---- */
  B('b_partial', 4, 0, 0, 'auto', 'Partial-quantity returns and exchanges', 'Platform + app', 'The shopper can return one of three, or swap for another size.', { change: 'add', replaces: ['r_req'], automations: ['I16'], pains: ['G17'], why: 'A return covers the whole line, with no exchange.' });
  B('b_rpick', 4, 1, 4, 'auto', 'Return pickup auto-assigned; unclaimed escalates', 'Platform', 'Same ladder as outbound dispatch.', { change: 'modify', replaces: ['r_pick'], automations: ['I8'], pains: ['G9'], why: 'Unclaimed pickups only alert after 12 hours.' });
  B('b_small', 4, 2, 4, 'auto', 'Rule engine decides small disputes', 'Platform', 'Disputes under a value threshold with clear evidence are decided by rule.', { change: 'add', replaces: ['r_adm'], automations: ['I10'], pains: ['G11'], why: 'Every dispute lands on an admin.' });
  B('b_adm2', 4, 3, 3, 'approve', 'Admin decides large disputes; outcome acts', 'Admin / ops', 'Replacement and pickup outcomes now create the follow-up task.', { change: 'modify', replaces: ['r_adm', 'r_gap'], touch: tch('decide', 'bs_ret', ['Refund / split / none']), automations: ['I10'], pains: ['G11'], why: 'Some outcomes do nothing today.' });
  B('b_wallet', 4, 4, 4, 'auto', 'Wallet as the default cash-refund route', 'Platform', 'Cash is offered only on request; routine refunds become instant wallet credit.', { change: 'modify', replaces: ['r_cash', 'r_wallet'], automations: ['I9'], pains: ['G10'], why: 'Cash refunds need hand-offs and a manual desk.' });
  B('b_rman', 4, 5, 3, 'doc', 'Manual payout desk for routine refunds', 'Admin / ops', 'Shrinks to exceptions only.', { change: 'remove', replaces: ['r_man'], touch: tch('enter ref', 'bs_ret', ['Payment reference']), automations: ['I9'], why: 'Routine refunds no longer need a typed payment reference.' });
  B('b_rretry', 4, 6, 4, 'auto', 'Failed refund: retry, switch channel, then alert', 'Platform', 'A ladder instead of a single retry.', { change: 'modify', replaces: ['r_fail'], automations: ['I8'], why: 'One retry leg and an alert.' });
  B('bs_ret', 4, 3, 7, 'store', 'Disputes queue with value threshold', 'Admin console', 'Large and flagged cases.', { change: 'modify', replaces: ['s_ret'] });
  E('b_partial', 'b_rpick'); E('b_rpick', 'b_small'); E('b_small', 'b_adm2', { label: 'Large or unclear' }); E('b_small', 'b_wallet', { label: 'Decided by rule' }); E('b_adm2', 'b_wallet');
  E('b_wallet', 'b_rretry', { label: 'Original payment' }); E('b_rretry', 'b_rman', { label: 'Still failing' });

  /* ---- 6 Settle ---- */
  B('b_sched', 5, 0, 4, 'auto', 'Scheduled payout cycles per store cadence', 'Platform', 'Cycles run on their own on each store\'s cadence (for example 7 days).', { change: 'add', replaces: ['s_prev', 's_run', 's_start'], automations: ['I1'], pains: ['G1', 'G34'], why: 'An admin previews, runs and starts every payout by hand.' });
  B('b_recon', 5, 1, 4, 'auto', 'Razorpay settlement reconciled through the API', 'Platform', 'Settlements are pulled and matched automatically; admin sees mismatches only.', { change: 'modify', replaces: ['s_upl', 's_rzp'], automations: ['I3'], pains: ['G3'], why: 'An admin uploads a file and matches by hand.' });
  B('b_remove', 5, 2, 3, 'doc', 'Manual settlement-file upload', 'Admin / ops', 'Goes away once the API reconciliation runs.', { change: 'remove', replaces: ['s_upl'], touch: tch('upload', 'bs_set', ['Settlement file']), automations: ['I3'] });
  B('b_net', 5, 3, 4, 'auto', 'COD deposits matched to payouts; shortfall netted', 'Platform', 'Deposits are matched to driver COD balances and netted against what the retailer is owed.', { change: 'add', replaces: ['s_codok', 's_gapcod'], automations: ['I4', 'I5'], pains: ['G4', 'G5'], why: 'Ops confirms each deposit; nothing nets COD.' });
  B('b_codq', 5, 4, 3, 'approve', 'Ops handles unmatched deposits only', 'Admin / ops', 'Exceptions queue.', { change: 'modify', replaces: ['s_codok'], touch: tch('review', 'bs_set', ['Unmatched deposit']), automations: ['I5'] });
  B('b_exc2', 5, 5, 3, 'approve', 'Admin approves exceptions: holds, large payouts', 'Admin / ops', 'Approve by exception instead of by cycle.', { change: 'modify', replaces: ['s_prev', 's_earlyok'], touch: tch('approve', 'bs_set', ['Exception']), automations: ['I1'] });
  B('b_pay', 5, 6, 6, 'external', 'Bank or payout API', 'Bank', 'A payout API replaces the offline transfer where available.', { replaces: ['s_bank'] });
  B('b_done', 5, 7, 4, 'auto', 'Payout marked complete from bank confirmation', 'Platform', 'The reference is stored automatically.', { change: 'modify', replaces: ['s_done'], automations: ['I2'], pains: ['G2'], why: 'The bank reference is typed by hand today.' });
  B('b_early', 5, 8, 4, 'auto', 'Early disbursement: eligibility checked automatically', 'Platform', 'One-click approve; the system calculates the last-30-days amount.', { change: 'modify', replaces: ['s_earlyok', 's_early'], automations: ['I1'], why: 'Two admin steps today.' });
  B('bs_set', 5, 3, 7, 'store', 'Payouts exception dashboard', 'Admin console', 'Only items that need a person.', { change: 'modify', replaces: ['s_set'] });
  E('b_sched', 'b_recon'); E('b_recon', 'b_remove', { label: 'Upload no longer needed' }); E('b_recon', 'b_net'); E('b_net', 'b_codq', { label: 'Unmatched' }); E('b_net', 'b_exc2', { label: 'Matched' }); E('b_codq', 'b_exc2');
  E('b_exc2', 'b_pay', { handoff: 'Payout instruction' }); E('b_pay', 'b_done', { handoff: 'Bank confirmation' }); E('b_done', 'b_early'); E('b_done', 'b_gfile');

  /* ---- 7 GST (retailers) ---- */
  B('b_ginv', 6, 0, 4, 'auto', 'Invoices issued on delivery (as today, with fixes)', 'Platform', 'Tax invoice, commission invoice, supplementary invoice and credit note keep working; the fixes below change how they are built.', { replaces: ['g_inv', 'g_pos', 'g_num'] });
  B('b_issuer', 6, 1, 4, 'auto', 'Commission invoice: real GSTIN, series, place of supply', 'Platform', 'The issuer is the platform with a real GSTIN and address; numbering uses the platform series; CGST/SGST vs IGST follows platform and retailer states; a return reverses the commission.', { change: 'modify', replaces: ['g_iss'], automations: ['I17'], pains: ['G18', 'G19'], why: 'Placeholder issuer, wrong series and tax split; never reversed. The retailer cannot claim input tax credit.' });
  B('b_comp', 6, 2, 4, 'auto', 'Bill of supply online for composition dealers', 'Platform', 'Issuing reads the store\'s GST scheme and chooses the document.', { change: 'modify', replaces: ['g_comp'], automations: ['I24'], pains: ['G26'], why: 'Only POS did this.' });
  B('b_b2b', 6, 3, 4, 'auto', 'B2B invoices carry the buyer GSTIN', 'Platform', 'Fed by the optional GSTIN at checkout.', { change: 'add', replaces: ['g_b2b'], automations: ['I25'], pains: ['G27'], why: 'Buyer GSTIN is always null today.' });
  B('b_retry', 6, 4, 4, 'auto', 'Invoice retry queue with alerts', 'Platform', 'A failed invoice or PDF is retried and raised, not just logged.', { change: 'add', replaces: ['g_fail'], automations: ['I29'], pains: ['G31'], why: 'Failures only reach the console log.' });
  B('b_tcs2', 6, 5, 4, 'auto', 'TCS booked once, at 0.5%, with per-supplier totals', 'Platform', 'One calculation feeds invoice, payout and the GSTR-8 file.', { change: 'modify', replaces: ['g_tcs', 'g_8'], automations: ['I21'], pains: ['G23', 'G22'], why: 'Three bases and the wrong default rate.' });
  B('b_health', 6, 6, 4, 'auto', 'GST health dashboard', 'Platform', 'Missing HSN, bad GSTIN, unissued invoices and failed PDFs, per retailer.', { change: 'add', replaces: [], automations: ['I32'], why: 'Nothing shows these today.' });
  B('b_cons', 6, 7, 0, 'auto', 'Shopper can view and email their invoice', 'Platform + app', 'An invoice screen in the customer app and an email on delivery.', { change: 'add', replaces: ['g_cons'], automations: ['I26'], pains: ['G28'], why: 'Shoppers cannot fetch invoices.' });
  B('b_gstr1', 6, 1, 5, 'auto', 'GSTR-1 per retailer GSTIN, on schedule', 'Platform', 'One file set per retailer GSTIN with correct tax split, instead of a single CSV for every store.', { change: 'add', replaces: ['g_gen', 'g_csv'], automations: ['I19', 'I33'], pains: ['G22', 'G35'], why: 'A single B2C CSV for all stores; credit notes without tax split.' });
  B('b_3b', 6, 2, 5, 'auto', 'GSTR-3B summary per retailer', 'Platform', 'Outward supplies, tax and input tax credit figures ready to file.', { change: 'add', replaces: ['g_3b'], automations: ['I20'], pains: ['G21'], why: 'The endpoint returns 501.' });
  B('b_tds', 6, 3, 5, 'auto', 'TDS 194-O ledger; Form 26Q / 16A data', 'Platform', 'Per-retailer deductions with certificates.', { change: 'add', replaces: ['g_tds'], automations: ['I22'], pains: ['G24'], why: 'Not built.' });
  B('b_einv', 6, 4, 5, 'auto', 'E-invoice (IRN / QR) and e-way bill where required', 'Platform', 'For retailers above the threshold or moving goods that need a bill.', { change: 'add', replaces: ['g_einv'], automations: ['I23'], pains: ['G25'], why: 'Not built.' });
  B('b_pack2', 6, 5, 5, 'auto', 'Retailer GST pack and working statements', 'Platform', 'One download per month replaces invoice-by-invoice exports. Holds and TCS show real figures; the statement PDF works.', { change: 'modify', replaces: ['g_dlr', 'g_csv', 'g_stm'], automations: ['I27'], pains: ['G29', 'G30'], why: 'Invoices are downloaded one at a time; statements show 0 and the PDF button is off.' });
  B('b_cal', 6, 6, 5, 'auto', 'Filing calendar and deadline reminders', 'Platform', 'Due dates per return and per retailer, with reminders.', { change: 'add', replaces: [], automations: ['I30'], why: 'No calendar exists.' });
  B('b_2b', 6, 7, 5, 'auto', 'GSTR-2B reconciliation against commission invoices', 'Platform', 'Shows which commission invoices the retailer can claim.', { change: 'add', replaces: [], automations: ['I31'], why: 'Retailers reconcile by hand.' });
  B('b_file', 6, 8, 5, 'approve', 'Retailer reviews pack, files or shares with CA', 'Retailer finance', 'One review step before filing.', { change: 'modify', replaces: ['g_ca'], touch: tch('review', 'bs_gst', ['GST pack', 'Share with CA']), automations: ['I27', 'I28'] });
  B('b_carole', 6, 8, 6, 'auto', 'Read-only CA role and share link', 'Platform', 'The CA signs in with a read-only role or opens a time-boxed link.', { change: 'add', replaces: ['g_ca'], automations: ['I28'], pains: ['G30'], why: 'CSV files are handed over by hand today.' });
  B('b_portal', 6, 9, 6, 'external', 'GST portal (CA or retailer files)', 'GSTN', 'Filing remains with the retailer or their CA; the data arrives ready.', { replaces: ['g_portal'] });
  B('b_close', 6, 1, 3, 'approve', 'Working month close; period locked after', 'Admin / ops', 'The period format is fixed and the screen starts a new period. After close the period is locked and closedAt is recorded.', { change: 'modify', replaces: ['g_close', 'g_err', 'g_nonew'], touch: tch('trigger', 'bs_gstc', ['Period']), automations: ['I18'], pains: ['G20', 'G32'], why: 'The button fails with a 422 and nothing locks the period.' });
  B('b_gfile', 6, 2, 3, 'auto', 'Scheduled GST file generation', 'Platform', 'Files for every retailer are generated on a calendar, not by an admin clicking.', { change: 'add', replaces: ['g_gen'], automations: ['I33'], pains: ['G34'], why: 'Admin generates each file by hand.' });
  B('b_rmhand', 6, 3, 3, 'doc', 'Admin hand-off of CSV files to a CA', 'Admin / ops', 'Disappears when the pack and CA role exist.', { change: 'remove', replaces: ['g_gen'], touch: tch('generate', 'bs_gstc', ['CSV hand-off']), automations: ['I28'] });
  B('b_gstin2', 6, 5, 3, 'auto', 'GSTIN verified at signup and on every change request', 'Platform', 'Same verification as onboarding, also applied when a retailer changes GSTIN.', { change: 'modify', replaces: ['g_gstin'], automations: ['I11'], pains: ['G12'], why: 'Length-only check.' });
  B('bs_gst', 6, 1, 7, 'store', 'Retailer GST and finance screens', 'Web portal (retailer)', 'One place for invoices, returns data and certificates.', { change: 'modify', replaces: ['s_gst'] });
  B('bs_gstc', 6, 4, 7, 'store', 'Admin billing, GST health and schedules', 'Web portal (admin)', 'Exceptions and schedules.', { change: 'modify', replaces: ['s_gstc'] });
  E('b_ginv', 'b_issuer'); E('b_issuer', 'b_comp'); E('b_comp', 'b_b2b'); E('b_b2b', 'b_retry'); E('b_retry', 'b_tcs2'); E('b_tcs2', 'b_health'); E('b_ginv', 'b_cons');
  E('b_close', 'b_gfile'); E('b_gfile', 'b_rmhand', { label: 'Hand-off retired' }); E('b_gfile', 'b_gstr1', { handoff: 'Files per GSTIN' });
  E('b_gstr1', 'b_3b'); E('b_3b', 'b_tds'); E('b_tds', 'b_einv'); E('b_einv', 'b_pack2'); E('b_pack2', 'b_cal'); E('b_cal', 'b_2b'); E('b_2b', 'b_file'); E('b_file', 'b_carole', { label: 'Share' }); E('b_carole', 'b_portal', { handoff: 'Return data' });
  E('b_tcs2', 'b_gstr1', { label: 'TCS and credit notes' });

  /* ---- 8 Oversight ---- */
  B('b_sup', 7, 0, 0, 'auto', 'Support tickets routed with SLA timers', 'Platform', 'Tickets reach the right queue and escalate when they sit.', { change: 'modify', replaces: ['v_iss', 'v_adm'], automations: ['I8'], why: 'Worked by hand with no timers.' });
  B('b_push', 7, 1, 4, 'auto', 'Real push and email digest to admins and retailers', 'Platform', 'Push is actually sent and the digest has a mail sender.', { change: 'modify', replaces: ['v_notif', 'v_dig'], automations: ['I14'], pains: ['G15'], why: 'Push is only logged; the digest is never sent.' });
  B('b_dead', 7, 2, 4, 'auto', 'Remove dead code', 'Engineering', 'Delete what is unused so it stops looking live.', { change: 'remove', replaces: ['v_dead'], automations: ['I34'], pains: ['G33'], why: 'Unused code still looks live.' });
  B('b_kyc2', 7, 3, 4, 'auto', 'KYC renewals nudged; admin sees rejects', 'Platform', 'Retailers get reminders; only failures reach the desk.', { change: 'modify', replaces: ['v_kycr', 'v_kyc'], automations: ['I12'], why: 'Admins decide every renewal and change request.' });
  B('b_sch', 7, 4, 4, 'auto', 'One scheduler for all recurring jobs', 'Platform', 'A single job runner with retries, instead of in-process timers and human triggers.', { change: 'add', replaces: ['v_sched'], automations: ['I1', 'I33'], pains: ['G34'], why: 'Only order sweeps are scheduled.' });
  B('b_dash', 7, 5, 3, 'auto', 'Ops dashboard: queues with SLA and exceptions today', 'Platform', 'One view of every desk and what is overdue.', { change: 'add', replaces: ['v_rep', 'v_mod'], automations: ['I8'], why: 'Reports are read and exported by hand.' });
  E('b_sup', 'b_push'); E('b_kyc2', 'b_dash'); E('b_sch', 'b_dash');

  var glossary = [
    ['Trendzo', 'The shopper app and marketplace', 'Internally known as closetx.'],
    ['COD', 'Cash on Delivery', 'The shopper pays cash to the driver at the door.'],
    ['OTP', 'One-Time Password', 'A short code sent by SMS to confirm a phone number or a delivery.'],
    ['FCM', 'Firebase Cloud Messaging', 'Google\'s push-notification service; used here to wake driver apps for new offers.'],
    ['MSG91', 'SMS / OTP provider', 'Sends OTP messages; Slide is the alternative provider.'],
    ['Razorpay', 'Payment gateway', 'Takes card and UPI payments, sends settlement reports and webhooks.'],
    ['Vertex', 'Google Vertex AI', 'Used for virtual try-on and AI product images.'],
    ['Try-and-Buy', 'Delivery mode with a door window', 'The shopper tries items at the door and keeps or returns each one.'],
    ['KYC', 'Know Your Customer', 'Identity and business documents a retailer must provide and renew.'],
    ['penny-drop', 'Bank account check', 'A tiny deposit used to confirm an account number and holder name.'],
    ['POS', 'Point of Sale', 'Counter billing at the store.'],
    ['CRM', 'Customer Relationship Management', 'Here, the field-sales tool used to track store visits.'],
    ['GST', 'Goods and Services Tax', 'Indian indirect tax charged on goods and services.'],
    ['GSTIN', 'GST Identification Number', 'A business\'s 15-character GST registration number.'],
    ['GSTR-1', 'GST return of outward supplies', 'Monthly or quarterly list of sales invoices a seller has issued.'],
    ['GSTR-2B', 'Auto-drafted input tax credit statement', 'Shows purchase invoices a buyer can claim tax credit on.'],
    ['GSTR-3B', 'Summary GST return with tax payment', 'Monthly summary of sales, input credit and tax payable.'],
    ['GSTR-8', 'Return filed by e-commerce operators', 'Reports the tax collected at source (TCS) on sellers\' sales.'],
    ['TCS', 'Tax Collected at Source', 'Tax a marketplace collects from payouts to sellers and pays to the government.'],
    ['TDS 194-O', 'Tax Deducted at Source on e-commerce payments', 'A deduction a marketplace makes from seller payouts; needs Form 26Q and certificates.'],
    ['Form 26Q', 'Quarterly TDS return', 'Filed for non-salary deductions.'],
    ['Form 16A', 'TDS certificate', 'Given to the person whose tax was deducted.'],
    ['IRN', 'Invoice Reference Number', 'Unique number the GST portal gives a registered e-invoice.'],
    ['e-invoice', 'Electronic invoice', 'An invoice registered on the GST portal to get an IRN and QR code.', true],
    ['e-way bill', 'Electronic way bill', 'Transport document required for moving goods above a value limit.', true],
    ['HSN', 'Harmonized System of Nomenclature', 'Code that classifies goods and decides the GST rate.'],
    ['SAC', 'Services Accounting Code', 'Like HSN, but for services; commission is billed under SAC 9985.'],
    ['IGST', 'Integrated GST', 'Charged on sales between states.'],
    ['CGST', 'Central GST', 'Half of the tax on sales within a state.'],
    ['SGST', 'State GST', 'The other half of the tax on sales within a state.'],
    ['ITC', 'Input Tax Credit', 'Tax paid on purchases that a business can set off against tax it owes.'],
    ['B2B', 'Business to Business', 'A sale to a registered business with a GSTIN.'],
    ['B2C', 'Business to Consumer', 'A sale to an individual without a GSTIN.'],
    ['credit note', 'Document that reduces an earlier invoice', 'Issued when an item is returned or refunded.', true],
    ['debit note', 'Document that increases an earlier invoice', 'Not issued by the platform today.', true],
    ['bill of supply', 'Invoice without tax', 'Issued by composition dealers, who cannot charge GST separately.', true],
    ['composition', 'Composition scheme', 'A simple GST scheme for small sellers: fixed low rate, no input credit, bill of supply.', true],
    ['place of supply', 'The state a sale is treated as made in', 'Decides CGST + SGST versus IGST.', true],
    ['commission invoice', 'Invoice from the platform to a retailer for its fee', 'Retailers use it to claim input credit on the commission.', true],
    ['payout cycle', 'A period of orders paid out to a store together', 'Net of commission, GST on commission, refunds, holds and TCS.', true],
    ['sweep', 'A background job that runs every minute', 'Cancels abandoned payments, retries refunds, raises alerts.', true],
    ['SLA', 'Service Level Agreement', 'A time limit for responding or resolving.'],
    ['CA', 'Chartered Accountant', 'The retailer\'s accountant who files returns.'],
    ['AMC', 'Annual Maintenance Contract', '']
  ].filter(function (g) { return g[0] !== 'AMC'; });

  window.PROCESS = { meta: meta, glossary: glossary, stages: stages, lanes: lanes, pains: pains, automations: automations, nodes: nodes, edges: edges };
})();
