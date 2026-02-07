/**
 * Mock drugs database with common Indian medications
 * Includes interaction data for demo alerts
 */

import type { Drug, DrugInteraction, LabTest, ICD10Code } from './types';

export const mockDrugs: Drug[] = [
  // Antidiabetics
  {
    id: 'drug-001',
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    brand: 'Glycomet',
    manufacturer: 'USV',
    category: 'Antidiabetic',
    forms: ['Tablet'],
    strengths: ['500mg', '850mg', '1000mg'],
    schedule: 'H',
    interactsWith: ['drug-020'], // Contrast agents
    contraindications: ['Renal impairment', 'Hepatic impairment', 'Alcoholism'],
    sideEffects: ['Nausea', 'Diarrhea', 'Abdominal pain'],
    isActive: true,
  },
  {
    id: 'drug-002',
    name: 'Glimepiride',
    genericName: 'Glimepiride',
    brand: 'Amaryl',
    manufacturer: 'Sanofi',
    category: 'Antidiabetic',
    forms: ['Tablet'],
    strengths: ['1mg', '2mg', '4mg'],
    schedule: 'H',
    interactsWith: ['drug-015'], // NSAIDs
    contraindications: ['Type 1 diabetes', 'Diabetic ketoacidosis'],
    sideEffects: ['Hypoglycemia', 'Weight gain', 'Dizziness'],
    isActive: true,
  },
  // Antihypertensives
  {
    id: 'drug-003',
    name: 'Amlodipine',
    genericName: 'Amlodipine Besylate',
    brand: 'Amlong',
    manufacturer: 'Micro Labs',
    category: 'Antihypertensive',
    forms: ['Tablet'],
    strengths: ['2.5mg', '5mg', '10mg'],
    schedule: 'H',
    interactsWith: ['drug-004'], // Simvastatin - important interaction
    contraindications: ['Severe hypotension', 'Cardiogenic shock'],
    sideEffects: ['Edema', 'Headache', 'Flushing'],
    isActive: true,
  },
  {
    id: 'drug-004',
    name: 'Telmisartan',
    genericName: 'Telmisartan',
    brand: 'Telma',
    manufacturer: 'Glenmark',
    category: 'Antihypertensive',
    forms: ['Tablet'],
    strengths: ['20mg', '40mg', '80mg'],
    schedule: 'H',
    interactsWith: ['drug-015'], // NSAIDs
    contraindications: ['Pregnancy', 'Bilateral renal artery stenosis'],
    sideEffects: ['Dizziness', 'Back pain', 'Diarrhea'],
    isActive: true,
  },
  {
    id: 'drug-005',
    name: 'Atenolol',
    genericName: 'Atenolol',
    brand: 'Aten',
    manufacturer: 'Zydus',
    category: 'Beta Blocker',
    forms: ['Tablet'],
    strengths: ['25mg', '50mg', '100mg'],
    schedule: 'H',
    interactsWith: ['drug-006'], // Verapamil
    contraindications: ['Asthma', 'Heart block', 'Bradycardia'],
    sideEffects: ['Fatigue', 'Cold extremities', 'Bradycardia'],
    isActive: true,
  },
  // Statins
  {
    id: 'drug-006',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    brand: 'Atorva',
    manufacturer: 'Zydus',
    category: 'Statin',
    forms: ['Tablet'],
    strengths: ['10mg', '20mg', '40mg', '80mg'],
    schedule: 'H',
    interactsWith: ['drug-003'], // Amlodipine increases levels
    contraindications: ['Active liver disease', 'Pregnancy'],
    sideEffects: ['Muscle pain', 'Elevated liver enzymes', 'Headache'],
    isActive: true,
  },
  {
    id: 'drug-007',
    name: 'Rosuvastatin',
    genericName: 'Rosuvastatin Calcium',
    brand: 'Rozavel',
    manufacturer: 'Sun Pharma',
    category: 'Statin',
    forms: ['Tablet'],
    strengths: ['5mg', '10mg', '20mg', '40mg'],
    schedule: 'H',
    interactsWith: [],
    contraindications: ['Active liver disease', 'Pregnancy'],
    sideEffects: ['Headache', 'Myalgia', 'Abdominal pain'],
    isActive: true,
  },
  // Analgesics
  {
    id: 'drug-008',
    name: 'Paracetamol',
    genericName: 'Paracetamol',
    brand: 'Crocin',
    manufacturer: 'GSK',
    category: 'Analgesic',
    forms: ['Tablet', 'Syrup', 'Suspension'],
    strengths: ['500mg', '650mg', '125mg/5ml'],
    schedule: 'OTC',
    interactsWith: [],
    contraindications: ['Severe hepatic impairment'],
    sideEffects: ['Rare at therapeutic doses'],
    isActive: true,
  },
  {
    id: 'drug-009',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    brand: 'Brufen',
    manufacturer: 'Abbott',
    category: 'NSAID',
    forms: ['Tablet', 'Suspension'],
    strengths: ['200mg', '400mg', '600mg', '100mg/5ml'],
    schedule: 'H',
    interactsWith: ['drug-004', 'drug-010'], // ARBs, Aspirin
    contraindications: ['Peptic ulcer', 'Renal impairment', 'Third trimester pregnancy'],
    sideEffects: ['GI upset', 'Headache', 'Dizziness'],
    isActive: true,
  },
  {
    id: 'drug-010',
    name: 'Aspirin',
    genericName: 'Acetylsalicylic Acid',
    brand: 'Ecosprin',
    manufacturer: 'USV',
    category: 'Antiplatelet',
    forms: ['Tablet'],
    strengths: ['75mg', '150mg', '325mg'],
    schedule: 'H',
    interactsWith: ['drug-009', 'drug-011'], // Ibuprofen, Warfarin
    contraindications: ['Peptic ulcer', 'Bleeding disorders', 'Children with viral infections'],
    sideEffects: ['GI bleeding', 'Tinnitus', 'Bruising'],
    isActive: true,
  },
  // Antibiotics
  {
    id: 'drug-011',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin Trihydrate',
    brand: 'Mox',
    manufacturer: 'Ranbaxy',
    category: 'Antibiotic',
    forms: ['Capsule', 'Suspension'],
    strengths: ['250mg', '500mg', '125mg/5ml'],
    schedule: 'H',
    interactsWith: ['drug-012'], // Methotrexate
    contraindications: ['Penicillin allergy', 'Mononucleosis'],
    sideEffects: ['Diarrhea', 'Rash', 'Nausea'],
    isActive: true,
  },
  {
    id: 'drug-012',
    name: 'Azithromycin',
    genericName: 'Azithromycin Dihydrate',
    brand: 'Azithral',
    manufacturer: 'Alembic',
    category: 'Antibiotic',
    forms: ['Tablet', 'Suspension'],
    strengths: ['250mg', '500mg', '200mg/5ml'],
    schedule: 'H',
    interactsWith: [],
    contraindications: ['Macrolide allergy', 'Hepatic impairment'],
    sideEffects: ['Diarrhea', 'Nausea', 'Abdominal pain'],
    isActive: true,
  },
  {
    id: 'drug-013',
    name: 'Ciprofloxacin',
    genericName: 'Ciprofloxacin Hydrochloride',
    brand: 'Ciplox',
    manufacturer: 'Cipla',
    category: 'Antibiotic',
    forms: ['Tablet'],
    strengths: ['250mg', '500mg', '750mg'],
    schedule: 'H',
    interactsWith: ['drug-014'], // Theophylline
    contraindications: ['Tendon disorders', 'Myasthenia gravis', 'Children'],
    sideEffects: ['Nausea', 'Diarrhea', 'Tendinitis'],
    isActive: true,
  },
  // Antacids & PPIs
  {
    id: 'drug-014',
    name: 'Pantoprazole',
    genericName: 'Pantoprazole Sodium',
    brand: 'Pan',
    manufacturer: 'Alkem',
    category: 'PPI',
    forms: ['Tablet', 'Injection'],
    strengths: ['20mg', '40mg'],
    schedule: 'H',
    interactsWith: [],
    contraindications: ['Hypersensitivity'],
    sideEffects: ['Headache', 'Diarrhea', 'Nausea'],
    isActive: true,
  },
  {
    id: 'drug-015',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    brand: 'Omez',
    manufacturer: "Dr. Reddy's",
    category: 'PPI',
    forms: ['Capsule'],
    strengths: ['20mg', '40mg'],
    schedule: 'H',
    interactsWith: ['drug-016'], // Clopidogrel - important!
    contraindications: ['Hypersensitivity'],
    sideEffects: ['Headache', 'Abdominal pain', 'Nausea'],
    isActive: true,
  },
  // Antihistamines
  {
    id: 'drug-016',
    name: 'Cetirizine',
    genericName: 'Cetirizine Hydrochloride',
    brand: 'Cetzine',
    manufacturer: 'Unichem',
    category: 'Antihistamine',
    forms: ['Tablet', 'Syrup'],
    strengths: ['10mg', '5mg/5ml'],
    schedule: 'OTC',
    interactsWith: [],
    contraindications: ['Severe renal impairment'],
    sideEffects: ['Drowsiness', 'Dry mouth', 'Fatigue'],
    isActive: true,
  },
  {
    id: 'drug-017',
    name: 'Levocetirizine',
    genericName: 'Levocetirizine Dihydrochloride',
    brand: 'Xyzal',
    manufacturer: 'UCB',
    category: 'Antihistamine',
    forms: ['Tablet', 'Syrup'],
    strengths: ['5mg', '2.5mg/5ml'],
    schedule: 'H',
    interactsWith: [],
    contraindications: ['Severe renal impairment'],
    sideEffects: ['Drowsiness', 'Headache', 'Dry mouth'],
    isActive: true,
  },
  // Muscle Relaxants
  {
    id: 'drug-018',
    name: 'Thiocolchicoside',
    genericName: 'Thiocolchicoside',
    brand: 'Myoril',
    manufacturer: 'Sanofi',
    category: 'Muscle Relaxant',
    forms: ['Tablet', 'Capsule'],
    strengths: ['4mg', '8mg'],
    schedule: 'H',
    interactsWith: [],
    contraindications: ['Pregnancy', 'Lactation'],
    sideEffects: ['Drowsiness', 'Diarrhea', 'Nausea'],
    isActive: true,
  },
  // Combination drugs
  {
    id: 'drug-019',
    name: 'Flexon MR',
    genericName: 'Ibuprofen + Paracetamol + Chlorzoxazone',
    brand: 'Flexon MR',
    manufacturer: 'Aristo',
    category: 'Analgesic Combination',
    forms: ['Tablet'],
    strengths: ['400mg+325mg+250mg'],
    schedule: 'H',
    interactsWith: ['drug-004', 'drug-010'],
    contraindications: ['Peptic ulcer', 'Hepatic impairment'],
    sideEffects: ['GI upset', 'Drowsiness', 'Dizziness'],
    isActive: true,
  },
  {
    id: 'drug-020',
    name: 'Telma-AM',
    genericName: 'Telmisartan + Amlodipine',
    brand: 'Telma-AM',
    manufacturer: 'Glenmark',
    category: 'Antihypertensive Combination',
    forms: ['Tablet'],
    strengths: ['40mg+5mg', '80mg+5mg'],
    schedule: 'H',
    interactsWith: ['drug-015'],
    contraindications: ['Pregnancy', 'Severe hypotension'],
    sideEffects: ['Edema', 'Dizziness', 'Headache'],
    isActive: true,
  },
];

// Drug interactions for demo alerts
export const mockDrugInteractions: DrugInteraction[] = [
  {
    drug1Id: 'drug-003', // Amlodipine
    drug2Id: 'drug-006', // Atorvastatin
    severity: 'moderate',
    description:
      'Amlodipine may increase atorvastatin levels. Monitor for muscle pain and consider lower statin dose.',
  },
  {
    drug1Id: 'drug-009', // Ibuprofen
    drug2Id: 'drug-004', // Telmisartan
    severity: 'moderate',
    description:
      'NSAIDs may reduce antihypertensive effect and increase risk of renal impairment. Use with caution.',
  },
  {
    drug1Id: 'drug-010', // Aspirin
    drug2Id: 'drug-009', // Ibuprofen
    severity: 'moderate',
    description:
      'Ibuprofen may interfere with antiplatelet effect of aspirin. Take aspirin at least 30 minutes before ibuprofen.',
  },
  {
    drug1Id: 'drug-015', // Omeprazole
    drug2Id: 'drug-016', // Clopidogrel (if we add it)
    severity: 'severe',
    description:
      'Omeprazole significantly reduces clopidogrel effectiveness. Consider pantoprazole as alternative.',
  },
  {
    drug1Id: 'drug-001', // Metformin
    drug2Id: 'drug-020', // Contrast agents (placeholder)
    severity: 'severe',
    description: 'Stop metformin 48 hours before contrast procedures. Risk of lactic acidosis.',
  },
];

// Lab tests
export const mockLabTests: LabTest[] = [
  {
    id: 'lab-001',
    name: 'Complete Blood Count (CBC)',
    code: 'CBC',
    category: 'Hematology',
    price: 350,
    turnaroundTime: '4 hours',
    sampleType: 'Blood (EDTA)',
  },
  {
    id: 'lab-002',
    name: 'Liver Function Test (LFT)',
    code: 'LFT',
    category: 'Biochemistry',
    price: 650,
    turnaroundTime: '6 hours',
    sampleType: 'Blood (Serum)',
  },
  {
    id: 'lab-003',
    name: 'Kidney Function Test (KFT)',
    code: 'KFT',
    category: 'Biochemistry',
    price: 550,
    turnaroundTime: '6 hours',
    sampleType: 'Blood (Serum)',
  },
  {
    id: 'lab-004',
    name: 'Lipid Profile',
    code: 'LIPID',
    category: 'Biochemistry',
    price: 600,
    turnaroundTime: '6 hours',
    sampleType: 'Blood (Serum)',
    instructions: 'Fasting 12 hours required',
  },
  {
    id: 'lab-005',
    name: 'Thyroid Profile (T3, T4, TSH)',
    code: 'TFT',
    category: 'Endocrinology',
    price: 750,
    turnaroundTime: '24 hours',
    sampleType: 'Blood (Serum)',
  },
  {
    id: 'lab-006',
    name: 'HbA1c',
    code: 'HBA1C',
    category: 'Diabetes',
    price: 450,
    turnaroundTime: '24 hours',
    sampleType: 'Blood (EDTA)',
  },
  {
    id: 'lab-007',
    name: 'Fasting Blood Sugar',
    code: 'FBS',
    category: 'Diabetes',
    price: 80,
    turnaroundTime: '2 hours',
    sampleType: 'Blood (Fluoride)',
    instructions: 'Fasting 8-10 hours required',
  },
  {
    id: 'lab-008',
    name: 'Post Prandial Blood Sugar',
    code: 'PPBS',
    category: 'Diabetes',
    price: 80,
    turnaroundTime: '2 hours',
    sampleType: 'Blood (Fluoride)',
    instructions: '2 hours after meal',
  },
  {
    id: 'lab-009',
    name: 'Urine Routine',
    code: 'URINE-R',
    category: 'Urinalysis',
    price: 150,
    turnaroundTime: '2 hours',
    sampleType: 'Urine (Mid-stream)',
  },
  {
    id: 'lab-010',
    name: 'Chest X-Ray',
    code: 'CXR',
    category: 'Radiology',
    price: 400,
    turnaroundTime: '1 hour',
    sampleType: 'N/A',
  },
  {
    id: 'lab-011',
    name: 'ECG',
    code: 'ECG',
    category: 'Cardiology',
    price: 250,
    turnaroundTime: '30 minutes',
    sampleType: 'N/A',
  },
  {
    id: 'lab-012',
    name: 'Vitamin D',
    code: 'VITD',
    category: 'Biochemistry',
    price: 1200,
    turnaroundTime: '24 hours',
    sampleType: 'Blood (Serum)',
  },
  {
    id: 'lab-013',
    name: 'Vitamin B12',
    code: 'VITB12',
    category: 'Biochemistry',
    price: 800,
    turnaroundTime: '24 hours',
    sampleType: 'Blood (Serum)',
  },
  {
    id: 'lab-014',
    name: 'Iron Studies',
    code: 'IRON',
    category: 'Hematology',
    price: 900,
    turnaroundTime: '24 hours',
    sampleType: 'Blood (Serum)',
  },
  {
    id: 'lab-015',
    name: 'CRP (C-Reactive Protein)',
    code: 'CRP',
    category: 'Immunology',
    price: 500,
    turnaroundTime: '6 hours',
    sampleType: 'Blood (Serum)',
  },
];

// Common ICD-10 codes
export const mockICD10Codes: ICD10Code[] = [
  {
    code: 'J06.9',
    description: 'Acute upper respiratory infection, unspecified',
    category: 'Respiratory',
  },
  { code: 'J00', description: 'Acute nasopharyngitis (common cold)', category: 'Respiratory' },
  { code: 'J02.9', description: 'Acute pharyngitis, unspecified', category: 'Respiratory' },
  { code: 'J03.9', description: 'Acute tonsillitis, unspecified', category: 'Respiratory' },
  { code: 'J18.9', description: 'Pneumonia, unspecified organism', category: 'Respiratory' },
  {
    code: 'E11.9',
    description: 'Type 2 diabetes mellitus without complications',
    category: 'Endocrine',
  },
  {
    code: 'E11.65',
    description: 'Type 2 diabetes mellitus with hyperglycemia',
    category: 'Endocrine',
  },
  { code: 'I10', description: 'Essential (primary) hypertension', category: 'Cardiovascular' },
  { code: 'I25.10', description: 'Atherosclerotic heart disease', category: 'Cardiovascular' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified', category: 'Metabolic' },
  {
    code: 'K21.0',
    description: 'Gastro-esophageal reflux disease with esophagitis',
    category: 'GI',
  },
  { code: 'K29.7', description: 'Gastritis, unspecified', category: 'GI' },
  { code: 'M54.5', description: 'Low back pain', category: 'Musculoskeletal' },
  { code: 'M25.50', description: 'Pain in unspecified joint', category: 'Musculoskeletal' },
  { code: 'G43.909', description: 'Migraine, unspecified', category: 'Neurological' },
  { code: 'R51', description: 'Headache', category: 'Symptoms' },
  { code: 'R50.9', description: 'Fever, unspecified', category: 'Symptoms' },
  { code: 'R05', description: 'Cough', category: 'Symptoms' },
  { code: 'L30.9', description: 'Dermatitis, unspecified', category: 'Dermatology' },
  {
    code: 'Z34.00',
    description: 'Encounter for supervision of normal first pregnancy',
    category: 'Pregnancy',
  },
];

// Helper functions
export function searchDrugs(query: string): Drug[] {
  const lowerQuery = query.toLowerCase();
  return mockDrugs.filter(
    (d) =>
      d.name.toLowerCase().includes(lowerQuery) ||
      d.genericName.toLowerCase().includes(lowerQuery) ||
      d.brand.toLowerCase().includes(lowerQuery)
  );
}

export function getDrugById(drugId: string): Drug | undefined {
  return mockDrugs.find((d) => d.id === drugId);
}

export function checkDrugInteractions(drugIds: string[]): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];

  for (let i = 0; i < drugIds.length; i++) {
    for (let j = i + 1; j < drugIds.length; j++) {
      const interaction = mockDrugInteractions.find(
        (int) =>
          (int.drug1Id === drugIds[i] && int.drug2Id === drugIds[j]) ||
          (int.drug1Id === drugIds[j] && int.drug2Id === drugIds[i])
      );
      if (interaction) {
        interactions.push(interaction);
      }
    }
  }

  return interactions;
}

export function searchLabTests(query: string): LabTest[] {
  const lowerQuery = query.toLowerCase();
  return mockLabTests.filter(
    (t) => t.name.toLowerCase().includes(lowerQuery) || t.code.toLowerCase().includes(lowerQuery)
  );
}

export function searchICD10(query: string): ICD10Code[] {
  const lowerQuery = query.toLowerCase();
  return mockICD10Codes.filter(
    (c) =>
      c.code.toLowerCase().includes(lowerQuery) || c.description.toLowerCase().includes(lowerQuery)
  );
}

export function getCommonDiagnoses(): ICD10Code[] {
  return mockICD10Codes.slice(0, 10);
}

export function getCommonLabTests(): LabTest[] {
  return mockLabTests.filter((t) =>
    ['CBC', 'LFT', 'KFT', 'LIPID', 'TFT', 'HBA1C'].includes(t.code)
  );
}
