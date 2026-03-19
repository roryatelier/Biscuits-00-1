import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import 'dotenv/config';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const now = new Date();
function daysAgo(n: number) { return new Date(Date.now() - n * 86400000); }
function hoursAgo(n: number) { return new Date(Date.now() - n * 3600000); }

async function main() {
  const hashed = await bcrypt.hash('password123', 10);
  const userId = 'user_seed_001';
  const saraId = 'user_seed_002';
  const teamId = 'team_seed_001';

  // ─── Users ─────────────────────────────────────────────────
  await prisma.user.upsert({ where: { id: userId }, update: {}, create: { id: userId, name: 'Rory G.', email: 'rory@atelier.com', password: hashed, onboardingComplete: true } });
  await prisma.user.upsert({ where: { id: saraId }, update: {}, create: { id: saraId, name: 'Sara M.', email: 'sara@atelier.com', password: hashed, onboardingComplete: true } });

  // ─── Team ──────────────────────────────────────────────────
  await prisma.team.upsert({ where: { id: teamId }, update: {}, create: { id: teamId, name: 'Atelier Demo' } });
  await prisma.teamMember.upsert({ where: { id: 'member_seed_001' }, update: {}, create: { id: 'member_seed_001', userId, teamId, role: 'admin' } });
  await prisma.teamMember.upsert({ where: { id: 'member_seed_002' }, update: {}, create: { id: 'member_seed_002', userId: saraId, teamId, role: 'editor' } });

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
    await prisma.ingredient.upsert({ where: { id: ing.id }, update: {}, create: ing });
  }

  // ─── Formulations ──────────────────────────────────────────
  const formulations = [
    { id: 'form_01', name: 'Hydra-Plump Moisture Serum',          category: 'Serum',       status: 'Approved',  market: 'EU',     description: 'Intensive hydration serum with hyaluronic acid complex.', version: '2.1' },
    { id: 'form_02', name: 'Keratin Shield Repair Shampoo',        category: 'Shampoo',     status: 'Approved',  market: 'US',     description: 'Strengthening shampoo with hydrolysed keratin.',          version: '1.3' },
    { id: 'form_03', name: 'Overnight Restore Night Cream',        category: 'Moisturiser', status: 'Approved',  market: 'UK',     description: 'Rich night cream with ceramides and peptides.',           version: '3.0' },
    { id: 'form_04', name: 'AHA Renewal Facial Toner',             category: 'Toner',       status: 'Draft',     market: 'EU',     description: 'Gentle exfoliating toner with alpha hydroxy acids.',      version: '1.0' },
    { id: 'form_05', name: 'SPF50 Daily Defense Moisturiser',      category: 'SPF',         status: 'Approved',  market: 'Global', description: 'Lightweight daily moisturiser with broad-spectrum SPF50.', version: '2.2' },
    { id: 'form_06', name: 'Marine Collagen Firming Mask',         category: 'Mask',        status: 'Approved',  market: 'KR',     description: 'Sheet mask with marine collagen for firming.',            version: '1.5' },
    { id: 'form_07', name: 'Scalp Purify Anti-Dandruff Treatment', category: 'Treatment',   status: 'Approved',  market: 'UK',     description: 'Clinical anti-dandruff with zinc pyrithione.',            version: '4.0' },
    { id: 'form_08', name: 'Biotin Strengthen Hair Conditioner',   category: 'Conditioner', status: 'Draft',     market: 'US',     description: 'Fortifying conditioner with biotin and panthenol.',       version: '1.1' },
    { id: 'form_09', name: 'Vitamin C Brightening Cleanser',       category: 'Cleanser',    status: 'Approved',  market: 'EU',     description: 'Daily cleanser with stabilised vitamin C.',               version: '2.0' },
    { id: 'form_10', name: 'Rose Hip Recovery Face Oil',           category: 'Oil',         status: 'Archived',  market: 'UK',     description: 'Nourishing face oil with cold-pressed rosehip.',          version: '1.2' },
    { id: 'form_11', name: 'Ceramide Barrier Repair Serum',        category: 'Serum',       status: 'Approved',  market: 'EU',     description: 'Barrier-restoring serum with triple ceramide complex.',   version: '3.1' },
    { id: 'form_12', name: 'Tea Tree Clarifying Toner',            category: 'Toner',       status: 'Approved',  market: 'US',     description: 'Oil-control toner with tea tree oil and niacinamide.',    version: '2.3' },
  ];

  for (const f of formulations) {
    await prisma.formulation.upsert({ where: { id: f.id }, update: {}, create: { ...f, teamId, createdById: userId } });
  }

  // ─── Formulation Ingredients ───────────────────────────────
  const formulationIngredients: { id: string; formulationId: string; ingredientId: string; percentage: number; role: string }[] = [
    // form_07 — Scalp Purify
    { id: 'fi_07_01', formulationId: 'form_07', ingredientId: 'ing_01', percentage: 72.00, role: 'Base' },
    { id: 'fi_07_02', formulationId: 'form_07', ingredientId: 'ing_02', percentage: 10.00, role: 'Active' },
    { id: 'fi_07_03', formulationId: 'form_07', ingredientId: 'ing_03', percentage: 8.00,  role: 'Active' },
    { id: 'fi_07_04', formulationId: 'form_07', ingredientId: 'ing_04', percentage: 1.00,  role: 'Active' },
    { id: 'fi_07_05', formulationId: 'form_07', ingredientId: 'ing_05', percentage: 1.50,  role: 'Active' },
    { id: 'fi_07_06', formulationId: 'form_07', ingredientId: 'ing_06', percentage: 1.00,  role: 'Base' },
    { id: 'fi_07_07', formulationId: 'form_07', ingredientId: 'ing_07', percentage: 2.00,  role: 'Base' },
    { id: 'fi_07_08', formulationId: 'form_07', ingredientId: 'ing_08', percentage: 0.50,  role: 'Active' },
    { id: 'fi_07_09', formulationId: 'form_07', ingredientId: 'ing_09', percentage: 0.50,  role: 'Active' },
    { id: 'fi_07_10', formulationId: 'form_07', ingredientId: 'ing_10', percentage: 0.50,  role: 'Active' },
    { id: 'fi_07_11', formulationId: 'form_07', ingredientId: 'ing_11', percentage: 0.30,  role: 'Base' },
    { id: 'fi_07_12', formulationId: 'form_07', ingredientId: 'ing_12', percentage: 0.25,  role: 'Active' },
    { id: 'fi_07_13', formulationId: 'form_07', ingredientId: 'ing_13', percentage: 0.15,  role: 'Preservative' },
    { id: 'fi_07_14', formulationId: 'form_07', ingredientId: 'ing_14', percentage: 0.50,  role: 'Fragrance' },
    { id: 'fi_07_15', formulationId: 'form_07', ingredientId: 'ing_15', percentage: 0.20,  role: 'Base' },
    { id: 'fi_07_16', formulationId: 'form_07', ingredientId: 'ing_16', percentage: 0.10,  role: 'Base' },
    // form_01 — Hydra-Plump
    { id: 'fi_01_01', formulationId: 'form_01', ingredientId: 'ing_01', percentage: 78.00, role: 'Base' },
    { id: 'fi_01_02', formulationId: 'form_01', ingredientId: 'ing_17', percentage: 2.00,  role: 'Active' },
    { id: 'fi_01_03', formulationId: 'form_01', ingredientId: 'ing_07', percentage: 5.00,  role: 'Base' },
    { id: 'fi_01_04', formulationId: 'form_01', ingredientId: 'ing_05', percentage: 3.00,  role: 'Active' },
    { id: 'fi_01_05', formulationId: 'form_01', ingredientId: 'ing_21', percentage: 4.00,  role: 'Base' },
    { id: 'fi_01_06', formulationId: 'form_01', ingredientId: 'ing_22', percentage: 3.00,  role: 'Base' },
    { id: 'fi_01_07', formulationId: 'form_01', ingredientId: 'ing_19', percentage: 1.00,  role: 'Active' },
    { id: 'fi_01_08', formulationId: 'form_01', ingredientId: 'ing_23', percentage: 0.80,  role: 'Preservative' },
    { id: 'fi_01_09', formulationId: 'form_01', ingredientId: 'ing_14', percentage: 0.50,  role: 'Fragrance' },
    { id: 'fi_01_10', formulationId: 'form_01', ingredientId: 'ing_15', percentage: 0.20,  role: 'Base' },
    // form_09 — Vitamin C Cleanser
    { id: 'fi_09_01', formulationId: 'form_09', ingredientId: 'ing_01', percentage: 74.00, role: 'Base' },
    { id: 'fi_09_02', formulationId: 'form_09', ingredientId: 'ing_18', percentage: 3.00,  role: 'Active' },
    { id: 'fi_09_03', formulationId: 'form_09', ingredientId: 'ing_03', percentage: 8.00,  role: 'Active' },
    { id: 'fi_09_04', formulationId: 'form_09', ingredientId: 'ing_07', percentage: 4.00,  role: 'Base' },
    { id: 'fi_09_05', formulationId: 'form_09', ingredientId: 'ing_19', percentage: 1.00,  role: 'Active' },
    { id: 'fi_09_06', formulationId: 'form_09', ingredientId: 'ing_05', percentage: 2.00,  role: 'Active' },
    { id: 'fi_09_07', formulationId: 'form_09', ingredientId: 'ing_21', percentage: 3.00,  role: 'Base' },
    { id: 'fi_09_08', formulationId: 'form_09', ingredientId: 'ing_23', percentage: 0.80,  role: 'Preservative' },
    { id: 'fi_09_09', formulationId: 'form_09', ingredientId: 'ing_14', percentage: 0.50,  role: 'Fragrance' },
    { id: 'fi_09_10', formulationId: 'form_09', ingredientId: 'ing_15', percentage: 0.20,  role: 'Base' },
  ];

  for (const fi of formulationIngredients) {
    await prisma.formulationIngredient.upsert({
      where: { id: fi.id },
      update: {},
      create: fi,
    });
  }

  // ─── Packaging Options ─────────────────────────────────────
  const packaging = [
    { id: 'pkg_01', name: 'Airless Pump Bottle 30ml',   format: 'Bottle', material: 'PP',             moq: 5000,  unitCost: 0.85, leadTime: '4-6 weeks', status: 'Available',   description: 'Premium airless pump mechanism.' },
    { id: 'pkg_02', name: 'Amber Glass Dropper 30ml',   format: 'Bottle', material: 'Glass',          moq: 3000,  unitCost: 1.20, leadTime: '3-5 weeks', status: 'Available',   description: 'UV-protective amber glass with precision dropper.' },
    { id: 'pkg_03', name: 'Aluminium Tube 100ml',        format: 'Tube',   material: 'Aluminium',      moq: 10000, unitCost: 0.45, leadTime: '6-8 weeks', status: 'Available',   description: 'Lightweight aluminium tube. Fully recyclable.' },
    { id: 'pkg_04', name: 'Squeeze Tube 150ml',          format: 'Tube',   material: 'HDPE',           moq: 8000,  unitCost: 0.35, leadTime: '4-6 weeks', status: 'Available',   description: 'Flexible HDPE squeeze tube.' },
    { id: 'pkg_05', name: 'Frosted Glass Jar 50ml',      format: 'Jar',    material: 'Glass',          moq: 2000,  unitCost: 1.50, leadTime: '5-7 weeks', status: 'Available',   description: 'Elegant frosted glass jar for premium creams.' },
    { id: 'pkg_06', name: 'Wide-Mouth Jar 100ml',        format: 'Jar',    material: 'PET',            moq: 5000,  unitCost: 0.60, leadTime: '3-5 weeks', status: 'Limited',     description: 'Clear PET jar with wide mouth.' },
    { id: 'pkg_07', name: 'HDPE Shampoo Bottle 250ml',   format: 'Bottle', material: 'HDPE',           moq: 10000, unitCost: 0.40, leadTime: '4-6 weeks', status: 'Available',   description: 'Standard shampoo bottle with flip-top cap.' },
    { id: 'pkg_08', name: 'PCR Flip-Top Tube 75ml',      format: 'Tube',   material: 'PCR',            moq: 15000, unitCost: 0.55, leadTime: '6-8 weeks', status: 'Available',   description: 'Post-consumer recycled plastic tube.' },
    { id: 'pkg_09', name: 'Bamboo Cap Jar 30ml',          format: 'Jar',    material: 'Glass + Bamboo', moq: 3000,  unitCost: 2.10, leadTime: '8-10 weeks', status: 'Coming Soon', description: 'Glass jar with sustainable bamboo lid.' },
  ];

  for (const p of packaging) {
    await prisma.packagingOption.upsert({ where: { id: p.id }, update: {}, create: { ...p, teamId } });
  }

  // ─── Projects ──────────────────────────────────────────────
  const projects = [
    { id: 'proj_01', name: 'Anti-Dandruff Shampoo Innovation', description: 'Full product line development for scalp care range.', status: 'In Development', category: 'Haircare', market: 'UK', claims: JSON.stringify(['Anti-dandruff', 'Scalp soothing', 'Clinically tested']) },
    { id: 'proj_02', name: 'Vitamin C Brightening Serum',      description: 'Brightening serum for the EU market.',                status: 'Brief',          category: 'Skincare', market: 'EU', claims: JSON.stringify(['Brightening', 'Anti-oxidant', 'Even tone']) },
    { id: 'proj_03', name: 'SPF50 Daily Defense Launch',        description: 'Global launch of lightweight daily SPF.',             status: 'Sampling',       category: 'Suncare', market: 'Global', claims: JSON.stringify(['SPF50', 'Broad spectrum', 'Lightweight', 'Reef-safe']) },
  ];

  for (const p of projects) {
    await prisma.project.upsert({ where: { id: p.id }, update: {}, create: { ...p, teamId, createdById: userId } });
  }

  // ─── Project ↔ Formulation links ───────────────────────────
  const pfs = [
    { id: 'pf_01', projectId: 'proj_01', formulationId: 'form_07' },
    { id: 'pf_02', projectId: 'proj_01', formulationId: 'form_02' },
    { id: 'pf_03', projectId: 'proj_02', formulationId: 'form_09' },
    { id: 'pf_04', projectId: 'proj_02', formulationId: 'form_11' },
    { id: 'pf_05', projectId: 'proj_03', formulationId: 'form_05' },
    { id: 'pf_06', projectId: 'proj_03', formulationId: 'form_01' },
  ];
  for (const pf of pfs) {
    await prisma.projectFormulation.upsert({ where: { id: pf.id }, update: {}, create: pf });
  }

  // ─── Sample Orders ─────────────────────────────────────────
  const sampleOrders = [
    { id: 'so_01', reference: 'SMP-0012', formulationId: 'form_07', projectId: 'proj_01', quantity: 100, format: 'Filled retail unit', status: 'In Production', shippingAddress: 'Rory G., 12 Innovation Way, London, UK',  notes: 'Rush order — board demo next week' },
    { id: 'so_02', reference: 'SMP-0011', formulationId: 'form_01', projectId: 'proj_03', quantity: 50,  format: 'Bulk sample',        status: 'Shipped',       shippingAddress: 'Rory G., 12 Innovation Way, London, UK',  notes: null },
    { id: 'so_03', reference: 'SMP-0010', formulationId: 'form_09', projectId: 'proj_02', quantity: 25,  format: 'Filled retail unit', status: 'Delivered',     shippingAddress: 'Rory G., 12 Innovation Way, London, UK',  notes: null },
    { id: 'so_04', reference: 'SMP-0009', formulationId: 'form_06', projectId: null,      quantity: 75,  format: 'Lab prototype',      status: 'Delivered',     shippingAddress: 'Sara M., 5 Brand Studio, Paris, FR',      notes: 'For sensory panel evaluation' },
  ];
  for (const so of sampleOrders) {
    await prisma.sampleOrder.upsert({ where: { id: so.id }, update: {}, create: { ...so, teamId, createdById: userId } });
  }

  // ─── Sample Review ─────────────────────────────────────────
  await prisma.sampleReview.upsert({ where: { id: 'sr_01' }, update: {}, create: {
    id: 'sr_01', sampleOrderId: 'so_03', reviewerId: saraId,
    texture: 4, scent: 5, colour: 4, overall: 4,
    notes: 'Excellent texture — smooth, non-greasy absorption. Scent is fresh and clean. Slight yellow tint could be reduced.',
  }});

  // ─── Project Assignments ────────────────────────────────────
  const assignments = [
    { id: 'pa_01', projectId: 'proj_01', userId, role: 'lead' },
    { id: 'pa_02', projectId: 'proj_01', userId: saraId, role: 'member' },
    { id: 'pa_03', projectId: 'proj_02', userId: saraId, role: 'lead' },
    { id: 'pa_04', projectId: 'proj_03', userId, role: 'lead' },
  ];
  for (const a of assignments) {
    await prisma.projectAssignment.upsert({ where: { id: a.id }, update: {}, create: a });
  }

  // ─── Activities ─────────────────────────────────────────────
  const activities = [
    { id: 'act_01', entityType: 'project', entityId: 'proj_01', projectId: 'proj_01', userId, type: 'project_created', description: 'created this project', metadata: undefined, createdAt: daysAgo(14) },
    { id: 'act_02', entityType: 'project', entityId: 'proj_01', projectId: 'proj_01', userId: saraId, type: 'formulation_linked', description: 'linked formulation "Scalp Purify Treatment"', metadata: { formulationId: 'form_07' }, createdAt: daysAgo(12) },
    { id: 'act_03', entityType: 'project', entityId: 'proj_01', projectId: 'proj_01', userId, type: 'formulation_linked', description: 'linked formulation "Keratin Shield"', metadata: { formulationId: 'form_02' }, createdAt: daysAgo(10) },
    { id: 'act_04', entityType: 'project', entityId: 'proj_01', projectId: 'proj_01', userId, type: 'status_change', description: 'changed status to "In Development"', metadata: { from: 'Brief', to: 'In Development' }, createdAt: daysAgo(8) },
    { id: 'act_05', entityType: 'project', entityId: 'proj_01', projectId: 'proj_01', userId: saraId, type: 'sample_ordered', description: 'ordered sample SMP-0012', metadata: { sampleOrderId: 'so_01', reference: 'SMP-0012' }, createdAt: daysAgo(5) },
    { id: 'act_06', entityType: 'project', entityId: 'proj_01', projectId: 'proj_01', userId: saraId, type: 'comment', description: 'left a comment: "The scent profile needs work"', metadata: { commentId: 'cmt_01' }, createdAt: daysAgo(3) },
    { id: 'act_07', entityType: 'project', entityId: 'proj_01', projectId: 'proj_01', userId, type: 'comment', description: 'left a comment: "The zinc pyrithione concentration..."', metadata: { commentId: 'cmt_02' }, createdAt: hoursAgo(2) },
    { id: 'act_08', entityType: 'project', entityId: 'proj_02', projectId: 'proj_02', userId: saraId, type: 'project_created', description: 'created this project', metadata: undefined, createdAt: daysAgo(7) },
    { id: 'act_09', entityType: 'project', entityId: 'proj_03', projectId: 'proj_03', userId, type: 'project_created', description: 'created this project', metadata: undefined, createdAt: daysAgo(10) },
    { id: 'act_10', entityType: 'project', entityId: 'proj_03', projectId: 'proj_03', userId, type: 'status_change', description: 'changed status to "Sampling"', metadata: { from: 'In Development', to: 'Sampling' }, createdAt: daysAgo(4) },
    { id: 'act_11', entityType: 'project', entityId: 'proj_01', projectId: 'proj_01', userId: saraId, type: 'review_submitted', description: 'submitted a review for SMP-0012', metadata: { sampleOrderId: 'so_01' }, createdAt: daysAgo(1) },
  ];
  for (const a of activities) {
    await prisma.activity.upsert({ where: { id: a.id }, update: {}, create: a });
  }

  // ─── Comments ───────────────────────────────────────────────
  const comments = [
    { id: 'cmt_01', body: 'The scent profile needs work — too medicinal for the target demographic. Can we explore a more herbal/botanical direction?', userId: saraId, entityType: 'project', entityId: 'proj_01', parentId: null, createdAt: daysAgo(3) },
    { id: 'cmt_02', body: 'The zinc pyrithione concentration at 1% is right at the regulatory limit for leave-on. Since this is a rinse-off, we\'re fine — but flag it for the reg team.', userId, entityType: 'project', entityId: 'proj_01', parentId: null, createdAt: hoursAgo(2) },
    { id: 'cmt_03', body: 'Good catch. I\'ve added a note to the brief. Should we also look at piroctone olamine as a backup active?', userId: saraId, entityType: 'project', entityId: 'proj_01', parentId: 'cmt_02', createdAt: hoursAgo(1) },
  ];
  for (const c of comments) {
    await prisma.comment.upsert({ where: { id: c.id }, update: {}, create: c });
  }

  // ─── Documents ──────────────────────────────────────────────
  const documents = [
    { id: 'doc_brand_01', name: 'Brand Guidelines v2.1', fileName: 'brand-guidelines.pdf', fileUrl: '/uploads/brand-guidelines.pdf', fileSize: 2457600, mimeType: 'application/pdf', projectId: null, teamId, uploadedById: userId },
    { id: 'doc_brand_02', name: 'Competitor Analysis Q1 2026', fileName: 'competitor-analysis.pdf', fileUrl: '/uploads/competitor-analysis.pdf', fileSize: 1843200, mimeType: 'application/pdf', projectId: null, teamId, uploadedById: saraId },
    { id: 'doc_proj_01', name: 'Product Brief — Anti-Dandruff Shampoo', fileName: 'product-brief-anti-dandruff.pdf', fileUrl: '/uploads/product-brief-anti-dandruff.pdf', fileSize: 524288, mimeType: 'application/pdf', projectId: 'proj_01', teamId, uploadedById: userId },
    { id: 'doc_proj_02', name: 'Regulatory Notes (AICIS)', fileName: 'regulatory-notes-aicis.pdf', fileUrl: '/uploads/regulatory-notes-aicis.pdf', fileSize: 307200, mimeType: 'application/pdf', projectId: 'proj_01', teamId, uploadedById: saraId },
    { id: 'doc_proj_03', name: 'Stability Test Protocol', fileName: 'stability-test-protocol.docx', fileUrl: '/uploads/stability-test-protocol.docx', fileSize: 184320, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', projectId: 'proj_01', teamId, uploadedById: userId },
    { id: 'doc_proj_04', name: 'Ingredient Cost Sheet', fileName: 'ingredient-costs.xlsx', fileUrl: '/uploads/ingredient-costs.xlsx', fileSize: 92160, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', projectId: 'proj_02', teamId, uploadedById: saraId },
  ];
  for (const d of documents) {
    await prisma.document.upsert({ where: { id: d.id }, update: {}, create: d });
  }

  // ─── Supplier Intelligence ─────────────────────────────────

  // AoS Suppliers (qualification database)
  const aosSuppliers = [
    { id: 'aos_01', companyName: 'Cosmax Inc.',          companyLegalName: 'Cosmax Inc.', factoryName: 'Cosmax Pangyo Plant', qualificationStage: 'Fully Qualified', categories: ['face-care', 'spf'], subcategories: ['Serum', 'Moisturiser', 'Chemical SPF'], capabilityType: 'turnkey', capabilities: { fillTypes: ['bottle', 'jar', 'tube'], fillVolumeMin: 10, fillVolumeMax: 500, packagingMaterials: ['PET', 'Glass', 'PP'], whiteLabel: true }, moq: 50000, keyBrands: ['CosRX', 'Skin1004', 'Aqualogica'], companyCity: 'Seongnam', companyCountry: 'South Korea', factoryCity: 'Pangyo', factoryCountry: 'South Korea', customSampleLeadTimeDays: 21, productionLeadTimeDays: 42, samplePriceMin: 3.50, samplePriceMax: 8.00, cautionFlag: false, cautionNote: null, cobaltEnabled: true },
    { id: 'aos_02', companyName: 'Intercos S.p.A.',      qualificationStage: 'Conditionally Qualified', categories: ['colour', 'face-care'], subcategories: ['Foundation', 'Lip', 'Serum'], capabilityType: 'turnkey', capabilities: { fillTypes: ['bottle', 'jar', 'tube', 'stick'], fillVolumeMin: 5, fillVolumeMax: 200, packagingMaterials: ['Glass', 'PP', 'Aluminium'], whiteLabel: true }, moq: 25000, keyBrands: ['Fenty Beauty', 'Charlotte Tilbury'], companyCity: 'Milan', companyCountry: 'Italy', factoryCity: 'Agrate Brianza', factoryCountry: 'Italy', customSampleLeadTimeDays: 28, productionLeadTimeDays: 56, samplePriceMin: 5.00, samplePriceMax: 15.00, cautionFlag: true, cautionNote: 'Volume requirements too high for current brand portfolio. Revisit after Series B.', cobaltEnabled: true },
    { id: 'aos_03', companyName: 'Kolmar Korea',         qualificationStage: 'Fully Qualified', categories: ['face-care', 'body-care'], subcategories: ['Moisturiser', 'Cleanser', 'Body Lotion'], capabilityType: 'both', capabilities: { fillTypes: ['bottle', 'jar', 'tube', 'sachet'], fillVolumeMin: 10, fillVolumeMax: 1000, packagingMaterials: ['PET', 'HDPE', 'Glass', 'PP'], whiteLabel: true }, moq: 10000, keyBrands: ['Innisfree', 'Laneige'], companyCity: 'Sejong', companyCountry: 'South Korea', factoryCity: 'Sejong', factoryCountry: 'South Korea', customSampleLeadTimeDays: 14, productionLeadTimeDays: 35, samplePriceMin: 2.00, samplePriceMax: 6.00, cautionFlag: false, cautionNote: null, cobaltEnabled: true },
    { id: 'aos_04', companyName: 'Fareva',               qualificationStage: 'Capability Confirmed', categories: ['face-care', 'hair-care'], subcategories: ['Serum', 'Shampoo', 'Conditioner'], capabilityType: 'blend_fill', capabilities: { fillTypes: ['bottle', 'tube'], fillVolumeMin: 50, fillVolumeMax: 500, packagingMaterials: ['PET', 'HDPE'], whiteLabel: false }, moq: 20000, keyBrands: ['L\'Oréal', 'Garnier'], companyCity: 'Tournon-sur-Rhône', companyCountry: 'France', factoryCity: 'Tournon-sur-Rhône', factoryCountry: 'France', customSampleLeadTimeDays: 21, productionLeadTimeDays: 49, cautionFlag: false, cautionNote: null, cobaltEnabled: false },
    { id: 'aos_05', companyName: 'Nihon Kolmar',         qualificationStage: 'Outreached', categories: ['face-care', 'spf'], subcategories: ['Vitamin C', 'Mineral SPF'], capabilityType: 'turnkey', capabilities: { fillTypes: ['bottle', 'jar', 'tube'], fillVolumeMin: 15, fillVolumeMax: 200, packagingMaterials: ['Glass', 'PP', 'Aluminium'], whiteLabel: true }, moq: 30000, keyBrands: ['Shiseido', 'SK-II'], companyCity: 'Osaka', companyCountry: 'Japan', factoryCity: 'Osaka', factoryCountry: 'Japan', cautionFlag: false, cautionNote: null, cobaltEnabled: false },
    { id: 'aos_06', companyName: 'Ancorotti Cosmetics',  qualificationStage: 'Fully Qualified', categories: ['colour'], subcategories: ['Foundation', 'Lip', 'Eye', 'Blush'], capabilityType: 'turnkey', capabilities: { fillTypes: ['bottle', 'jar', 'stick', 'compact'], fillVolumeMin: 3, fillVolumeMax: 50, packagingMaterials: ['PP', 'Aluminium', 'Glass'], whiteLabel: true }, moq: 15000, keyBrands: ['MAC', 'Urban Decay'], companyCity: 'Crema', companyCountry: 'Italy', factoryCity: 'Crema', factoryCountry: 'Italy', customSampleLeadTimeDays: 21, productionLeadTimeDays: 42, samplePriceMin: 4.00, samplePriceMax: 12.00, cautionFlag: false, cautionNote: null, cobaltEnabled: false },
    { id: 'aos_07', companyName: 'Gamma Croma',          qualificationStage: 'Identified', categories: ['colour', 'face-care'], subcategories: ['Eye', 'Powder', 'Cleanser'], capabilityType: 'unknown', moq: 10000, keyBrands: ['Morphe'], companyCity: 'Milan', companyCountry: 'Italy', cautionFlag: false, cautionNote: null, cobaltEnabled: false },
    { id: 'aos_08', companyName: 'Sunrise Cosmetics',    qualificationStage: 'Paused', categories: ['face-care'], subcategories: ['Moisturiser', 'Serum'], capabilityType: 'blend_fill', moq: 5000, keyBrands: ['The Ordinary'], companyCity: 'Toronto', companyCountry: 'Canada', factoryCity: 'Mississauga', factoryCountry: 'Canada', cautionFlag: true, cautionNote: 'Previous MSA negotiations stalled. Supplier went dark for 3 months.', cobaltEnabled: false },
    { id: 'aos_09', companyName: 'Cosmolab India',       qualificationStage: 'Capability Confirmed', categories: ['hair-care', 'body-care'], subcategories: ['Shampoo', 'Hair Mask', 'Body Wash'], capabilityType: 'both', capabilities: { fillTypes: ['bottle', 'tube', 'sachet', 'pouch'], fillVolumeMin: 10, fillVolumeMax: 1000, packagingMaterials: ['HDPE', 'PET', 'PP'], whiteLabel: true }, moq: 15000, keyBrands: ['Mamaearth', 'WOW Skin Science'], companyCity: 'Mumbai', companyCountry: 'India', factoryCity: 'Baddi', factoryCountry: 'India', customSampleLeadTimeDays: 14, productionLeadTimeDays: 28, samplePriceMin: 1.50, samplePriceMax: 4.00, cautionFlag: false, cautionNote: null, cobaltEnabled: true },
    { id: 'aos_10', companyName: 'Biofarma',             qualificationStage: 'Conditionally Qualified', categories: ['face-care', 'body-care'], subcategories: ['Retinol', 'Body Butter'], capabilityType: 'blend_fill', capabilities: { fillTypes: ['bottle', 'jar', 'tube'], fillVolumeMin: 30, fillVolumeMax: 300, packagingMaterials: ['Glass', 'PET'], whiteLabel: false }, moq: 8000, keyBrands: ['Drunk Elephant'], companyCity: 'Warsaw', companyCountry: 'Poland', factoryCity: 'Radom', factoryCountry: 'Poland', customSampleLeadTimeDays: 21, productionLeadTimeDays: 42, samplePriceMin: 3.00, samplePriceMax: 7.00, cautionFlag: false, cautionNote: null, cobaltEnabled: true },
    { id: 'aos_11', companyName: 'PharmaVie GmbH',       qualificationStage: 'Blacklisted', categories: ['spf'], subcategories: ['Chemical SPF'], capabilityType: 'blend_fill', moq: 40000, keyBrands: [], companyCity: 'Hamburg', companyCountry: 'Germany', cautionFlag: true, cautionNote: 'Failed quality audit. Do not re-engage.', cobaltEnabled: false },
    { id: 'aos_12', companyName: 'Taiwan Beauty Corp',    qualificationStage: 'Outreached', categories: ['face-care'], subcategories: ['Hyaluronic Acid', 'Niacinamide'], capabilityType: 'unknown', moq: 12000, keyBrands: ['Dr. Wu', 'My Beauty Diary'], companyCity: 'Taipei', companyCountry: 'Taiwan', cautionFlag: false, cautionNote: null, cobaltEnabled: false },
  ];

  for (const s of aosSuppliers) {
    await prisma.aosSupplier.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, teamId },
    });
  }

  // Cobalt Suppliers (discovery — linked to AoS where applicable)
  const cobaltSuppliers = [
    { id: 'cob_01', companyName: 'Cosmax Inc.',     country: 'South Korea', cor: 'KR', categories: ['face-care', 'spf'], dataSource: 'Import Yeti', matchedProducts: [{ name: 'CosRX Advanced Snail 96 Mucin Power Essence', brand: 'CosRX', sku: 'CRX-SNL-96', subcategory: 'Serum', rrp: 21.00, markets: ['US', 'EU', 'KR', 'AU'], url: 'https://amazon.com/dp/B00PBX3L7K' }, { name: 'Skin1004 Madagascar Centella Ampoule', brand: 'Skin1004', sku: 'SK1-CEN-AMP', subcategory: 'Serum', rrp: 18.50, markets: ['US', 'KR'], url: 'https://amazon.com/dp/B07QM55Z3Z' }], matchedProductsCount: 2, linked: true, aosId: 'aos_01' },
    { id: 'cob_02', companyName: 'Intercos S.p.A.', country: 'Italy',       cor: 'IT', categories: ['colour', 'face-care'], dataSource: 'Import Yeti', matchedProducts: [{ name: 'Fenty Beauty Pro Filt\'r Foundation', brand: 'Fenty Beauty', sku: 'FNT-PF-FND', subcategory: 'Foundation', rrp: 56.00, markets: ['US', 'EU', 'AU'], url: 'https://fentybeauty.com' }], matchedProductsCount: 1, linked: true, aosId: 'aos_02' },
    { id: 'cob_03', companyName: 'Kolmar Korea',    country: 'South Korea', cor: 'KR', categories: ['face-care', 'body-care'], dataSource: 'Import Yeti', matchedProducts: [{ name: 'Innisfree Green Tea Seed Serum', brand: 'Innisfree', sku: 'INN-GTS-SRM', subcategory: 'Serum', rrp: 27.00, markets: ['KR', 'US', 'JP'], url: 'https://amazon.com/dp/B07SZFJRX3' }, { name: 'Laneige Water Sleeping Mask', brand: 'Laneige', sku: 'LNG-WSM', subcategory: 'Moisturiser', rrp: 34.00, markets: ['US', 'KR', 'AU'], url: 'https://amazon.com/dp/B003U9W9IM' }], matchedProductsCount: 2, linked: true, aosId: 'aos_03' },
    { id: 'cob_04', companyName: 'Cosmolab India',  country: 'India',       cor: 'IN', categories: ['hair-care', 'body-care'], dataSource: 'Import Yeti', matchedProducts: [{ name: 'Mamaearth Onion Hair Oil', brand: 'Mamaearth', sku: 'MME-OHO', subcategory: 'Hair Mask', rrp: 12.00, markets: ['IN', 'US'], url: 'https://amazon.in/dp/B07VKJN8F3' }], matchedProductsCount: 1, linked: true, aosId: 'aos_09' },
    { id: 'cob_05', companyName: 'Biofarma',        country: 'Poland',      cor: 'PL', categories: ['face-care', 'body-care'], dataSource: 'Daily Med', matchedProducts: [{ name: 'Drunk Elephant Protini Polypeptide Cream', brand: 'Drunk Elephant', sku: 'DE-PPC', subcategory: 'Moisturiser', rrp: 68.00, markets: ['US', 'EU'], url: 'https://drunkelephant.com' }], matchedProductsCount: 1, linked: true, aosId: 'aos_10' },
    // Unlinked Cobalt suppliers (discovered but not yet in AoS)
    { id: 'cob_06', companyName: 'Shanghai Joyfull', country: 'China',       cor: 'CN', categories: ['face-care'], dataSource: 'Import Yeti', matchedProducts: [{ name: 'Generic Niacinamide Serum', brand: 'White Label', sku: 'WL-NIA-01', subcategory: 'Serum', rrp: 8.50, markets: ['US'], url: '' }], matchedProductsCount: 1, linked: false, aosId: null },
    { id: 'cob_07', companyName: 'Toyo Beauty',     country: 'Japan',       cor: 'JP', categories: ['face-care', 'spf'], dataSource: 'Import Yeti', matchedProducts: [{ name: 'Biore UV Aqua Rich Watery Essence', brand: 'Biore', sku: 'BIO-UV-AWE', subcategory: 'Chemical SPF', rrp: 15.00, markets: ['JP', 'US', 'AU'], url: 'https://amazon.com/dp/B01MTDFFQ5' }, { name: 'Hada Labo Gokujyun Lotion', brand: 'Hada Labo', sku: 'HL-GKJ-LOT', subcategory: 'Hyaluronic Acid', rrp: 14.00, markets: ['JP', 'US'], url: 'https://amazon.com/dp/B074GX619Q' }], matchedProductsCount: 2, linked: false, aosId: null },
    { id: 'cob_08', companyName: 'Mana Beauté',     country: 'France',      cor: 'FR', categories: ['face-care'], dataSource: 'Daily Med', matchedProducts: [{ name: 'La Roche-Posay Toleriane Cleanser', brand: 'La Roche-Posay', sku: 'LRP-TOL-CLN', subcategory: 'Cleanser', rrp: 22.00, markets: ['EU', 'US'], url: 'https://laroche-posay.com' }], matchedProductsCount: 1, linked: false, aosId: null },
  ];

  for (const c of cobaltSuppliers) {
    await prisma.cobaltSupplier.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, teamId },
    });
  }

  // Update AoS suppliers with cobaltSupplierId for linked ones
  await prisma.aosSupplier.update({ where: { id: 'aos_01' }, data: { cobaltSupplierId: 'cob_01' } });
  await prisma.aosSupplier.update({ where: { id: 'aos_02' }, data: { cobaltSupplierId: 'cob_02' } });
  await prisma.aosSupplier.update({ where: { id: 'aos_03' }, data: { cobaltSupplierId: 'cob_03' } });
  await prisma.aosSupplier.update({ where: { id: 'aos_09' }, data: { cobaltSupplierId: 'cob_04' } });
  await prisma.aosSupplier.update({ where: { id: 'aos_10' }, data: { cobaltSupplierId: 'cob_05' } });

  // Certifications
  const certifications = [
    // Cosmax — fully certified
    { id: 'cert_01', aosSupplierId: 'aos_01', certType: 'GMP',     verificationStatus: 'verified', expiryDate: new Date('2027-06-15') },
    { id: 'cert_02', aosSupplierId: 'aos_01', certType: 'ISO',     verificationStatus: 'verified', expiryDate: new Date('2027-03-01') },
    { id: 'cert_03', aosSupplierId: 'aos_01', certType: 'FDA',     verificationStatus: 'verified', expiryDate: null },
    // Intercos — partial
    { id: 'cert_04', aosSupplierId: 'aos_02', certType: 'GMP',     verificationStatus: 'verified', expiryDate: new Date('2026-12-01') },
    { id: 'cert_05', aosSupplierId: 'aos_02', certType: 'ISO',     verificationStatus: 'unverified' },
    // Kolmar — fully certified
    { id: 'cert_06', aosSupplierId: 'aos_03', certType: 'GMP',     verificationStatus: 'verified', expiryDate: new Date('2027-09-30') },
    { id: 'cert_07', aosSupplierId: 'aos_03', certType: 'ISO',     verificationStatus: 'verified', expiryDate: new Date('2027-01-15') },
    { id: 'cert_08', aosSupplierId: 'aos_03', certType: 'organic', verificationStatus: 'verified', expiryDate: new Date('2026-08-01') },
    // Ancorotti — GMP only
    { id: 'cert_09', aosSupplierId: 'aos_06', certType: 'GMP',     verificationStatus: 'verified', expiryDate: new Date('2027-04-15') },
    // Biofarma — expiring soon
    { id: 'cert_10', aosSupplierId: 'aos_10', certType: 'GMP',     verificationStatus: 'verified', expiryDate: new Date('2026-04-20') },
    { id: 'cert_11', aosSupplierId: 'aos_10', certType: 'vegan',   verificationStatus: 'verified', expiryDate: null },
    // Cosmolab
    { id: 'cert_12', aosSupplierId: 'aos_09', certType: 'GMP',     verificationStatus: 'verified', expiryDate: new Date('2027-02-28') },
    { id: 'cert_13', aosSupplierId: 'aos_09', certType: 'ISO',     verificationStatus: 'unverified' },
  ];

  for (const c of certifications) {
    await prisma.certification.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, expiryDate: c.expiryDate || null },
    });
  }

  // Agreements
  const agreements = [
    // Cosmax — all signed
    { id: 'agr_01', aosSupplierId: 'aos_01', agreementType: 'NDA',     status: 'signed', signedAt: daysAgo(60) },
    { id: 'agr_02', aosSupplierId: 'aos_01', agreementType: 'MSA',     status: 'signed', signedAt: daysAgo(45) },
    { id: 'agr_03', aosSupplierId: 'aos_01', agreementType: 'IP',      status: 'signed', signedAt: daysAgo(45) },
    { id: 'agr_04', aosSupplierId: 'aos_01', agreementType: 'Payment', status: 'signed', signedAt: daysAgo(30) },
    // Intercos — NDA + MSA signed
    { id: 'agr_05', aosSupplierId: 'aos_02', agreementType: 'NDA',     status: 'signed', signedAt: daysAgo(30) },
    { id: 'agr_06', aosSupplierId: 'aos_02', agreementType: 'MSA',     status: 'sent' },
    { id: 'agr_07', aosSupplierId: 'aos_02', agreementType: 'IP',      status: 'not_started' },
    { id: 'agr_08', aosSupplierId: 'aos_02', agreementType: 'Payment', status: 'not_started' },
    // Kolmar — all signed
    { id: 'agr_09', aosSupplierId: 'aos_03', agreementType: 'NDA',     status: 'signed', signedAt: daysAgo(90) },
    { id: 'agr_10', aosSupplierId: 'aos_03', agreementType: 'MSA',     status: 'signed', signedAt: daysAgo(75) },
    { id: 'agr_11', aosSupplierId: 'aos_03', agreementType: 'IP',      status: 'signed', signedAt: daysAgo(75) },
    { id: 'agr_12', aosSupplierId: 'aos_03', agreementType: 'Payment', status: 'signed', signedAt: daysAgo(60) },
    // Ancorotti — NDA signed, rest in progress
    { id: 'agr_13', aosSupplierId: 'aos_06', agreementType: 'NDA',     status: 'signed', signedAt: daysAgo(20) },
    { id: 'agr_14', aosSupplierId: 'aos_06', agreementType: 'MSA',     status: 'sent' },
    { id: 'agr_15', aosSupplierId: 'aos_06', agreementType: 'IP',      status: 'not_started' },
    { id: 'agr_16', aosSupplierId: 'aos_06', agreementType: 'Payment', status: 'not_started' },
    // Cosmolab — NDA only
    { id: 'agr_17', aosSupplierId: 'aos_09', agreementType: 'NDA',     status: 'signed', signedAt: daysAgo(15) },
  ];

  for (const a of agreements) {
    await prisma.agreement.upsert({
      where: { id: a.id },
      update: {},
      create: { ...a, signedAt: a.signedAt || null },
    });
  }

  // Supplier Briefs
  const supplierBriefs = [
    { id: 'sb_01', name: 'Vitamin C Brightening Serum — Glosslab', customerName: 'Glosslab', category: 'face-care', subcategory: 'Vitamin C', blendFillType: 'Emulsion', dueDate: new Date('2026-03-28'), filterCategories: ['face-care', 'spf'], requiredCerts: ['GMP', 'ISO'], requirements: { vegan: true } },
    { id: 'sb_02', name: 'Tinted SPF Moisturiser — Rhude Beauty', customerName: 'Rhude Beauty', category: 'spf', subcategory: 'Tinted SPF', blendFillType: 'Emulsion', dueDate: new Date('2026-04-15'), filterCategories: ['spf', 'face-care'], requiredCerts: ['GMP', 'FDA'], requirements: {} },
    { id: 'sb_03', name: 'Scalp Treatment Shampoo — Kmart', customerName: 'Kmart', category: 'hair-care', subcategory: 'Shampoo', blendFillType: 'Liquid', dueDate: new Date('2026-04-30'), filterCategories: ['hair-care'], requiredCerts: ['GMP'], requirements: {} },
  ];

  for (const sb of supplierBriefs) {
    await prisma.supplierBrief.upsert({
      where: { id: sb.id },
      update: {},
      create: { ...sb, teamId },
    });
  }

  // Supplier Brief Assignments (with match scores)
  const briefAssignments = [
    { id: 'sba_01', aosSupplierId: 'aos_01', supplierBriefId: 'sb_01', matchScore: 100, matchBreakdown: { GMP: true, ISO: true }, status: 'vetted', assignedById: userId },
    { id: 'sba_02', aosSupplierId: 'aos_03', supplierBriefId: 'sb_01', matchScore: 100, matchBreakdown: { GMP: true, ISO: true }, status: 'assigned', assignedById: userId },
    { id: 'sba_03', aosSupplierId: 'aos_02', supplierBriefId: 'sb_01', matchScore: 50, matchBreakdown: { GMP: true, ISO: false }, status: 'assigned', assignedById: userId },
    { id: 'sba_04', aosSupplierId: 'aos_01', supplierBriefId: 'sb_02', matchScore: 100, matchBreakdown: { GMP: true, FDA: true }, status: 'assigned', assignedById: userId },
    { id: 'sba_05', aosSupplierId: 'aos_09', supplierBriefId: 'sb_03', matchScore: 100, matchBreakdown: { GMP: true }, status: 'assigned', assignedById: saraId },
    { id: 'sba_06', aosSupplierId: 'aos_04', supplierBriefId: 'sb_03', matchScore: 0, matchBreakdown: { GMP: false }, status: 'assigned', assignedById: saraId },
  ];

  for (const sba of briefAssignments) {
    await prisma.supplierBriefAssignment.upsert({
      where: { id: sba.id },
      update: {},
      create: sba,
    });
  }

  // Supplier activities
  const supplierActivities = [
    { id: 'sact_01', entityType: 'supplier', entityId: 'aos_01', userId, type: 'stage_transition', description: 'transitioned from "Identified" to "Fully Qualified"', metadata: { from: 'Identified', to: 'Fully Qualified' }, createdAt: daysAgo(60) },
    { id: 'sact_02', entityType: 'supplier', entityId: 'aos_01', userId, type: 'supplier_linked', description: 'linked Cobalt supplier "Cosmax Inc." to AoS', metadata: { cobaltSupplierId: 'cob_01', direction: 'cobalt_to_aos' }, createdAt: daysAgo(90) },
    { id: 'sact_03', entityType: 'supplier', entityId: 'aos_08', userId: saraId, type: 'stage_transition', description: 'transitioned from "Outreached" to "Paused"', metadata: { from: 'Outreached', to: 'Paused', reason: 'Supplier declined', reasonNote: 'Went dark for 3 months after initial engagement' }, createdAt: daysAgo(30) },
    { id: 'sact_04', entityType: 'supplier', entityId: 'aos_11', userId, type: 'stage_transition', description: 'transitioned from "Capability Confirmed" to "Blacklisted"', metadata: { from: 'Capability Confirmed', to: 'Blacklisted', reason: 'Quality concerns', reasonNote: 'Failed quality audit — product contamination found' }, createdAt: daysAgo(45) },
    { id: 'sact_05', entityType: 'supplier', entityId: 'aos_01', userId, type: 'brief_assigned', description: 'assigned to brief "Vitamin C Brightening Serum — Glosslab"', metadata: { supplierBriefId: 'sb_01', matchScore: 100 }, createdAt: daysAgo(10) },
    { id: 'sact_06', entityType: 'supplier', entityId: 'aos_02', userId: saraId, type: 'manual_entry', description: 'Call with Intercos — discussed MOQ flexibility for smaller runs. They may consider 10k units for a trial.', metadata: { date: daysAgo(5).toISOString(), type: 'call' }, createdAt: daysAgo(5) },
  ];

  for (const sa of supplierActivities) {
    await prisma.activity.upsert({
      where: { id: sa.id },
      update: {},
      create: sa,
    });
  }

  // Supplier Contacts
  const contacts = [
    { id: 'sc_01', aosSupplierId: 'aos_01', name: 'Min-Jun Park', title: 'Business Development Manager', email: 'minjun.park@cosmax.com', mobile: '+82-10-1234-5678', weChat: null, isPrimary: true },
    { id: 'sc_02', aosSupplierId: 'aos_01', name: 'Soo-Yeon Kim', title: 'Technical Director', email: 'sooyeon.kim@cosmax.com', mobile: '+82-10-8765-4321', weChat: null, isPrimary: false },
    { id: 'sc_03', aosSupplierId: 'aos_02', name: 'Marco Rossi', title: 'VP International Sales', email: 'marco.rossi@intercos.com', mobile: '+39-02-1234-5678', weChat: null, isPrimary: true },
    { id: 'sc_04', aosSupplierId: 'aos_03', name: 'Ji-Hye Lee', title: 'Export Sales Manager', email: 'jihye.lee@kolmar.co.kr', mobile: '+82-10-5555-1234', weChat: null, isPrimary: true },
    { id: 'sc_05', aosSupplierId: 'aos_06', name: 'Giulia Bianchi', title: 'Key Account Manager', email: 'giulia.bianchi@ancorotti.com', mobile: '+39-0373-123456', weChat: null, isPrimary: true },
    { id: 'sc_06', aosSupplierId: 'aos_09', name: 'Priya Sharma', title: 'Head of International Business', email: 'priya.sharma@cosmolab.in', mobile: '+91-98765-43210', weChat: null, isPrimary: true },
    { id: 'sc_07', aosSupplierId: 'aos_09', name: 'Raj Patel', title: 'Production Manager', email: 'raj.patel@cosmolab.in', mobile: '+91-91234-56789', weChat: null, isPrimary: false },
    { id: 'sc_08', aosSupplierId: 'aos_10', name: 'Anna Kowalska', title: 'Commercial Director', email: 'anna.kowalska@biofarma.pl', mobile: '+48-22-123-4567', weChat: null, isPrimary: true },
  ];

  for (const c of contacts) {
    await prisma.supplierContact.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  console.log('✓ Seeded successfully!');
  console.log('  Users:          2 (rory@atelier.com / sara@atelier.com)');
  console.log('  Password:       password123');
  console.log('  Ingredients:    ' + ingredients.length);
  console.log('  Formulations:   ' + formulations.length);
  console.log('  Packaging:      ' + packaging.length);
  console.log('  Projects:       ' + projects.length);
  console.log('  Sample Orders:  ' + sampleOrders.length);
  console.log('  AoS Suppliers:  ' + aosSuppliers.length);
  console.log('  Cobalt Suppliers: ' + cobaltSuppliers.length);
  console.log('  Certifications: ' + certifications.length);
  console.log('  Agreements:     ' + agreements.length);
  console.log('  Supplier Briefs: ' + supplierBriefs.length);
  console.log('  Brief Assigns:  ' + briefAssignments.length);
  console.log('  Contacts:       ' + contacts.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
