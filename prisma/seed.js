const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');
const db = new Database(dbPath);

const now = new Date().toISOString();

// ─── Helper ────────────────────────────────────────────────
function upsert(table, data) {
  const keys = Object.keys(data);
  const placeholders = keys.map(() => '?').join(', ');
  const updates = keys.filter(k => k !== 'id').map(k => `${k} = excluded.${k}`).join(', ');
  db.prepare(
    `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})
     ON CONFLICT(id) DO UPDATE SET ${updates}`
  ).run(...Object.values(data));
}

// ─── Users ─────────────────────────────────────────────────
const hashed = bcrypt.hashSync('password123', 10);
const userId = 'user_seed_001';
const saraId = 'user_seed_002';
const teamId = 'team_seed_001';

upsert('User', { id: userId, name: 'Rory G.', email: 'rory@atelier.com', password: hashed, onboardingComplete: 1, createdAt: now, updatedAt: now });
upsert('User', { id: saraId, name: 'Sara M.', email: 'sara@atelier.com', password: hashed, onboardingComplete: 1, createdAt: now, updatedAt: now });

// ─── Team ──────────────────────────────────────────────────
upsert('Team', { id: teamId, name: 'Atelier Demo', createdAt: now, updatedAt: now });
upsert('TeamMember', { id: 'member_seed_001', userId, teamId, role: 'admin', joinedAt: now });
upsert('TeamMember', { id: 'member_seed_002', userId: saraId, teamId, role: 'editor', joinedAt: now });

// ─── Ingredients ───────────────────────────────────────────
const ingredients = [
  { id: 'ing_01', name: 'Aqua',                    casNumber: '7732-18-5',     function: 'Solvent',         description: 'Purified water, base solvent for all formulations' },
  { id: 'ing_02', name: 'Sodium Laureth Sulfate',   casNumber: '9004-82-4',     function: 'Surfactant',      description: 'Primary cleansing agent, anionic surfactant' },
  { id: 'ing_03', name: 'Cocamidopropyl Betaine',   casNumber: '61789-40-0',    function: 'Surfactant',      description: 'Mild amphoteric surfactant, foam booster' },
  { id: 'ing_04', name: 'Zinc Pyrithione',          casNumber: '13463-41-7',    function: 'Antidandruff',    description: 'Active antifungal and antibacterial agent' },
  { id: 'ing_05', name: 'Niacinamide',              casNumber: '98-92-0',       function: 'Active',          description: 'Vitamin B3, improves barrier function and reduces inflammation' },
  { id: 'ing_06', name: 'Sodium Chloride',          casNumber: '7647-14-5',     function: 'Viscosity agent', description: 'Common salt, used to adjust viscosity in sulfate systems' },
  { id: 'ing_07', name: 'Glycerin',                 casNumber: '56-81-5',       function: 'Humectant',       description: 'Moisturising agent, draws water to the skin' },
  { id: 'ing_08', name: 'Salicylic Acid',           casNumber: '69-72-7',       function: 'Exfoliant',       description: 'BHA, unclogs pores, restricted in cosmetics' },
  { id: 'ing_09', name: 'Panthenol',                casNumber: '81-13-0',       function: 'Conditioner',     description: 'Pro-vitamin B5, moisturises and conditions hair and skin' },
  { id: 'ing_10', name: 'Piroctone Olamine',        casNumber: '68890-66-4',    function: 'Antidandruff',    description: 'Second-generation antidandruff active, less toxic than ZPT' },
  { id: 'ing_11', name: 'Polyquaternium-10',        casNumber: '68610-92-4',    function: 'Film-former',     description: 'Cationic polymer, improves wet combability' },
  { id: 'ing_12', name: 'Menthol',                  casNumber: '89-78-1',       function: 'Active/Sensory',  description: 'Cooling agent, provides tingling sensation' },
  { id: 'ing_13', name: 'Methylisothiazolinone',    casNumber: '2682-20-4',     function: 'Preservative',    description: 'Broad-spectrum preservative, EU-restricted concentration' },
  { id: 'ing_14', name: 'Parfum',                   casNumber: null,            function: 'Fragrance',       description: 'Fragrance blend, proprietary composition' },
  { id: 'ing_15', name: 'Citric Acid',              casNumber: '77-92-9',       function: 'pH Adjuster',     description: 'Acidulant, adjusts pH to target range' },
  { id: 'ing_16', name: 'EDTA',                     casNumber: '60-00-4',       function: 'Chelating agent', description: 'Binds metal ions, prevents product degradation' },
  // Additional common ingredients for other formulations
  { id: 'ing_17', name: 'Hyaluronic Acid',          casNumber: '9004-61-9',     function: 'Humectant',       description: 'High molecular weight humectant, intense hydration' },
  { id: 'ing_18', name: 'Ascorbic Acid',            casNumber: '50-81-7',       function: 'Active',          description: 'Vitamin C, antioxidant and brightening agent' },
  { id: 'ing_19', name: 'Tocopherol',               casNumber: '59-02-9',       function: 'Antioxidant',     description: 'Vitamin E, protects against oxidative stress' },
  { id: 'ing_20', name: 'Ceramide NP',              casNumber: '100403-19-8',   function: 'Active',          description: 'Skin-identical lipid, repairs barrier function' },
  { id: 'ing_21', name: 'Cetearyl Alcohol',         casNumber: '67762-27-0',    function: 'Emollient',       description: 'Fatty alcohol, thickener and emollient' },
  { id: 'ing_22', name: 'Dimethicone',              casNumber: '9006-65-9',     function: 'Emollient',       description: 'Silicone, smoothing and conditioning agent' },
  { id: 'ing_23', name: 'Phenoxyethanol',           casNumber: '122-99-6',      function: 'Preservative',    description: 'Broad-spectrum preservative, widely accepted' },
  { id: 'ing_24', name: 'Titanium Dioxide',         casNumber: '13463-67-7',    function: 'UV Filter',       description: 'Physical sunscreen agent, broad-spectrum UV protection' },
  { id: 'ing_25', name: 'Zinc Oxide',               casNumber: '1314-13-2',     function: 'UV Filter',       description: 'Physical sunscreen, UVA protection' },
  { id: 'ing_26', name: 'Collagen',                 casNumber: '9007-34-5',     function: 'Active',          description: 'Marine-derived collagen, firming and plumping' },
  { id: 'ing_27', name: 'Tea Tree Oil',             casNumber: '68647-73-4',    function: 'Active',          description: 'Melaleuca alternifolia, antibacterial and clarifying' },
  { id: 'ing_28', name: 'Biotin',                   casNumber: '58-85-5',       function: 'Active',          description: 'Vitamin B7, strengthens hair and nails' },
  { id: 'ing_29', name: 'Keratin',                  casNumber: '68238-35-7',    function: 'Active',          description: 'Hydrolysed keratin, repairs damaged hair structure' },
  { id: 'ing_30', name: 'Rosa Canina Seed Oil',     casNumber: '84603-93-0',    function: 'Emollient',       description: 'Rosehip oil, rich in essential fatty acids and retinoids' },
];

for (const ing of ingredients) {
  upsert('Ingredient', ing);
}

// ─── Formulations ──────────────────────────────────────────
const formulations = [
  { id: 'form_01', name: 'Hydra-Plump Moisture Serum',          category: 'Serum',       status: 'Approved',  market: 'EU',     description: 'Intensive hydration serum with hyaluronic acid complex for deep moisture retention.',        version: '2.1' },
  { id: 'form_02', name: 'Keratin Shield Repair Shampoo',        category: 'Shampoo',     status: 'Approved',  market: 'US',     description: 'Strengthening shampoo with hydrolysed keratin for damaged and chemically treated hair.',    version: '1.3' },
  { id: 'form_03', name: 'Overnight Restore Night Cream',        category: 'Moisturiser', status: 'Approved',  market: 'UK',     description: 'Rich night cream with ceramides and peptides for overnight skin repair and regeneration.',  version: '3.0' },
  { id: 'form_04', name: 'AHA Renewal Facial Toner',             category: 'Toner',       status: 'Draft',     market: 'EU',     description: 'Gentle exfoliating toner with alpha hydroxy acids for smoother, brighter skin.',            version: '1.0' },
  { id: 'form_05', name: 'SPF50 Daily Defense Moisturiser',      category: 'SPF',         status: 'Approved',  market: 'Global', description: 'Lightweight daily moisturiser with broad-spectrum SPF50 protection.',                       version: '2.2' },
  { id: 'form_06', name: 'Marine Collagen Firming Mask',         category: 'Mask',        status: 'Approved',  market: 'KR',     description: 'Sheet mask infused with marine collagen for intense firming and plumping benefits.',         version: '1.5' },
  { id: 'form_07', name: 'Scalp Purify Anti-Dandruff Treatment', category: 'Treatment',   status: 'Approved',  market: 'UK',     description: 'Clinical-strength anti-dandruff treatment with zinc pyrithione and salicylic acid.',        version: '4.0' },
  { id: 'form_08', name: 'Biotin Strengthen Hair Conditioner',   category: 'Conditioner', status: 'Draft',     market: 'US',     description: 'Fortifying conditioner with biotin and panthenol for fine, thinning hair.',                 version: '1.1' },
  { id: 'form_09', name: 'Vitamin C Brightening Cleanser',       category: 'Cleanser',    status: 'Approved',  market: 'EU',     description: 'Daily cleanser with stabilised vitamin C for brightening and evening skin tone.',            version: '2.0' },
  { id: 'form_10', name: 'Rose Hip Recovery Face Oil',           category: 'Oil',         status: 'Archived',  market: 'UK',     description: 'Nourishing face oil with cold-pressed rosehip seed oil for sensitive, reactive skin.',       version: '1.2' },
  { id: 'form_11', name: 'Ceramide Barrier Repair Serum',        category: 'Serum',       status: 'Approved',  market: 'EU',     description: 'Barrier-restoring serum with triple ceramide complex for compromised skin.',                version: '3.1' },
  { id: 'form_12', name: 'Tea Tree Clarifying Toner',            category: 'Toner',       status: 'Approved',  market: 'US',     description: 'Oil-control toner with tea tree oil and niacinamide for blemish-prone skin.',                version: '2.3' },
];

for (const f of formulations) {
  upsert('Formulation', { ...f, teamId, createdById: userId, createdAt: now, updatedAt: now });
}

// ─── Formulation Ingredients (for Scalp Purify — form_07) ──
const form07Ingredients = [
  { ingredientId: 'ing_01', percentage: 72.00, role: 'Base' },
  { ingredientId: 'ing_02', percentage: 10.00, role: 'Active' },
  { ingredientId: 'ing_03', percentage: 8.00,  role: 'Active' },
  { ingredientId: 'ing_04', percentage: 1.00,  role: 'Active' },
  { ingredientId: 'ing_05', percentage: 1.50,  role: 'Active' },
  { ingredientId: 'ing_06', percentage: 1.00,  role: 'Base' },
  { ingredientId: 'ing_07', percentage: 2.00,  role: 'Base' },
  { ingredientId: 'ing_08', percentage: 0.50,  role: 'Active' },
  { ingredientId: 'ing_09', percentage: 0.50,  role: 'Active' },
  { ingredientId: 'ing_10', percentage: 0.50,  role: 'Active' },
  { ingredientId: 'ing_11', percentage: 0.30,  role: 'Base' },
  { ingredientId: 'ing_12', percentage: 0.25,  role: 'Active' },
  { ingredientId: 'ing_13', percentage: 0.15,  role: 'Preservative' },
  { ingredientId: 'ing_14', percentage: 0.50,  role: 'Fragrance' },
  { ingredientId: 'ing_15', percentage: 0.20,  role: 'Base' },
  { ingredientId: 'ing_16', percentage: 0.10,  role: 'Base' },
];

for (let i = 0; i < form07Ingredients.length; i++) {
  const fi = form07Ingredients[i];
  upsert('FormulationIngredient', {
    id: `fi_07_${String(i + 1).padStart(2, '0')}`,
    formulationId: 'form_07',
    ...fi,
  });
}

// ─── Formulation Ingredients (for Hydra-Plump Serum — form_01) ──
const form01Ingredients = [
  { ingredientId: 'ing_01', percentage: 78.00, role: 'Base' },
  { ingredientId: 'ing_17', percentage: 2.00,  role: 'Active' },
  { ingredientId: 'ing_07', percentage: 5.00,  role: 'Base' },
  { ingredientId: 'ing_05', percentage: 3.00,  role: 'Active' },
  { ingredientId: 'ing_21', percentage: 4.00,  role: 'Base' },
  { ingredientId: 'ing_22', percentage: 3.00,  role: 'Base' },
  { ingredientId: 'ing_19', percentage: 1.00,  role: 'Active' },
  { ingredientId: 'ing_23', percentage: 0.80,  role: 'Preservative' },
  { ingredientId: 'ing_14', percentage: 0.50,  role: 'Fragrance' },
  { ingredientId: 'ing_15', percentage: 0.20,  role: 'Base' },
];

for (let i = 0; i < form01Ingredients.length; i++) {
  const fi = form01Ingredients[i];
  upsert('FormulationIngredient', {
    id: `fi_01_${String(i + 1).padStart(2, '0')}`,
    formulationId: 'form_01',
    ...fi,
  });
}

// ─── Formulation Ingredients (for Vitamin C Cleanser — form_09) ──
const form09Ingredients = [
  { ingredientId: 'ing_01', percentage: 74.00, role: 'Base' },
  { ingredientId: 'ing_18', percentage: 3.00,  role: 'Active' },
  { ingredientId: 'ing_03', percentage: 8.00,  role: 'Active' },
  { ingredientId: 'ing_07', percentage: 4.00,  role: 'Base' },
  { ingredientId: 'ing_19', percentage: 1.00,  role: 'Active' },
  { ingredientId: 'ing_05', percentage: 2.00,  role: 'Active' },
  { ingredientId: 'ing_21', percentage: 3.00,  role: 'Base' },
  { ingredientId: 'ing_23', percentage: 0.80,  role: 'Preservative' },
  { ingredientId: 'ing_14', percentage: 0.50,  role: 'Fragrance' },
  { ingredientId: 'ing_15', percentage: 0.20,  role: 'Base' },
];

for (let i = 0; i < form09Ingredients.length; i++) {
  const fi = form09Ingredients[i];
  upsert('FormulationIngredient', {
    id: `fi_09_${String(i + 1).padStart(2, '0')}`,
    formulationId: 'form_09',
    ...fi,
  });
}

// ─── Packaging Options ─────────────────────────────────────
const packaging = [
  { id: 'pkg_01', name: 'Airless Pump Bottle 30ml',   format: 'Bottle', material: 'PP',             moq: 5000,  unitCost: 0.85, leadTime: '4-6 weeks', status: 'Available',   description: 'Premium airless pump mechanism prevents product oxidation. Matte white finish.' },
  { id: 'pkg_02', name: 'Amber Glass Dropper 30ml',   format: 'Bottle', material: 'Glass',          moq: 3000,  unitCost: 1.20, leadTime: '3-5 weeks', status: 'Available',   description: 'UV-protective amber glass with precision dropper. Ideal for serums and oils.' },
  { id: 'pkg_03', name: 'Aluminium Tube 100ml',        format: 'Tube',   material: 'Aluminium',      moq: 10000, unitCost: 0.45, leadTime: '6-8 weeks', status: 'Available',   description: 'Lightweight aluminium tube with brushed silver finish. Fully recyclable.' },
  { id: 'pkg_04', name: 'Squeeze Tube 150ml',          format: 'Tube',   material: 'HDPE',           moq: 8000,  unitCost: 0.35, leadTime: '4-6 weeks', status: 'Available',   description: 'Flexible HDPE squeeze tube, gloss white finish. Ideal for shampoos and conditioners.' },
  { id: 'pkg_05', name: 'Frosted Glass Jar 50ml',      format: 'Jar',    material: 'Glass',          moq: 2000,  unitCost: 1.50, leadTime: '5-7 weeks', status: 'Available',   description: 'Elegant frosted glass jar for premium creams and masks.' },
  { id: 'pkg_06', name: 'Wide-Mouth Jar 100ml',        format: 'Jar',    material: 'PET',            moq: 5000,  unitCost: 0.60, leadTime: '3-5 weeks', status: 'Limited',     description: 'Clear PET jar with wide mouth for easy access. Cost-effective option.' },
  { id: 'pkg_07', name: 'HDPE Shampoo Bottle 250ml',   format: 'Bottle', material: 'HDPE',           moq: 10000, unitCost: 0.40, leadTime: '4-6 weeks', status: 'Available',   description: 'Standard shampoo bottle with flip-top cap. Gloss white HDPE.' },
  { id: 'pkg_08', name: 'PCR Flip-Top Tube 75ml',      format: 'Tube',   material: 'PCR',            moq: 15000, unitCost: 0.55, leadTime: '6-8 weeks', status: 'Available',   description: 'Post-consumer recycled plastic tube. Natural finish, eco-friendly positioning.' },
  { id: 'pkg_09', name: 'Bamboo Cap Jar 30ml',          format: 'Jar',    material: 'Glass + Bamboo', moq: 3000,  unitCost: 2.10, leadTime: '8-10 weeks', status: 'Coming Soon', description: 'Glass jar with sustainable bamboo lid. Premium eco-luxury positioning.' },
];

for (const p of packaging) {
  upsert('PackagingOption', { ...p, teamId, createdAt: now, updatedAt: now });
}

// ─── Projects ──────────────────────────────────────────────
const projects = [
  { id: 'proj_01', name: 'Anti-Dandruff Shampoo Innovation', description: 'Full product line development for scalp care range targeting dandruff and scalp irritation. Lead formulation is the Scalp Purify treatment.', status: 'In Development', category: 'Haircare', market: 'UK', claims: JSON.stringify(['Anti-dandruff', 'Scalp soothing', 'Clinically tested']) },
  { id: 'proj_02', name: 'Vitamin C Brightening Serum',      description: 'Brightening serum for the EU market. Targeting dull, uneven skin tone with stabilised ascorbic acid.',                                     status: 'Brief',          category: 'Skincare', market: 'EU', claims: JSON.stringify(['Brightening', 'Anti-oxidant', 'Even tone']) },
  { id: 'proj_03', name: 'SPF50 Daily Defense Launch',        description: 'Global launch of lightweight daily SPF moisturiser. Physical UV filters for broad-spectrum protection.',                                  status: 'Sampling',       category: 'Suncare', market: 'Global', claims: JSON.stringify(['SPF50', 'Broad spectrum', 'Lightweight', 'Reef-safe']) },
];

for (const p of projects) {
  upsert('Project', { ...p, teamId, createdById: userId, createdAt: now, updatedAt: now });
}

// ─── Project ↔ Formulation links ───────────────────────────
const projectFormulations = [
  { id: 'pf_01', projectId: 'proj_01', formulationId: 'form_07' },  // Anti-Dandruff ↔ Scalp Purify
  { id: 'pf_02', projectId: 'proj_01', formulationId: 'form_02' },  // Anti-Dandruff ↔ Keratin Shield
  { id: 'pf_03', projectId: 'proj_02', formulationId: 'form_09' },  // Vitamin C ↔ Vitamin C Cleanser
  { id: 'pf_04', projectId: 'proj_02', formulationId: 'form_11' },  // Vitamin C ↔ Ceramide Barrier
  { id: 'pf_05', projectId: 'proj_03', formulationId: 'form_05' },  // SPF50 ↔ SPF50 Daily Defense
  { id: 'pf_06', projectId: 'proj_03', formulationId: 'form_01' },  // SPF50 ↔ Hydra-Plump (companion)
];

for (const pf of projectFormulations) {
  upsert('ProjectFormulation', { ...pf, addedAt: now });
}

// ─── Sample Orders ─────────────────────────────────────────
const sampleOrders = [
  { id: 'so_01', reference: 'SMP-0012', formulationId: 'form_07', projectId: 'proj_01', quantity: 100, format: 'Filled retail unit', status: 'In Production', shippingAddress: 'Rory G., 12 Innovation Way, London, UK',  notes: 'Rush order — board demo next week' },
  { id: 'so_02', reference: 'SMP-0011', formulationId: 'form_01', projectId: 'proj_03', quantity: 50,  format: 'Bulk sample',        status: 'Shipped',       shippingAddress: 'Rory G., 12 Innovation Way, London, UK',  notes: null },
  { id: 'so_03', reference: 'SMP-0010', formulationId: 'form_09', projectId: 'proj_02', quantity: 25,  format: 'Filled retail unit', status: 'Delivered',     shippingAddress: 'Rory G., 12 Innovation Way, London, UK',  notes: null },
  { id: 'so_04', reference: 'SMP-0009', formulationId: 'form_06', projectId: null,      quantity: 75,  format: 'Lab prototype',      status: 'Delivered',     shippingAddress: 'Sara M., 5 Brand Studio, Paris, FR',      notes: 'For sensory panel evaluation' },
];

for (const so of sampleOrders) {
  upsert('SampleOrder', { ...so, teamId, createdById: userId, createdAt: now, updatedAt: now });
}

// ─── Sample Review (for SMP-0010) ──────────────────────────
upsert('SampleReview', {
  id: 'sr_01',
  sampleOrderId: 'so_03',
  reviewerId: saraId,
  texture: 4,
  scent: 5,
  colour: 4,
  overall: 4,
  notes: 'Excellent texture — smooth, non-greasy absorption. Scent is fresh and clean, exactly what the brief called for. Slight yellow tint could be reduced. Overall very close to final, recommend one more iteration on colour.',
  createdAt: now,
});

// ─── Project Assignments ────────────────────────────────────
const assignments = [
  { id: 'pa_01', projectId: 'proj_01', userId: userId, role: 'lead' },
  { id: 'pa_02', projectId: 'proj_01', userId: saraId, role: 'member' },
  { id: 'pa_03', projectId: 'proj_02', userId: saraId, role: 'lead' },
  { id: 'pa_04', projectId: 'proj_03', userId: userId, role: 'lead' },
];

for (const a of assignments) {
  upsert('ProjectAssignment', { ...a, createdAt: now });
}

// ─── Activities ─────────────────────────────────────────────
function daysAgo(n) { return new Date(Date.now() - n * 86400000).toISOString(); }
function hoursAgo(n) { return new Date(Date.now() - n * 3600000).toISOString(); }

const activities = [
  { id: 'act_01', projectId: 'proj_01', userId: userId, type: 'project_created', description: 'created this project', metadata: null, createdAt: daysAgo(14) },
  { id: 'act_02', projectId: 'proj_01', userId: saraId, type: 'formulation_linked', description: 'linked formulation "Scalp Purify Treatment"', metadata: JSON.stringify({ formulationId: 'form_07' }), createdAt: daysAgo(12) },
  { id: 'act_03', projectId: 'proj_01', userId: userId, type: 'formulation_linked', description: 'linked formulation "Keratin Shield"', metadata: JSON.stringify({ formulationId: 'form_02' }), createdAt: daysAgo(10) },
  { id: 'act_04', projectId: 'proj_01', userId: userId, type: 'status_change', description: 'changed status to "In Development"', metadata: JSON.stringify({ from: 'Brief', to: 'In Development' }), createdAt: daysAgo(8) },
  { id: 'act_05', projectId: 'proj_01', userId: saraId, type: 'sample_ordered', description: 'ordered sample SMP-0012 for "Scalp Purify Treatment"', metadata: JSON.stringify({ sampleOrderId: 'so_01', reference: 'SMP-0012' }), createdAt: daysAgo(5) },
  { id: 'act_06', projectId: 'proj_01', userId: saraId, type: 'comment', description: 'left a comment: "The scent profile needs work — too medicinal for the target demographic."', metadata: JSON.stringify({ commentId: 'cmt_01' }), createdAt: daysAgo(3) },
  { id: 'act_07', projectId: 'proj_01', userId: userId, type: 'comment', description: 'left a comment: "The zinc pyrithione concentration at 1% is right at the regulatory limit..."', metadata: JSON.stringify({ commentId: 'cmt_02' }), createdAt: hoursAgo(2) },
  { id: 'act_08', projectId: 'proj_02', userId: saraId, type: 'project_created', description: 'created this project', metadata: null, createdAt: daysAgo(7) },
  { id: 'act_09', projectId: 'proj_03', userId: userId, type: 'project_created', description: 'created this project', metadata: null, createdAt: daysAgo(10) },
  { id: 'act_10', projectId: 'proj_03', userId: userId, type: 'status_change', description: 'changed status to "Sampling"', metadata: JSON.stringify({ from: 'In Development', to: 'Sampling' }), createdAt: daysAgo(4) },
  { id: 'act_11', projectId: 'proj_01', userId: saraId, type: 'review_submitted', description: 'submitted a review for SMP-0012', metadata: JSON.stringify({ sampleOrderId: 'so_01' }), createdAt: daysAgo(1) },
];

for (const a of activities) {
  upsert('Activity', a);
}

// ─── Comments ───────────────────────────────────────────────
const comments = [
  { id: 'cmt_01', body: 'The scent profile needs work — too medicinal for the target demographic. Can we explore a more herbal/botanical direction?', userId: saraId, entityType: 'project', entityId: 'proj_01', parentId: null, deletedAt: null, createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: 'cmt_02', body: 'The zinc pyrithione concentration at 1% is right at the regulatory limit for leave-on. Since this is a rinse-off, we\'re fine — but flag it for the reg team.', userId: userId, entityType: 'project', entityId: 'proj_01', parentId: null, deletedAt: null, createdAt: hoursAgo(2), updatedAt: hoursAgo(2) },
  { id: 'cmt_03', body: 'Good catch. I\'ve added a note to the brief. Should we also look at piroctone olamine as a backup active?', userId: saraId, entityType: 'project', entityId: 'proj_01', parentId: 'cmt_02', deletedAt: null, createdAt: hoursAgo(1), updatedAt: hoursAgo(1) },
];

for (const c of comments) {
  upsert('Comment', c);
}

// ─── Documents ──────────────────────────────────────────────
const documents = [
  // Brand-level docs (no projectId)
  { id: 'doc_brand_01', name: 'Brand Guidelines v2.1', fileName: 'brand-guidelines.pdf', fileUrl: '/uploads/brand-guidelines.pdf', fileSize: 2457600, mimeType: 'application/pdf', projectId: null, teamId, uploadedById: userId, createdAt: daysAgo(30) },
  { id: 'doc_brand_02', name: 'Competitor Analysis Q1 2026', fileName: 'competitor-analysis.pdf', fileUrl: '/uploads/competitor-analysis.pdf', fileSize: 1843200, mimeType: 'application/pdf', projectId: null, teamId, uploadedById: saraId, createdAt: daysAgo(14) },
  // Project docs
  { id: 'doc_proj_01', name: 'Product Brief — Anti-Dandruff Shampoo', fileName: 'product-brief-anti-dandruff.pdf', fileUrl: '/uploads/product-brief-anti-dandruff.pdf', fileSize: 524288, mimeType: 'application/pdf', projectId: 'proj_01', teamId, uploadedById: userId, createdAt: daysAgo(12) },
  { id: 'doc_proj_02', name: 'Regulatory Notes (AICIS)', fileName: 'regulatory-notes-aicis.pdf', fileUrl: '/uploads/regulatory-notes-aicis.pdf', fileSize: 307200, mimeType: 'application/pdf', projectId: 'proj_01', teamId, uploadedById: saraId, createdAt: daysAgo(10) },
  { id: 'doc_proj_03', name: 'Stability Test Protocol', fileName: 'stability-test-protocol.docx', fileUrl: '/uploads/stability-test-protocol.docx', fileSize: 184320, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', projectId: 'proj_01', teamId, uploadedById: userId, createdAt: daysAgo(5) },
  { id: 'doc_proj_04', name: 'Ingredient Cost Sheet', fileName: 'ingredient-costs.xlsx', fileUrl: '/uploads/ingredient-costs.xlsx', fileSize: 92160, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', projectId: 'proj_02', teamId, uploadedById: saraId, createdAt: daysAgo(7) },
];

for (const d of documents) {
  upsert('Document', d);
}

// ─── Done ──────────────────────────────────────────────────
console.log('✓ Seeded successfully!');
console.log('  Users:          2 (rory@atelier.com / sara@atelier.com)');
console.log('  Password:       password123');
console.log('  Ingredients:    ' + ingredients.length);
console.log('  Formulations:   ' + formulations.length);
console.log('  Packaging:      ' + packaging.length);
console.log('  Projects:       ' + projects.length);
console.log('  Sample Orders:  ' + sampleOrders.length);
console.log('  Reviews:        1');

db.close();
