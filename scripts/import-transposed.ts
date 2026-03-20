/**
 * Import transposed supplier CSVs (suppliers as columns, attributes as rows)
 * into the Supplier Intelligence Platform.
 *
 * Usage:
 *   npx tsx scripts/import-transposed.ts <csv-file> [--dry-run] [--brief "Brief Name"]
 *
 * Auto-detects:
 *   - Header row (supplier names) and label column
 *   - Variable layouts (label in col 0, col 1, etc.)
 *   - Emoji cert statuses (✅ verified, 🟠 pending/unverified, ❌ skip)
 *   - Expired cert detection
 *   - Working status / Status → qualificationStage mapping
 *   - Multi-email contacts (newline-separated)
 *   - Separate Contact Name + Contact Email rows
 *   - Brief Fit notes → activity log
 *   - Capability type (Turnkey, Formula, Packaging)
 *   - Duplicate detection by companyName
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import * as fs from 'fs';
import * as path from 'path';

// Load .env
const _envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(_envPath)) {
  for (const line of fs.readFileSync(_envPath, 'utf-8').split('\n')) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.+)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

function createPrisma(): PrismaClient {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

// ─── CSV Parsing (RFC 4180 — handles quoted fields with commas/newlines) ──

function parseCsvRfc4180(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field);
        field = '';
        i++;
      } else if (ch === '\r') {
        i++;
      } else if (ch === '\n') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

// ─── Layout detection ─────────────────────────────────────────────────────

// Known label strings we expect to find in the label column
const KNOWN_LABELS = [
  'status', 'type', 'factory location', 'working status', 'iso 22716',
  'nda', 'supply agreement', 'brands worked with', 'contact', 'brief fit',
  'product capabilities', 'fill capabilities', 'social audit', 'iso 14001',
  'iso 9001', 'fda', 'capabilities',
];

function detectLayout(grid: string[][]): { nameRow: number; labelCol: number; dataStartCol: number } {
  // Find the row with the most non-empty cells → supplier name row
  let nameRow = 0;
  let maxNonEmpty = 0;
  for (let r = 0; r < Math.min(grid.length, 15); r++) {
    const nonEmpty = grid[r].filter(c => c.trim().length > 0).length;
    if (nonEmpty > maxNonEmpty) {
      maxNonEmpty = nonEmpty;
      nameRow = r;
    }
  }

  // Find the label column — the column with the most known labels
  let labelCol = 0;
  let maxMatches = 0;
  for (let c = 0; c < Math.min(3, grid[0]?.length || 0); c++) {
    let matches = 0;
    for (let r = 0; r < grid.length; r++) {
      const cell = (grid[r][c] || '').toLowerCase().trim();
      if (KNOWN_LABELS.some(l => cell.includes(l))) matches++;
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      labelCol = c;
    }
  }

  // Data columns start after the label column
  const dataStartCol = labelCol + 1;

  return { nameRow, labelCol, dataStartCol };
}

// ─── Mappers ───────────────────────────────────────────────────────────────

function mapStage(raw: string): string {
  const n = raw.toLowerCase().trim().replace(/\n/g, ' ');
  if (n.includes('not viable'))                    return 'Paused';
  if (n.includes('handed over'))                   return 'Capability Confirmed';
  if (n.includes('in progress'))                   return 'Outreached';
  if (n.includes('new outreach') || n.includes('outreach')) return 'Identified';
  if (n.includes('completed production'))          return 'Fully Qualified';
  if (n.includes('active') && !n.includes('not'))  return 'Fully Qualified';
  if (n.includes('quoted and sampled'))            return 'Capability Confirmed';
  if (n.includes('newly onboa'))                   return 'Outreached';
  if (n.includes('sampling'))                      return 'Capability Confirmed';
  if (n.includes('blacklisted') || n.includes('banned')) return 'Blacklisted';
  if (n.includes('paused'))                        return 'Paused';
  if (n.includes('new'))                           return 'Outreached';
  return 'Identified';
}

function mapCapabilityType(raw: string): string {
  const n = raw.toLowerCase().trim();
  if (n === 'turnkey')  return 'turnkey';
  if (n === 'formula')  return 'blend_fill';
  if (n === 'packaging') return 'unknown'; // packaging-only suppliers
  if (n.includes('turnkey') && n.includes('formula')) return 'both';
  return 'unknown';
}

type CertResult = {
  certType: string;
  verificationStatus: 'verified' | 'unverified' | 'expired';
  note?: string;
} | null;

function parseCertCell(cell: string, certType: string): CertResult {
  const trimmed = cell.trim();
  if (!trimmed || trimmed === '❌' || trimmed.toUpperCase() === 'NA' || trimmed === 'NA') return null;

  const hasCheck = trimmed.includes('✅');
  const hasPending = trimmed.includes('🟠') || trimmed.toLowerCase().includes('pending')
    || trimmed.toLowerCase().includes('checking') || trimmed.toLowerCase().includes('requested');
  const hasExpired = trimmed.toLowerCase().includes('expired');
  const hasMore = trimmed.toLowerCase().includes('more than 1 year');

  if (hasExpired || hasMore) {
    return { certType, verificationStatus: 'expired', note: trimmed.replace(/[✅🟠❌]/g, '').trim() };
  }
  if (hasCheck) {
    return { certType, verificationStatus: 'verified', note: trimmed.replace(/[✅🟠❌]/g, '').trim() || undefined };
  }
  if (hasPending) {
    return { certType, verificationStatus: 'unverified', note: trimmed.replace(/[✅🟠❌]/g, '').trim() || undefined };
  }

  // Has text but no clear status → unverified
  return { certType, verificationStatus: 'unverified', note: trimmed };
}

type AgreementResult = {
  agreementType: string;
  status: 'not_started' | 'sent' | 'signed';
  note?: string;
} | null;

function parseAgreementCell(cell: string, agreementType: string): AgreementResult {
  const trimmed = cell.trim();
  if (!trimmed || trimmed === '❌') return null;

  const hasCheck = trimmed.includes('✅');
  const hasCompleted = trimmed.toLowerCase().includes('completed');
  const hasSent = trimmed.toLowerCase().includes('sent');
  const hasReview = trimmed.toLowerCase().includes('under review');
  const hasMutual = trimmed.toLowerCase().includes('mutual');
  const hasOldVersion = trimmed.toLowerCase().includes('old version');

  if (hasCheck || hasCompleted) {
    return { agreementType, status: 'signed', note: trimmed.replace(/[✅🟠❌]/g, '').trim() || undefined };
  }
  if (hasSent || hasReview || hasMutual) {
    return { agreementType, status: 'sent', note: trimmed.replace(/[✅🟠❌]/g, '').trim() || undefined };
  }
  if (hasOldVersion) {
    return { agreementType, status: 'signed', note: trimmed };
  }

  // Has some value (e.g., "24 months")
  return { agreementType, status: 'signed', note: trimmed.replace(/[✅🟠❌]/g, '').trim() || undefined };
}

function parseEmails(cell: string): string[] {
  return cell
    .split(/[\n,;]+/)
    .map(e => e.trim())
    .filter(e => e.includes('@'));
}

function parseList(cell: string): string[] {
  return cell
    .split(/[,;]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// ─── Row label → field mapping ──────────────────────────────────────────

function normalise(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const ROW_MATCHERS: { test: (n: string) => boolean; field: string }[] = [
  // Capabilities & categories
  { test: n => n.includes('productcapabilit'),     field: 'categories' },
  { test: n => n.includes('fillcapabilit'),         field: 'fillCapabilities' },
  { test: n => n === 'type',                        field: 'type' },

  // Location
  { test: n => n.includes('factorylocation'),       field: 'factoryCountry' },

  // Status fields
  { test: n => n.includes('workingstatus'),         field: 'workingStatus' },
  { test: n => n === 'status' || (n.startsWith('status') && n.length < 10), field: 'status' },

  // Brief
  { test: n => n.includes('brieffit'),              field: 'briefFit' },

  // Certifications
  { test: n => n.includes('iso22716'),              field: 'cert_ISO_22716' },
  { test: n => n.includes('iso14001'),              field: 'cert_ISO_14001' },
  { test: n => n.includes('iso9001'),               field: 'cert_ISO_9001' },
  { test: n => n.includes('socialaudit') || n.includes('smeta') || n.includes('bsci'), field: 'cert_SMETA' },
  { test: n => n.includes('fdamocra') || n.includes('fdafei') || n === 'fda', field: 'cert_FDA' },

  // Agreements
  { test: n => n.includes('ndanc') || (n.includes('nda') && !n.includes('brand')), field: 'agreement_NDA' },
  { test: n => n.includes('supplyagreement') || n.includes('msa'), field: 'agreement_MSA' },

  // Brands
  { test: n => n.includes('brandsworked'),          field: 'keyBrands' },
  { test: n => n.includes('brandcheck'),            field: 'brandCheck' },

  // Contacts — separate name and email
  { test: n => n === 'contactname' || n === 'contactnames', field: 'contactName' },
  { test: n => n === 'contact' || n === 'contactemail',     field: 'contact' },

  // Other
  { test: n => n.includes('moq') || n.includes('minimumorder'), field: 'moq' },
  { test: n => n.includes('location') && !n.includes('factory'), field: 'country' },
  { test: n => n.includes('country') && !n.includes('factory'),  field: 'country' },
  { test: n => n === 'turnkey',                     field: 'turnkeyFlag' },
  { test: n => n.includes('ipownership'),           field: 'ipOwnership' },
  { test: n => n === 'rd' || n.includes('rdfee'),   field: 'rdInfo' },
];

function identifyField(label: string): string | null {
  const n = normalise(label);
  if (!n) return null;
  for (const m of ROW_MATCHERS) {
    if (m.test(n)) return m.field;
  }
  return null;
}

// ─── Main ──────────────────────────────────────────────────────────────────

type SupplierData = Record<string, string>;

async function importFile(filePath: string, dryRun: boolean, briefName?: string) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const grid = parseCsvRfc4180(raw);

  if (grid.length < 2) {
    console.error('CSV has fewer than 2 rows — nothing to import.');
    process.exit(1);
  }

  // Auto-detect layout
  const { nameRow, labelCol, dataStartCol } = detectLayout(grid);
  console.log(`\nLayout: supplier names in row ${nameRow}, labels in col ${labelCol}, data starts col ${dataStartCol}`);

  // Extract supplier names from the name row
  const supplierNames = grid[nameRow].slice(dataStartCol).map(s => s.trim()).filter(Boolean);
  const supplierCount = supplierNames.length;

  console.log(`Found ${supplierCount} suppliers in: ${path.basename(filePath)}`);
  console.log('Suppliers:', supplierNames.join(', '));

  // Extract row labels
  const rowLabels = grid.map(row => (row[labelCol] || '').trim());
  const mappedLabels = rowLabels
    .filter(Boolean)
    .map(l => ({ label: l, field: identifyField(l) }))
    .filter(x => x.field);
  console.log('Mapped fields:', mappedLabels.map(x => `${x.label} → ${x.field}`).join(', '));

  // Unmapped labels (for debugging)
  const unmappedLabels = rowLabels
    .filter(l => l && !identifyField(l) && l.toLowerCase() !== 'manufacturer overview' && l.toLowerCase() !== 'internal only')
    .filter((v, i, a) => a.indexOf(v) === i);
  if (unmappedLabels.length > 0) {
    console.log('Unmapped rows:', unmappedLabels.join(', '));
  }

  // Build supplier data objects
  const suppliers: SupplierData[] = [];
  for (let colIdx = 0; colIdx < supplierCount; colIdx++) {
    const gridCol = dataStartCol + colIdx;
    const name = (grid[nameRow][gridCol] || '').trim();
    if (!name) continue;

    const data: SupplierData = { companyName: name };
    for (let row = nameRow + 1; row < grid.length; row++) {
      const label = rowLabels[row];
      if (!label) continue;
      const field = identifyField(label);
      if (field) {
        const value = (grid[row][gridCol] || '').trim();
        // If field already has a value (e.g., duplicate "Status" rows), prefer the first non-empty
        if (!data[field] || !data[field].trim()) {
          data[field] = value;
        }
      }
    }
    suppliers.push(data);
  }

  // DB setup — only connect when not dry-running
  let prisma: PrismaClient | null = null;
  let team: { id: string } | null = null;
  let user: { id: string } | null = null;
  let existingSet = new Set<string>();
  let brief: { id: string } | null = null;

  if (!dryRun) {
    prisma = createPrisma();

    team = await prisma.team.findFirst();
    if (!team) {
      console.error('No team found in database. Run seed first.');
      process.exit(1);
    }

    user = await prisma.user.findFirst({ where: { teamMemberships: { some: { teamId: team.id } } } });
    if (!user) {
      console.error('No user found for team.');
      process.exit(1);
    }

    const existing = await prisma.aosSupplier.findMany({
      where: { teamId: team.id },
      select: { companyName: true },
    });
    existingSet = new Set(existing.map(e => e.companyName.toLowerCase()));

    if (briefName) {
      brief = await prisma.supplierBrief.findFirst({
        where: { teamId: team.id, name: briefName },
      });
      if (!brief) {
        brief = await prisma.supplierBrief.create({
          data: {
            name: briefName,
            category: 'General',
            teamId: team.id,
          },
        });
        console.log(`Created brief: "${briefName}"`);
      }
    }
  }

  console.log(`\n${'─'.repeat(60)}`);

  let created = 0;
  let skipped = 0;

  for (const s of suppliers) {
    const isDuplicate = !dryRun && existingSet.has(s.companyName.toLowerCase());

    // Use 'status' field first (YSB style), fall back to 'workingStatus' (Soulea style)
    const stageRaw = s.status || s.workingStatus || '';
    const stage = mapStage(stageRaw);

    const capabilityType = mapCapabilityType(s.type || '');
    const categories = parseList(s.categories || '');
    const fillCaps = parseList(s.fillCapabilities || '');
    const brands = parseList(s.keyBrands || '');
    const emails = parseEmails(s.contact || '');
    const contactName = (s.contactName || '').trim();
    const country = s.factoryCountry || s.country || '';

    // Parse certs
    const certs = [
      parseCertCell(s.cert_ISO_22716 || '', 'ISO_22716'),
      parseCertCell(s.cert_ISO_14001 || '', 'ISO_14001'),
      parseCertCell(s.cert_ISO_9001 || '', 'ISO_9001'),
      parseCertCell(s.cert_SMETA || '', 'SMETA'),
      parseCertCell(s.cert_FDA || '', 'FDA'),
    ].filter((c): c is NonNullable<CertResult> => c !== null);

    // Parse agreements
    const agreements = [
      parseAgreementCell(s.agreement_NDA || '', 'NDA'),
      parseAgreementCell(s.agreement_MSA || '', 'MSA'),
    ].filter((a): a is NonNullable<AgreementResult> => a !== null);

    // Print summary
    const statusIcon = isDuplicate ? '⚠️  SKIP (dup)' : dryRun ? '🔍 DRY RUN' : '✅ IMPORT';
    console.log(`\n${statusIcon}: ${s.companyName}`);
    console.log(`  Stage:    ${stage} (raw: "${stageRaw.replace(/\n/g, ' ').substring(0, 50)}")`);
    console.log(`  Type:     ${capabilityType} (raw: "${s.type || ''}")`);
    console.log(`  Country:  ${country || '—'}`);
    console.log(`  Cats:     ${categories.join(', ') || '—'}`);
    console.log(`  Brands:   ${brands.join(', ').substring(0, 80) || '—'}`);
    console.log(`  Certs:    ${certs.map(c => `${c.certType} (${c.verificationStatus})`).join(', ') || '—'}`);
    console.log(`  Agree:    ${agreements.map(a => `${a.agreementType} (${a.status})`).join(', ') || '—'}`);
    console.log(`  Contact:  ${contactName || '—'} | ${emails.join(', ') || '—'}`);

    if (isDuplicate) {
      skipped++;
      continue;
    }

    if (dryRun) continue;

    // Create supplier
    const aos = await prisma!.aosSupplier.create({
      data: {
        companyName: s.companyName,
        qualificationStage: stage,
        capabilityType,
        categories: categories as unknown as Prisma.InputJsonValue,
        subcategories: fillCaps as unknown as Prisma.InputJsonValue,
        factoryCountry: country,
        companyCountry: country,
        keyBrands: brands as unknown as Prisma.InputJsonValue,
        // Store the raw status as a caution note if supplier is not viable
        cautionFlag: stage === 'Paused' && stageRaw.toLowerCase().includes('not viable'),
        cautionNote: stageRaw.toLowerCase().includes('not viable') ? stageRaw.replace(/\n/g, ' ').trim() : undefined,
        teamId: team!.id,
      },
    });

    // Create certs
    for (const cert of certs) {
      await prisma!.certification.create({
        data: {
          aosSupplierId: aos.id,
          certType: cert.certType,
          verificationStatus: cert.verificationStatus,
          scope: cert.note || undefined,
        },
      });
    }

    // Create agreements
    for (const agr of agreements) {
      await prisma!.agreement.create({
        data: {
          aosSupplierId: aos.id,
          agreementType: agr.agreementType,
          status: agr.status,
        },
      });
    }

    // Create contacts — use contact name if available, else derive from email
    if (emails.length > 0) {
      const names = contactName ? contactName.split(/[,;&]+/).map(n => n.trim()) : [];
      for (let i = 0; i < emails.length; i++) {
        await prisma!.supplierContact.create({
          data: {
            aosSupplierId: aos.id,
            name: names[i] || emails[i].split('@')[0],
            email: emails[i],
            isPrimary: i === 0,
          },
        });
      }
    } else if (contactName) {
      // Has name but no email
      await prisma!.supplierContact.create({
        data: {
          aosSupplierId: aos.id,
          name: contactName,
          isPrimary: true,
        },
      });
    }

    // Log brief fit as activity if present
    if (s.briefFit && s.briefFit !== '❌') {
      await prisma!.activity.create({
        data: {
          entityType: 'supplier',
          entityId: aos.id,
          userId: user!.id,
          type: 'manual_entry',
          description: `Brief fit: ${s.briefFit.replace(/\n/g, ' ').trim()}`,
        },
      });
    }

    // Assign to brief if specified
    if (brief) {
      await prisma!.supplierBriefAssignment.create({
        data: {
          aosSupplierId: aos.id,
          supplierBriefId: brief.id,
          assignedById: user!.id,
          status: 'assigned',
        },
      });
    }

    created++;
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Done. Created: ${created} | Skipped: ${skipped} | Total: ${suppliers.length}`);
  if (dryRun) console.log('(Dry run — no records written. Remove --dry-run to import.)');

  if (prisma) await prisma.$disconnect();
}

// ─── CLI ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const filePath = args.find(a => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
const briefIdx = args.indexOf('--brief');
const briefName = briefIdx >= 0 ? args[briefIdx + 1] : undefined;

if (!filePath) {
  console.log(`
Usage: npx tsx scripts/import-transposed.ts <csv-file> [options]

Options:
  --dry-run              Preview what would be imported without writing to DB
  --brief "Brief Name"   Assign all imported suppliers to a brief (creates if needed)

Examples:
  npx tsx scripts/import-transposed.ts ~/Downloads/soulea-rfq.csv --dry-run
  npx tsx scripts/import-transposed.ts ~/Downloads/soulea-rfq.csv --brief "Soulea RFQ"
`);
  process.exit(0);
}

const resolved = path.resolve(filePath);
if (!fs.existsSync(resolved)) {
  console.error(`File not found: ${resolved}`);
  process.exit(1);
}

importFile(resolved, dryRun, briefName)
  .catch(err => {
    console.error('Import failed:', err);
    process.exit(1);
  });
