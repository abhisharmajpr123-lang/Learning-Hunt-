// CBSE curriculum, academic session 2025-26, Classes IX-XII.
// Chapter lists follow the CBSE curriculum documents published at
// https://cbseacademic.nic.in/curriculum_2026.html and cover the chapters that
// CBSE assesses in the 2025-26 session (project-only and periodic-assessment
// chapters are left out).
const SOURCE = 'https://cbseacademic.nic.in/curriculum_2026.html';

const u = (title, chapters) => ({ title, chapters });

const MATHEMATICS = {
  name: 'Mathematics',
  category: 'Mathematics',
  9: [
    u('Unit I · Number Systems', ['Real Numbers']),
    u('Unit II · Algebra', ['Polynomials', 'Linear Equations in Two Variables']),
    u('Unit III · Coordinate Geometry', ['Coordinate Geometry']),
    u('Unit IV · Geometry', [
      'Introduction to Euclid’s Geometry',
      'Lines and Angles',
      'Triangles',
      'Quadrilaterals',
      'Circles'
    ]),
    u('Unit V · Mensuration', ['Areas — Heron’s Formula', 'Surface Areas and Volumes']),
    u('Unit VI · Statistics', ['Statistics'])
  ],
  10: [
    u('Unit I · Number Systems', ['Real Numbers']),
    u('Unit II · Algebra', [
      'Polynomials',
      'Pair of Linear Equations in Two Variables',
      'Quadratic Equations',
      'Arithmetic Progressions'
    ]),
    u('Unit III · Coordinate Geometry', ['Coordinate Geometry']),
    u('Unit IV · Geometry', ['Triangles', 'Circles']),
    u('Unit V · Trigonometry', ['Introduction to Trigonometry', 'Some Applications of Trigonometry']),
    u('Unit VI · Mensuration', ['Areas Related to Circles', 'Surface Areas and Volumes']),
    u('Unit VII · Statistics and Probability', ['Statistics', 'Probability'])
  ],
  11: [
    u('Unit I · Sets and Functions', ['Sets', 'Relations and Functions', 'Trigonometric Functions']),
    u('Unit II · Algebra', [
      'Complex Numbers and Quadratic Equations',
      'Linear Inequalities',
      'Permutations and Combinations',
      'Binomial Theorem',
      'Sequence and Series'
    ]),
    u('Unit III · Coordinate Geometry', [
      'Straight Lines',
      'Conic Sections',
      'Introduction to Three-dimensional Geometry'
    ]),
    u('Unit IV · Calculus', ['Limits and Derivatives']),
    u('Unit V · Statistics and Probability', ['Statistics', 'Probability'])
  ],
  12: [
    u('Unit I · Relations and Functions', ['Relations and Functions', 'Inverse Trigonometric Functions']),
    u('Unit II · Algebra', ['Matrices', 'Determinants']),
    u('Unit III · Calculus', [
      'Continuity and Differentiability',
      'Applications of Derivatives',
      'Integrals',
      'Application of the Integrals',
      'Differential Equations'
    ]),
    u('Unit IV · Vectors and Three-dimensional Geometry', ['Vectors', 'Three-dimensional Geometry']),
    u('Unit V · Linear Programming', ['Linear Programming']),
    u('Unit VI · Probability', ['Probability'])
  ]
};

const SCIENCE = {
  name: 'Science',
  category: 'Science',
  9: [
    u('Unit I · Matter — Its Nature and Behaviour', [
      'Matter in Our Surroundings',
      'Is Matter Around Us Pure?',
      'Atoms and Molecules',
      'Structure of the Atom'
    ]),
    u('Unit II · Organisation in the Living World', ['The Fundamental Unit of Life', 'Tissues']),
    u('Unit III · Motion, Force and Work', [
      'Motion',
      'Force and Laws of Motion',
      'Gravitation',
      'Work and Energy',
      'Sound'
    ]),
    u('Unit IV · Food; Food Production', ['Improvement in Food Resources'])
  ],
  10: [
    u('Unit I · Chemical Substances — Nature and Behaviour', [
      'Chemical Reactions and Equations',
      'Acids, Bases and Salts',
      'Metals and Non-metals',
      'Carbon and its Compounds'
    ]),
    u('Unit II · World of Living', [
      'Life Processes',
      'Control and Coordination',
      'How do Organisms Reproduce?',
      'Heredity'
    ]),
    u('Unit III · Natural Phenomena', ['Light — Reflection and Refraction', 'The Human Eye and the Colourful World']),
    u('Unit IV · Effects of Current', ['Electricity', 'Magnetic Effects of Electric Current']),
    u('Unit V · Natural Resources', ['Our Environment'])
  ]
};

const SOCIAL_SCIENCE = {
  name: 'Social Science',
  category: 'Humanities',
  9: [
    u('History · India and the Contemporary World I', [
      'The French Revolution',
      'Socialism in Europe and the Russian Revolution',
      'Nazism and the Rise of Hitler'
    ]),
    u('Geography · Contemporary India I', [
      'India — Size and Location',
      'Physical Features of India',
      'Drainage',
      'Climate',
      'Population'
    ]),
    u('Political Science · Democratic Politics I', [
      'What is Democracy? Why Democracy?',
      'Constitutional Design',
      'Electoral Politics',
      'Working of Institutions',
      'Democratic Rights'
    ]),
    u('Economics', ['People as Resource', 'Poverty as a Challenge', 'Food Security in India'])
  ],
  10: [
    u('History · India and the Contemporary World II', [
      'The Rise of Nationalism in Europe',
      'Nationalism in India',
      'The Making of a Global World',
      'Print Culture and the Modern World'
    ]),
    u('Geography · Contemporary India II', [
      'Resources and Development',
      'Forest and Wildlife Resources',
      'Water Resources',
      'Agriculture',
      'Minerals and Energy Resources',
      'Manufacturing Industries'
    ]),
    u('Political Science · Democratic Politics II', [
      'Power-sharing',
      'Federalism',
      'Gender, Religion and Caste',
      'Political Parties',
      'Outcomes of Democracy'
    ]),
    u('Economics · Understanding Economic Development', [
      'Development',
      'Sectors of the Indian Economy',
      'Money and Credit',
      'Globalisation and the Indian Economy'
    ])
  ]
};

const ENGLISH = {
  name: 'English',
  category: 'Languages',
  9: [
    u('Beehive · Prose', [
      'The Fun They Had',
      'The Sound of Music',
      'The Little Girl',
      'A Truly Beautiful Mind',
      'The Snake and the Mirror',
      'My Childhood',
      'Reach for the Top',
      'Kathmandu',
      'If I were You'
    ]),
    u('Beehive · Poems', [
      'The Road Not Taken',
      'Wind',
      'Rain on the Roof',
      'The Lake Isle of Innisfree',
      'A Legend of the Northland',
      'No Men are Foreign',
      'On Killing a Tree',
      'A Slumber Did My Spirit Seal'
    ]),
    u('Moments · Supplementary Reader', [
      'The Lost Child',
      'The Adventures of Toto',
      'Iswaran the Storyteller',
      'In the Kingdom of Fools',
      'The Happy Prince',
      'The Last Leaf',
      'A House is not a Home',
      'The Beggar'
    ])
  ],
  10: [
    u('First Flight · Prose', [
      'A Letter to God',
      'Nelson Mandela — Long Walk to Freedom',
      'Stories about Flying',
      'From the Diary of Anne Frank',
      'Glimpses of India',
      'Mijbil the Otter',
      'Madam Rides the Bus',
      'The Sermon at Benares',
      'The Proposal'
    ]),
    u('First Flight · Poems', [
      'Dust of Snow',
      'Fire and Ice',
      'A Tiger in the Zoo',
      'How to Tell Wild Animals',
      'The Ball Poem',
      'Amanda!',
      'The Trees',
      'Fog',
      'The Tale of Custard the Dragon',
      'For Anne Gregory'
    ]),
    u('Footprints Without Feet · Supplementary Reader', [
      'A Triumph of Surgery',
      'The Thief’s Story',
      'The Midnight Visitor',
      'A Question of Trust',
      'Footprints Without Feet',
      'The Making of a Scientist',
      'The Necklace',
      'Bholi',
      'The Book that Saved the Earth'
    ])
  ]
};

const PHYSICS = {
  name: 'Physics',
  category: 'Science',
  11: [
    u('Unit I · Physical World and Measurement', ['Units and Measurements']),
    u('Unit II · Kinematics', ['Motion in a Straight Line', 'Motion in a Plane']),
    u('Unit III · Laws of Motion', ['Laws of Motion']),
    u('Unit IV · Work, Energy and Power', ['Work, Energy and Power']),
    u('Unit V · Motion of System of Particles and Rigid Body', ['System of Particles and Rotational Motion']),
    u('Unit VI · Gravitation', ['Gravitation']),
    u('Unit VII · Properties of Bulk Matter', [
      'Mechanical Properties of Solids',
      'Mechanical Properties of Fluids',
      'Thermal Properties of Matter'
    ]),
    u('Unit VIII · Thermodynamics', ['Thermodynamics']),
    u('Unit IX · Behaviour of Perfect Gases and Kinetic Theory', ['Kinetic Theory']),
    u('Unit X · Oscillations and Waves', ['Oscillations', 'Waves'])
  ],
  12: [
    u('Unit I · Electrostatics', ['Electric Charges and Fields', 'Electrostatic Potential and Capacitance']),
    u('Unit II · Current Electricity', ['Current Electricity']),
    u('Unit III · Magnetic Effects of Current and Magnetism', [
      'Moving Charges and Magnetism',
      'Magnetism and Matter'
    ]),
    u('Unit IV · Electromagnetic Induction and Alternating Currents', [
      'Electromagnetic Induction',
      'Alternating Current'
    ]),
    u('Unit V · Electromagnetic Waves', ['Electromagnetic Waves']),
    u('Unit VI · Optics', ['Ray Optics and Optical Instruments', 'Wave Optics']),
    u('Unit VII · Dual Nature of Radiation and Matter', ['Dual Nature of Radiation and Matter']),
    u('Unit VIII · Atoms and Nuclei', ['Atoms', 'Nuclei']),
    u('Unit IX · Electronic Devices', ['Semiconductor Electronics: Materials, Devices and Simple Circuits'])
  ]
};

const CHEMISTRY = {
  name: 'Chemistry',
  category: 'Science',
  11: [
    u('Unit 1 · Some Basic Concepts of Chemistry', ['Some Basic Concepts of Chemistry']),
    u('Unit 2 · Structure of Atom', ['Structure of Atom']),
    u('Unit 3 · Classification of Elements and Periodicity', ['Classification of Elements and Periodicity in Properties']),
    u('Unit 4 · Chemical Bonding and Molecular Structure', ['Chemical Bonding and Molecular Structure']),
    u('Unit 5 · Chemical Thermodynamics', ['Chemical Thermodynamics']),
    u('Unit 6 · Equilibrium', ['Equilibrium']),
    u('Unit 7 · Redox Reactions', ['Redox Reactions']),
    u('Unit 8 · Organic Chemistry — Some Basic Principles and Techniques', [
      'Organic Chemistry — Some Basic Principles and Techniques'
    ]),
    u('Unit 9 · Hydrocarbons', ['Hydrocarbons'])
  ],
  12: [
    u('Unit 1 · Solutions', ['Solutions']),
    u('Unit 2 · Electrochemistry', ['Electrochemistry']),
    u('Unit 3 · Chemical Kinetics', ['Chemical Kinetics']),
    u('Unit 4 · d and f Block Elements', ['d and f Block Elements']),
    u('Unit 5 · Coordination Compounds', ['Coordination Compounds']),
    u('Unit 6 · Haloalkanes and Haloarenes', ['Haloalkanes and Haloarenes']),
    u('Unit 7 · Alcohols, Phenols and Ethers', ['Alcohols, Phenols and Ethers']),
    u('Unit 8 · Aldehydes, Ketones and Carboxylic Acids', ['Aldehydes, Ketones and Carboxylic Acids']),
    u('Unit 9 · Amines', ['Amines']),
    u('Unit 10 · Biomolecules', ['Biomolecules'])
  ]
};

const BIOLOGY = {
  name: 'Biology',
  category: 'Science',
  11: [
    u('Unit I · Diversity of Living Organisms', [
      'The Living World',
      'Biological Classification',
      'Plant Kingdom',
      'Animal Kingdom'
    ]),
    u('Unit II · Structural Organisation in Plants and Animals', [
      'Morphology of Flowering Plants',
      'Anatomy of Flowering Plants',
      'Structural Organisation in Animals'
    ]),
    u('Unit III · Cell — Structure and Function', [
      'Cell — The Unit of Life',
      'Biomolecules',
      'Cell Cycle and Cell Division'
    ]),
    u('Unit IV · Plant Physiology', [
      'Photosynthesis in Higher Plants',
      'Respiration in Plants',
      'Plant — Growth and Development'
    ]),
    u('Unit V · Human Physiology', [
      'Breathing and Exchange of Gases',
      'Body Fluids and Circulation',
      'Excretory Products and their Elimination',
      'Locomotion and Movement',
      'Neural Control and Coordination',
      'Chemical Coordination and Integration'
    ])
  ],
  12: [
    u('Unit VI · Reproduction', [
      'Sexual Reproduction in Flowering Plants',
      'Human Reproduction',
      'Reproductive Health'
    ]),
    u('Unit VII · Genetics and Evolution', [
      'Principles of Inheritance and Variation',
      'Molecular Basis of Inheritance',
      'Evolution'
    ]),
    u('Unit VIII · Biology and Human Welfare', ['Human Health and Diseases', 'Microbes in Human Welfare']),
    u('Unit IX · Biotechnology and its Applications', [
      'Biotechnology — Principles and Processes',
      'Biotechnology and its Applications'
    ]),
    u('Unit X · Ecology and Environment', [
      'Organisms and Populations',
      'Ecosystem',
      'Biodiversity and its Conservation'
    ])
  ]
};

const BUSINESS_STUDIES = {
  name: 'Business Studies',
  category: 'Commerce',
  11: [
    u('Unit I · Nature and Purpose of Business', [
      'Concept and Characteristics of Business',
      'Objectives of Business',
      'Classification of Business Activities',
      'Business Risk'
    ]),
    u('Unit II · Forms of Business Organisations', [
      'Sole Proprietorship',
      'Partnership',
      'Joint Hindu Family Business',
      'Cooperative Societies',
      'Joint Stock Company',
      'Choice of Form of Business Organisation'
    ]),
    u('Unit III · Public, Private and Global Enterprises', [
      'Private Sector and Public Sector',
      'Forms of Public Sector Enterprises',
      'Global Enterprises and Joint Ventures',
      'Public Private Partnership'
    ]),
    u('Unit IV · Business Services', [
      'Nature of Services',
      'Banking',
      'Insurance',
      'Transportation',
      'Warehousing',
      'Communication'
    ]),
    u('Unit V · Emerging Modes of Business', [
      'E-business',
      'Business Process Outsourcing',
      'Digital Payments'
    ]),
    u('Unit VI · Social Responsibility of Business and Business Ethics', [
      'Concept of Social Responsibility',
      'Responsibility towards Different Interest Groups',
      'Business and Environmental Protection',
      'Business Ethics'
    ]),
    u('Unit VII · Sources of Business Finance', [
      'Nature and Significance of Business Finance',
      'Classification of Sources of Funds',
      'Equity and Preference Shares',
      'Debentures and Bonds',
      'Loans from Banks and Financial Institutions',
      'Retained Earnings and Trade Credit'
    ]),
    u('Unit VIII · Small Business and Entrepreneurship', [
      'Meaning and Role of Small Business',
      'MSME Classification',
      'Government Schemes for Small Business',
      'Business Entrepreneurship'
    ]),
    u('Unit IX · Internal Trade', [
      'Meaning and Types of Internal Trade',
      'Wholesale Trade',
      'Retail Trade',
      'Goods and Services Tax'
    ]),
    u('Unit X · International Trade', [
      'Meaning and Scope of International Trade',
      'Export and Import Procedures',
      'Documents Used in Foreign Trade',
      'World Trade Organisation'
    ])
  ],
  12: [
    u('Unit I · Nature and Significance of Management', [
      'Management — Concept and Objectives',
      'Characteristics of Management',
      'Management as Science, Art and Profession',
      'Levels of Management',
      'Functions of Management',
      'Coordination'
    ]),
    u('Unit II · Principles of Management', [
      'Taylor’s Scientific Management',
      'Fayol’s Principles of Management',
      'Techniques of Scientific Management'
    ]),
    u('Unit III · Business Environment', [
      'Meaning and Dimensions of Business Environment',
      'Economic Environment in India',
      'Liberalisation, Privatisation and Globalisation',
      'Demonetisation and its Impact'
    ]),
    u('Unit IV · Planning', [
      'Meaning and Features of Planning',
      'Importance and Limitations of Planning',
      'Planning Process',
      'Types of Plans'
    ]),
    u('Unit V · Organising', [
      'Meaning and Importance of Organising',
      'Organisation Structure',
      'Delegation and Decentralisation',
      'Formal and Informal Organisation'
    ]),
    u('Unit VI · Staffing', [
      'Meaning and Need for Staffing',
      'Recruitment',
      'Selection',
      'Training and Development'
    ]),
    u('Unit VII · Directing', [
      'Meaning and Features of Directing',
      'Supervision',
      'Motivation',
      'Leadership',
      'Communication'
    ]),
    u('Unit VIII · Controlling', [
      'Meaning and Process of Controlling',
      'Relationship between Planning and Controlling',
      'Techniques of Managerial Control'
    ]),
    u('Unit IX · Financial Management', [
      'Meaning and Objectives of Financial Management',
      'Financial Decisions',
      'Capital Structure',
      'Fixed and Working Capital'
    ]),
    u('Unit X · Financial Markets', ['Money Market', 'Capital Market', 'Stock Exchange', 'SEBI']),
    u('Unit XI · Marketing Management', [
      'Meaning and Functions of Marketing',
      'Marketing Mix',
      'Product — Branding, Labelling and Packaging',
      'Price, Place and Promotion',
      'Physical Distribution'
    ]),
    u('Unit XII · Consumer Protection', [
      'Consumer Protection Act 2019',
      'Consumer Rights and Responsibilities',
      'Redressal Machinery',
      'Role of Consumer Organisations and NGOs'
    ])
  ]
};

const SUBJECTS = {
  mathematics: MATHEMATICS,
  science: SCIENCE,
  'social-science': SOCIAL_SCIENCE,
  english: ENGLISH,
  physics: PHYSICS,
  chemistry: CHEMISTRY,
  biology: BIOLOGY,
  'business-studies': BUSINESS_STUDIES
};

const TRACKS = [
  {
    id: 'class-9',
    label: 'Class 9',
    kind: 'class',
    note: 'CBSE secondary curriculum',
    grades: [9],
    subjects: ['mathematics', 'science', 'social-science', 'english']
  },
  {
    id: 'class-10',
    label: 'Class 10',
    kind: 'class',
    note: 'CBSE secondary curriculum',
    grades: [10],
    subjects: ['mathematics', 'science', 'social-science', 'english']
  },
  {
    id: 'class-11',
    label: 'Class 11',
    kind: 'class',
    note: 'CBSE senior secondary curriculum',
    grades: [11],
    subjects: ['physics', 'chemistry', 'mathematics', 'biology', 'business-studies']
  },
  {
    id: 'class-12',
    label: 'Class 12',
    kind: 'class',
    note: 'CBSE senior secondary curriculum',
    grades: [12],
    subjects: ['physics', 'chemistry', 'mathematics', 'biology', 'business-studies']
  },
  {
    id: 'jee',
    label: 'JEE',
    kind: 'exam',
    note: 'Engineering entrance · Class 11-12 Physics, Chemistry, Mathematics',
    grades: [11, 12],
    subjects: ['physics', 'chemistry', 'mathematics']
  },
  {
    id: 'neet',
    label: 'NEET',
    kind: 'exam',
    note: 'Medical entrance · Class 11-12 Physics, Chemistry, Biology',
    grades: [11, 12],
    subjects: ['physics', 'chemistry', 'biology']
  }
];

function unitsFor(track, subjectId) {
  const definition = SUBJECTS[subjectId];
  return track.grades.flatMap(grade =>
    (definition[grade] || []).map(unit =>
      track.grades.length > 1 ? { ...unit, title: `Class ${grade} · ${unit.title}` } : unit
    )
  );
}

function chapterCount(units) {
  return units.reduce((sum, unit) => sum + unit.chapters.length, 0);
}

function findTrack(trackId) {
  return TRACKS.find(track => track.id === trackId) || null;
}

export function listTracks() {
  return TRACKS.map(track => ({
    id: track.id,
    label: track.label,
    kind: track.kind,
    note: track.note,
    subjectCount: track.subjects.length,
    chapterCount: chapterCount(track.subjects.flatMap(id => unitsFor(track, id))),
    // Names let the client tell which catalogue subjects have a CBSE syllabus.
    subjects: track.subjects.map(id => SUBJECTS[id].name)
  }));
}

export function getTrack(trackId) {
  const track = findTrack(trackId);
  if (!track) return null;
  return {
    id: track.id,
    label: track.label,
    kind: track.kind,
    note: track.note,
    subjects: track.subjects.map(id => {
      const definition = SUBJECTS[id];
      const units = unitsFor(track, id);
      return {
        id,
        name: definition.name,
        category: definition.category,
        unitCount: units.length,
        chapterCount: chapterCount(units)
      };
    })
  };
}

export function getSyllabus(trackId, subjectId) {
  const track = findTrack(trackId);
  if (!track || !track.subjects.includes(subjectId)) return null;
  const definition = SUBJECTS[subjectId];
  return {
    track: { id: track.id, label: track.label, kind: track.kind },
    subject: { id: subjectId, name: definition.name, category: definition.category },
    units: unitsFor(track, subjectId),
    source: SOURCE
  };
}

export function trackLabel(trackId) {
  return findTrack(trackId)?.label || trackId;
}

export { SOURCE };
