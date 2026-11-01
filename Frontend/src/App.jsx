import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  BookOpen, Brain, CheckCircle2, RefreshCw, Award, Flame, Volume2, Globe, Users, 
  Zap, Sparkles, Layers, HelpCircle, ChevronRight, Search, Copy, Check, Wifi, WifiOff, 
  UserCheck, FileText, ArrowRight, Edit3, Lightbulb, GraduationCap, Database, 
  Play, Pause, Printer, X, TrendingUp, AlertTriangle, Key, UserPlus, Lock, User, LogOut,
  ShieldCheck, Clock, Star, Gift, Heart, ThumbsUp, Medal, Coins, Trophy, Activity, 
  Maximize, EyeOff, ArrowLeft, Sun, Moon, Info
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore';

// --- SAFE FIREBASE INITIALIZATION ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'sutraai-adaptive-app';
let firebaseApp = null;
let auth = null;
let db = null;

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    const firebaseConfig = JSON.parse(__firebase_config);
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
  }
} catch (err) {
  // Fallback gracefully to in-memory state if Firebase config is not provided
}

// --- DETERMINISTIC HASH GENERATOR (Prevents UI Flickering on Re-renders) ---
const getDeterministicScore = (seed) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % 45) + 52; // Stable score between 52% and 96%
};

// --- SUBJECTS & COMPLETE SYLLABUS (Classes 6 to 10) ---
const SUBJECTS = ['Mathematics', 'Science', 'Social Science', 'Information Technology'];

const SYLLABUS = {
  'Class 6': {
    'Mathematics': ['Knowing Our Numbers', 'Whole Numbers', 'Playing with Numbers'],
    'Science': ['Food: Where Does It Come From', 'Sorting Materials into Groups', 'Changes Around Us', 'Electricity and Circuits'],
    'Social Science': ['Maps', 'The Earth in the Solar System', 'What, Where, How and When', 'What Is Government'],
    'Information Technology': ['Parts of a Computer', 'Input and Output Devices', 'Introduction to Scratch', 'Internet and Safe Browsing']
  },
  'Class 7': {
    'Mathematics': ['Integers', 'Fractions and Decimals', 'Simple Equations'],
    'Science': ['Nutrition in Plants', 'Heat', 'Acids, Bases and Salts', 'Electric Current and Its Effects'],
    'Social Science': ['Environment', 'Inside Our Earth', 'The Delhi Sultans', 'On Equality'],
    'Information Technology': ['Operating System Basics', 'Word Processing', 'Spreadsheet Basics', 'Algorithms and Flowcharts']
  },
  'Class 8': {
    'Mathematics': ['Variables & Constants', 'Linear Equations in 1 Var', 'Balancing Equations', 'Word Problems (Pricing)', 'Graphing Linear Lines'],
    'Science': ['Crop Production and Management', 'Materials: Metals and Non-Metals', 'Force and Pressure', 'Sound'],
    'Social Science': ['Resources', 'The Indian Constitution', 'How, When and Where', 'Understanding Secularism'],
    'Information Technology': ['Networks and the Internet', 'Loops in Scratch', 'Introduction to Python', 'Cyber Safety']
  },
  'Class 9': {
    'Mathematics': ['Number Systems', 'Polynomials', 'Coordinate Geometry'],
    'Science': ['Matter in Our Surroundings', 'Atoms and Molecules', 'Motion', 'Force and Laws of Motion'],
    'Social Science': ['The French Revolution', 'India: Size and Location', 'What Is Democracy? Why Democracy?', 'The Story of Village Palampur'],
    'Information Technology': ['Python Basics and Variables', 'Conditional Statements', 'Loops in Python', 'Lists and Strings']
  },
  'Class 10': {
    'Mathematics': ['Real Numbers', 'Polynomials', 'Pair of Linear Equations'],
    'Science': ['Chemical Reactions and Equations', 'Acids, Bases and Salts', 'Life Processes', 'Light: Reflection and Refraction'],
    'Social Science': ['The Rise of Nationalism in Europe', 'Resources and Development', 'Power Sharing', 'Development'],
    'Information Technology': ['Functions in Python', 'Dictionaries and Data Handling', 'Database Basics', 'Cyber Ethics']
  }
};

// --- SEEDED TEACHERS & 30 DEMO STUDENTS ---
const SEEDED_TEACHERS = [
  { id: 't1', teacher_id: 'T001', name: 'Mrs. Sunitha Sharma', role: 'teacher', class_group: 'Class 8', school: 'Govt High School, Hyd' },
  { id: 't2', teacher_id: 'T002', name: 'Mr. Rajesh Rao', role: 'teacher', class_group: 'Class 9', school: 'Govt High School, Hyd' }
];

const SEEDED_STUDENTS = Array.from({ length: 30 }, (_, index) => {
  const num = (index + 1).toString().padStart(3, '0');
  const names = [
    "Pohit Kumar", "Akella Kausthav", "Dubala Sai Teja", "Ananya Rao", "Rohan Verma", 
    "Priya Patel", "Kavya Sharma", "Aditya Joshi", "Siddharth Nair", "Meera Kulkarni",
    "Vikram Reddy", "Sneha Gupta", "Rahul Deshmukh", "Pooja Hegde", "Arjun Singh",
    "Divya Agarwal", "Harish Kumar", "Deepika Pillai", "Manish Mehta", "Tanvi Bhat",
    "Suresh Babu", "Anushka Chowdary", "Ganesh Gowda", "Lata Rao", "Kiran Varma",
    "Swati Mohan", "Nikhil Raj", "Bhavana Shetty", "Varun Teja", "Sangeeta Roy"
  ];
  
  const masteries = [82, 94, 89, 88, 52, 86, 62, 91, 48, 79, 83, 56, 95, 67, 72, 89, 41, 78, 85, 60, 53, 92, 44, 81, 76, 69, 87, 58, 90, 65];
  const streaks = [5, 14, 9, 9, 2, 8, 4, 11, 0, 7, 9, 2, 15, 5, 6, 10, 1, 6, 8, 4, 2, 12, 1, 7, 5, 4, 9, 3, 11, 5];
  const xps = [1250, 2350, 1980, 1920, 730, 1840, 980, 2100, 620, 1450, 1680, 810, 2450, 1120, 1310, 1980, 510, 1390, 1750, 920, 760, 2210, 590, 1520, 1380, 1150, 1890, 840, 2050, 1270];

  // Explicit assignments: Pohit (STU001) -> Class 6, Akella (STU002) -> Class 8, Dubala (STU003) -> Class 10
  let class_group = 'Class 8';
  if (index === 0) class_group = 'Class 6';
  else if (index === 1) class_group = 'Class 8';
  else if (index === 2) class_group = 'Class 10';
  else {
    const classes = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
    class_group = classes[index % classes.length];
  }

  const mastery = masteries[index];
  let status = 'Active';
  if (mastery >= 85) status = 'Mastered';
  else if (mastery < 60) status = 'Needs Attention';

  // Weekly stats for Star of the Class eligibility (minimum 20 questions answered)
  const isTopContender = index < 8 || mastery >= 80;
  const total_answered = isTopContender ? 22 + (index % 7) : 14 + (index % 5);
  const correct = isTopContender ? Math.min(total_answered, Math.round(total_answered * (mastery / 100))) : Math.round(total_answered * 0.65);
  const avg_time = 11 + (index % 14);

  const parts = names[index].split(' ');
  const display_name = `${parts[0]} ${parts[1] ? parts[1].charAt(0) + '.' : ''}`.trim();

  return {
    id: `st_${num}`,
    roll_no: `STU${num}`,
    name: names[index],
    display_name,
    role: 'student',
    class_group,
    avgMastery: mastery,
    xp: xps[index],
    streak: streaks[index],
    status,
    velocity: mastery > 70 ? '+8% this week' : '-2% this week',
    errorPattern: mastery < 60 ? 'Transposing negative signs across equality' : 'Minor calculation speed under timer pressure',
    weeklyStats: { total_answered, correct, avg_time }
  };
});

// Past Stars History (Reset every Monday)
const PAST_STARS_HISTORY = {
  'Class 6': [
    { week: 'Last Week (Oct 19 – Oct 25)', display_name: 'Vikram R.', accuracy: 91 },
    { week: '2 Weeks Ago (Oct 12 – Oct 18)', display_name: 'Priya P.', accuracy: 89 }
  ],
  'Class 7': [
    { week: 'Last Week (Oct 19 – Oct 25)', display_name: 'Kavya S.', accuracy: 92 },
    { week: '2 Weeks Ago (Oct 12 – Oct 18)', display_name: 'Anushka C.', accuracy: 88 }
  ],
  'Class 8': [
    { week: 'Last Week (Oct 19 – Oct 25)', display_name: 'Rahul D.', accuracy: 95 },
    { week: '2 Weeks Ago (Oct 12 – Oct 18)', display_name: 'Aditya J.', accuracy: 91 }
  ]
};

// --- VERNACULAR MICRO-LESSONS ---
const VERNACULAR_LESSONS = {
  en: {
    title: "Linear Equations & Core Foundations",
    subtitle: "Interactive Vernacular Concept Guide",
    concept: "An equation or scientific principle represents an exact balance between two quantities or states. Understanding the foundational variables allows you to solve complex real-world problems step by step.",
    formula: "ax + b = c  ➔  ax = c - b",
    contextTitle: "Real-World Context: RTC Bus Fare & Rythu Bazar",
    realWorld: "Suppose you take a local RTC bus. The minimum ticket fare is ₹10 plus ₹5 per kilometer traveled. If your total ticket costs ₹35, how many kilometers did you travel?",
    mathSolution: "Equation: 5x + 10 = 35 ➔ 5x = 25 ➔ x = 5 km",
    keyPoints: [
      "The equality (=) sign behaves like a balanced weighing scale.",
      "Whatever operation (+, -, ×, ÷) you do to LHS, you MUST do to RHS.",
      "Break multi-step word problems into known constants and unknown variables."
    ],
    audioTranscript: "Welcome to SutraAI. Today we are learning how balanced equations and logical rules help us solve everyday challenges..."
  },
  hi: {
    title: "एक चर वाले रैखिक समीकरण एवं मूल सिद्धांत",
    subtitle: "इंटरएक्टिव मातृभाषा अवधारणा मार्गदर्शिका",
    concept: "एक चर वाला रैखिक समीकरण एक ऐसा बीजीय समीकरण है जिसमें चर की उच्चतम घात 1 होती है। यह दो राशियों के बीच पूर्ण संतुलन को दर्शाता है।",
    formula: "ax + b = 0  (जहाँ a ≠ 0)",
    contextTitle: "वास्तविक जीवन का उदाहरण: सब्जी मंडी एवं बस किराया",
    realWorld: "मान लीजिए आप स्थानीय बस में यात्रा करते हैं। न्यूनतम किराया ₹10 है और प्रति किलोमीटर ₹5 लगता है। यदि आपका कुल टिकट ₹35 का है, तो आपने कितने किलोमीटर यात्रा की?",
    mathSolution: "समीकरण: 5x + 10 = 35 ➔ 5x = 25 ➔ x = 5 किमी",
    keyPoints: [
      "बराबर (=) का चिन्ह एक संतुलित तराजू की तरह काम करता है।",
      "जो भी प्रक्रिया (जोड़, घटाव, गुणा, भाग) आप बाएँ पक्ष में करते हैं, वही दाएँ पक्ष में भी करनी होगी।",
      "पक्ष बदलने पर चिन्ह बदल जाते हैं (+ बनता है -, गुणा बनता है भाग)।"
    ],
    audioTranscript: "सूत्र AI में आपका स्वागत है। आज हम एक चर वाले रैखिक समीकरण सीख रहे हैं। समीकरण को अपनी स्थानीय किराना दुकान के तराजू की तरह समझें..."
  },
  te: {
    title: "ఒక వేరియబుల్లో సరళ సమీకరణాలు",
    subtitle: "ఇంటరాక్టివ్ ప్రాంతీయ భాషా పాఠం",
    concept: "ఒక వేరియబుల్ కలిగిన సరళ సమీకరణం అనేది చరరాశి యొక్క గరిష్ట ఘాతాంకం 1 గా ఉన్న బీజగణిత సమీకరణం. ఇది రెండు పరిమాణాల మధ్య ఖచ్చితమైన సమతుల్యతను సూచిస్తుంది.",
    formula: "ax + b = 0  (ఇక్కడ a ≠ 0)",
    contextTitle: "నిజ జీవిత ఉదాహరణ: RTC బస్సు ఛార్జీ & రైతు బజార్",
    realWorld: "మీరు స్థానిక ఆర్టీసీ బస్సులో ప్రయాణిస్తున్నారనుకుందాం. కనీస ఛార్జీ ₹10, అలాగే ప్రతీ కిలోమీటరుకు ₹5 అదనం. మొత్తం టికెట్ ధర ₹35 అయితే, మీరు ఎన్ని కిలోమీటర్లు ప్రయాణించారు?",
    mathSolution: "సమీకరణం: 5x + 10 = 35 ➔ 5x = 25 ➔ x = 5 కి.మీ",
    keyPoints: [
      "సమానత్వపు గుర్తు (=) ఒక సమతుల్య తారాజు (తక్కెడ) లాగా పనిచేస్తుంది.",
      "ఎడమ వైపు (LHS) ఏ పరిక్రియ చేస్తే, కుడి వైపు (RHS) కూడా అదే పరిక్రియ చేయాలి.",
      "పదాలను ఒక వైపు నుండి మరొక వైపుకు మార్చినప్పుడు గుర్తులు మారుతాయి (+ అనేది - గా, గుణకారం భాగాహారంగా)."
    ],
    audioTranscript: "సూత్ర AI కి స్వాగతం. ఈ రోజు మనం ఒక వేరియబుల్లోని సరళ సమీకరణాలను నేర్చుకుంటున్నాం. సమీకరణాన్ని రైతు బజార్ తారాజు లాగా ఊహించుకోండి..."
  }
};

// --- SPECIFIC HAND-CRAFTED QUESTIONS FOR DEMO CHAPTERS (No "All of the above") ---
const SPECIFIC_QUESTIONS = {
  'Class 6': {
    'Science': {
      'Food: Where Does It Come From': {
        1: [
          { id: 'c6_s_1_1', level: 1, levelLabel: 'Level 1: Easy (Foundational)', xp: 25, question: "Which of these is a plant source of food?", options: ["Milk", "Eggs", "Rice", "Mutton"], correctIndex: 2, explanation: "Rice is a cereal grain harvested from paddy fields.", hint: "Think about what grows in soil.", prerequisite: "Plant vs Animal Sources" },
          { id: 'c6_s_1_2', level: 1, levelLabel: 'Level 1: Easy (Foundational)', xp: 25, question: "Animals that eat only plants and plant products are called:", options: ["Carnivores", "Herbivores", "Omnivores", "Scavengers"], correctIndex: 1, explanation: "Herbivores feed exclusively on plant material.", hint: "The root word 'herb' means plant.", prerequisite: "Animal Diets" }
        ],
        2: [
          { id: 'c6_s_2_1', level: 2, levelLabel: 'Level 2: Medium (Standard)', xp: 50, question: "Which two parts of the mustard plant are commonly consumed as food?", options: ["Root and stem", "Seeds and leaves", "Flowers and bark", "Stem and thorns"], correctIndex: 1, explanation: "Mustard seeds are pressed for oil and leaves are cooked as greens.", hint: "Think of mustard oil and sarson ka saag.", prerequisite: "Edible Plant Parts" },
          { id: 'c6_s_2_2', level: 2, levelLabel: 'Level 2: Medium (Standard)', xp: 50, question: "Honeybees collect _____ from flowers and convert it into honey.", options: ["Pollen dust", "Sweet nectar", "Tree sap", "Morning dew"], correctIndex: 1, explanation: "Bees gather sweet liquid nectar from blossoms to store in hives.", hint: "It is the sweet juice inside flowers.", prerequisite: "Animal Products" }
        ],
        3: [
          { id: 'c6_s_3_1', level: 3, levelLabel: 'Level 3: Hard (Advanced)', xp: 100, question: "Why does sprouting increase the nutritional value of moong or chana seeds?", options: ["It adds artificial minerals", "It activates enzymes and synthesizes vitamins", "It removes all dietary fiber", "It dehydrates the seed coat"], correctIndex: 1, explanation: "Germination synthesizes Vitamin C and B-complex while breaking down complex proteins.", hint: "Sprouting wakes the dormant seed.", prerequisite: "Seed Germination" },
          { id: 'c6_s_3_2', level: 3, levelLabel: 'Level 3: Hard (Advanced)', xp: 100, question: "Identify the correct flow of energy in a terrestrial food chain:", options: ["Deer → Grass → Tiger", "Grass → Deer → Tiger", "Tiger → Deer → Grass", "Grass → Tiger → Deer"], correctIndex: 1, explanation: "Energy flows from producers (grass) to herbivores (deer) to carnivores (tiger).", hint: "Start with the producer that uses sunlight.", prerequisite: "Food Chains" }
        ]
      }
    },
    'Mathematics': {
      'Knowing Our Numbers': {
        1: [
          { id: 'c6_m_1_1', level: 1, levelLabel: 'Level 1: Easy (Foundational)', xp: 25, question: "What is the greatest 4-digit number formed using the digits 3, 8, 1, 5 without repetition?", options: ["8531", "8351", "5831", "8513"], correctIndex: 0, explanation: "Arrange the given digits in descending order: 8, 5, 3, 1.", hint: "Place the largest digit at the thousands place.", prerequisite: "Comparing Numbers" },
          { id: 'c6_m_1_2', level: 1, levelLabel: 'Level 1: Easy (Foundational)', xp: 25, question: "Which is the smallest 3-digit number that does not change when its digits are reversed?", options: ["101", "111", "100", "121"], correctIndex: 0, explanation: "101 is the smallest 3-digit palindrome.", hint: "Check numbers starting from 100 upwards.", prerequisite: "Place Value" }
        ],
        2: [
          { id: 'c6_m_2_1', level: 2, levelLabel: 'Level 2: Medium (Standard)', xp: 50, question: "How many thousands make one lakh in the Indian System of Numeration?", options: ["10", "100", "1000", "50"], correctIndex: 1, explanation: "1,00,000 divided by 1,000 equals 100.", hint: "Compare the zeroes in 1,00,000 and 1,000.", prerequisite: "Indian Numeration System" },
          { id: 'c6_m_2_2', level: 2, levelLabel: 'Level 2: Medium (Standard)', xp: 50, question: "What is the place value difference between the two 7s in the number 72,475?", options: ["69,930", "70,000", "69,300", "69,993"], correctIndex: 0, explanation: "70,000 minus 70 equals 69,930.", hint: "Subtract 70 from 70,000.", prerequisite: "Place Value Operations" }
        ],
        3: [
          { id: 'c6_m_3_1', level: 3, levelLabel: 'Level 3: Hard (Advanced)', xp: 100, question: "A merchant had ₹78,592 and ordered 40 radio sets at ₹1,200 each. How much money remains?", options: ["₹30,592", "₹28,592", "₹32,400", "₹48,000"], correctIndex: 0, explanation: "Total cost = 40 × 1200 = ₹48,000. Remaining = 78,592 - 48,000 = ₹30,592.", hint: "Multiply 40 by 1200 first, then subtract.", prerequisite: "Large Number Word Problems" },
          { id: 'c6_m_3_2', level: 3, levelLabel: 'Level 3: Hard (Advanced)', xp: 100, question: "Medicine is packed in boxes, each weighing 4 kg 500 g. How many such boxes can be loaded in a van with an 800 kg limit?", options: ["177", "180", "175", "160"], correctIndex: 0, explanation: "800,000g ÷ 4,500g = 177.77, so a maximum of 177 full boxes can be loaded.", hint: "Convert weights to grams and divide 800,000 by 4,500.", prerequisite: "Unit Conversion & Division" }
        ]
      }
    }
  },
  'Class 8': {
    'Mathematics': {
      'Linear Equations in 1 Var': {
        1: [
          { id: 'c8_m_1_1', level: 1, levelLabel: 'Level 1: Easy (Foundational)', xp: 25, question: "Solve for x in the simple equation: x + 8 = 19", options: ["x = 9", "x = 11", "x = 27", "x = 12"], correctIndex: 1, explanation: "Subtract 8 from both sides: x = 19 - 8 = 11.", hint: "To isolate x, subtract 8 from 19.", prerequisite: "Basic Inverse Subtraction" },
          { id: 'c8_m_1_2', level: 1, levelLabel: 'Level 1: Easy (Foundational)', xp: 25, question: "Solve for y: 4y = 36", options: ["y = 9", "y = 8", "y = 32", "y = 14"], correctIndex: 0, explanation: "Divide both sides by 4: y = 36 / 4 = 9.", hint: "4 multiplied by what number equals 36?", prerequisite: "Single-step Division" }
        ],
        2: [
          { id: 'c8_m_2_1', level: 2, levelLabel: 'Level 2: Medium (Standard)', xp: 50, question: "Pohit bought 3 identical notebooks and a ₹20 pen. The total bill was ₹140. What is the price of 1 notebook?", options: ["₹35", "₹40", "₹45", "₹50"], correctIndex: 1, explanation: "Form equation: 3x + 20 = 140 ➔ 3x = 120 ➔ x = ₹40.", hint: "Subtract the pen price (₹20) from ₹140, then divide by 3.", prerequisite: "Translating Word Problems" },
          { id: 'c8_m_2_2', level: 2, levelLabel: 'Level 2: Medium (Standard)', xp: 50, question: "Solve for m: 5m - 12 = 2m + 9", options: ["m = 5", "m = 7", "m = 6", "m = 8"], correctIndex: 1, explanation: "Rearrange terms: 5m - 2m = 9 + 12 ➔ 3m = 21 ➔ m = 7.", hint: "Bring variable terms (m) to the left and numbers to the right.", prerequisite: "Combining Like Terms across Equality" }
        ],
        3: [
          { id: 'c8_m_3_1', level: 3, levelLabel: 'Level 3: Hard (Advanced)', xp: 100, question: "Solve for z: (3z - 2) / 4 - (z - 3) / 2 = 2", options: ["z = 4", "z = 6", "z = 8", "z = 5"], correctIndex: 0, explanation: "Multiply whole equation by LCM 4: (3z - 2) - 2(z - 3) = 8 ➔ z + 4 = 8 ➔ z = 4.", hint: "Multiply all terms by the LCM of denominators (4).", prerequisite: "Fractional Linear Equations" },
          { id: 'c8_m_3_2', level: 3, levelLabel: 'Level 3: Hard (Advanced)', xp: 100, question: "The sum of two consecutive multiples of 5 is 55. Find the smaller multiple.", options: ["20", "25", "30", "15"], correctIndex: 1, explanation: "Let multiples be x and x + 5. Then 2x + 5 = 55 ➔ 2x = 50 ➔ x = 25.", hint: "Write the two multiples as x and x + 5.", prerequisite: "Algebraic Word Modeling" }
        ]
      }
    },
    'Information Technology': {
      'Introduction to Python': {
        1: [
          { id: 'c8_it_1_1', level: 1, levelLabel: 'Level 1: Easy (Foundational)', xp: 25, question: "Which built-in function displays output on the screen in Python?", options: ["echo()", "print()", "write()", "display()"], correctIndex: 1, explanation: "The built-in print() function outputs text or variables to the console.", hint: "Think of standard printing.", prerequisite: "Python Input/Output" },
          { id: 'c8_it_1_2', level: 1, levelLabel: 'Level 1: Easy (Foundational)', xp: 25, question: "Which symbol is used to write a single-line comment in Python?", options: ["//", "#", "/*", "--"], correctIndex: 1, explanation: "The hash symbol (#) marks a single-line comment in Python.", hint: "It is also called the pound or hashtag sign.", prerequisite: "Python Syntax" }
        ],
        2: [
          { id: 'c8_it_2_1', level: 2, levelLabel: 'Level 2: Medium (Standard)', xp: 50, question: "What is the output of the code snippet: `print(2 ** 3 + 1)`?", options: ["7", "9", "6", "8"], correctIndex: 1, explanation: "2 ** 3 is 8 (exponentiation), and 8 + 1 equals 9.", hint: "** is the exponentiation operator.", prerequisite: "Python Arithmetic Operators" },
          { id: 'c8_it_2_2', level: 2, levelLabel: 'Level 2: Medium (Standard)', xp: 50, question: "Which of the following is a valid variable name in Python?", options: ["2nd_value", "student-name", "student_score", "total score"], correctIndex: 2, explanation: "Identifiers can use letters, digits, and underscores, and cannot start with a digit.", hint: "Spaces and hyphens are not allowed.", prerequisite: "Variable Naming Rules" }
        ],
        3: [
          { id: 'c8_it_3_1', level: 3, levelLabel: 'Level 3: Hard (Advanced)', xp: 100, question: "What does `type('42')` return in Python?", options: ["<class 'int'>", "<class 'str'>", "<class 'float'>", "<class 'char'>"], correctIndex: 1, explanation: "Any value enclosed in quotes is treated as a string (`str`) in Python.", hint: "Notice the single quotes around 42.", prerequisite: "Python Data Types" },
          { id: 'c8_it_3_2', level: 3, levelLabel: 'Level 3: Hard (Advanced)', xp: 100, question: "What is printed by: `x = 17 // 5; print(x)`?", options: ["3.4", "3", "2", "4"], correctIndex: 1, explanation: "The // operator performs floor division, returning the integer quotient 3.", hint: "// drops the decimal remainder.", prerequisite: "Floor Division" }
        ]
      }
    }
  },
  'Class 10': {
    'Science': {
      'Chemical Reactions and Equations': {
        1: [
          { id: 'c10_s_1_1', level: 1, levelLabel: 'Level 1: Easy (Foundational)', xp: 25, question: "The substances that undergo chemical change at the start of a reaction are called:", options: ["Products", "Reactants", "Catalysts", "Inhibitors"], correctIndex: 1, explanation: "Reactants are the starting substances written on the left-hand side of the chemical equation.", hint: "They react with each other.", prerequisite: "Chemical Equations" },
          { id: 'c10_s_1_2', level: 1, levelLabel: 'Level 1: Easy (Foundational)', xp: 25, question: "Why should a magnesium ribbon be cleaned with sandpaper before burning in air?", options: ["To make it shiny", "To remove the protective basic magnesium oxide layer", "To increase its mass", "To cool the metal"], correctIndex: 1, explanation: "Cleaning removes the surface oxide coating so the ribbon can react readily with oxygen.", hint: "Magnesium reacts slowly with moist air when stored.", prerequisite: "Oxidation Basics" }
        ],
        2: [
          { id: 'c10_s_2_1', level: 2, levelLabel: 'Level 2: Medium (Standard)', xp: 50, question: "Balance the equation: Fe + H2O → Fe3O4 + H2", options: ["3Fe + 4H2O → Fe3O4 + 4H2", "Fe + 4H2O → Fe3O4 + H2", "3Fe + H2O → Fe3O4 + 4H2", "2Fe + 3H2O → Fe3O4 + 3H2"], correctIndex: 0, explanation: "3 Iron atoms and 4 water molecules balance both Fe3O4 and 4H2.", hint: "Match the 3 Fe and 4 O atoms on the right.", prerequisite: "Law of Conservation of Mass" },
          { id: 'c10_s_2_2', level: 2, levelLabel: 'Level 2: Medium (Standard)', xp: 50, question: "Why is cellular respiration classified as an exothermic process?", options: ["It absorbs sunlight", "It breaks down glucose with oxygen to release energy", "It cools down body cells", "It requires electricity"], correctIndex: 1, explanation: "Glucose oxidation releases energy (ATP and heat) inside living cells.", hint: "'Exo' means out and 'thermic' relates to heat/energy.", prerequisite: "Exothermic vs Endothermic" }
        ],
        3: [
          { id: 'c10_s_3_1', level: 3, levelLabel: 'Level 3: Hard (Advanced)', xp: 100, question: "Which reaction type is represented by: CaO(s) + H2O(l) → Ca(OH)2(aq) + Heat?", options: ["Endothermic Decomposition", "Exothermic Combination", "Double Displacement", "Electrolytic Reduction"], correctIndex: 1, explanation: "Quicklime and water combine into a single product (slaked lime) while releasing heat.", hint: "Two reactants form a single product and release heat.", prerequisite: "Types of Chemical Reactions" },
          { id: 'c10_s_3_2', level: 3, levelLabel: 'Level 3: Hard (Advanced)', xp: 100, question: "When white silver chloride (AgCl) is left in sunlight, it turns grey because of:", options: ["Oxidation of silver", "Photolytic decomposition into metallic silver and chlorine gas", "Absorption of moisture", "Reaction with nitrogen"], correctIndex: 1, explanation: "Sunlight decomposes 2AgCl(s) into grey 2Ag(s) and Cl2(g).", hint: "Light energy splits the compound.", prerequisite: "Photolytic Decomposition" }
        ]
      }
    }
  }
};

// --- BUILD QUESTION BANK FOR ALL CHAPTERS ACROSS ALL CLASSES & SUBJECTS ---
const DDA_QUESTION_BANK = {};

Object.keys(SYLLABUS).forEach(cls => {
  DDA_QUESTION_BANK[cls] = {};
  Object.keys(SYLLABUS[cls]).forEach(subj => {
    DDA_QUESTION_BANK[cls][subj] = {};
    SYLLABUS[cls][subj].forEach(chapter => {
      if (SPECIFIC_QUESTIONS[cls]?.[subj]?.[chapter]) {
        DDA_QUESTION_BANK[cls][subj][chapter] = SPECIFIC_QUESTIONS[cls][subj][chapter];
      } else {
        const isPython = chapter.toLowerCase().includes('python') || chapter.toLowerCase().includes('conditional') || chapter.toLowerCase().includes('list') || chapter.toLowerCase().includes('function') || chapter.toLowerCase().includes('dictionar');
        const templates = {
          'Mathematics': {
            1: [
              { q: `[${chapter}] Identify the foundational identity or property used in ${chapter}:`, o: [`Standard property of ${chapter}`, `Zero division property`, `Undefined geometric limit`, `Random approximation`], c: 0, exp: `The standard mathematical property governs ${chapter}.` },
              { q: `[${chapter}] What is the first step when simplifying an expression in ${chapter}?`, o: [`Multiply by zero`, `Identify like terms and fundamental constants`, `Drop negative signs`, `Square only one side`], c: 1, exp: `Grouping like terms and constants preserves equivalence in ${chapter}.` }
            ],
            2: [
              { q: `[${chapter}] Solve the intermediate application problem for ${chapter} when the input variable is doubled:`, o: [`Value becomes zero`, `Output scales proportionally according to ${chapter} rules`, `Remains negative`, `Becomes undefined`], c: 1, exp: `Applying ${chapter} rules scales the result systematically.` },
              { q: `[${chapter}] Which equation accurately models a balanced relationship in ${chapter}?`, o: [`x + 5 = x - 5`, `2x + 4 = 2(x + 3)`, `3x + 6 = 3(x + 2)`, `x / 0 = 1`], c: 2, exp: `By the distributive law, 3(x + 2) is identically equal to 3x + 6.` }
            ],
            3: [
              { q: `[${chapter}] In a multi-step proof involving ${chapter}, which condition must hold true across every step?`, o: [`Denominator equals zero`, `Variables are ignored`, `Strict equivalence across all transformations in ${chapter}`, `Signs are inverted randomly`], c: 2, exp: `Equivalence must be preserved at each algebraic step in ${chapter}.` },
              { q: `[${chapter}] If a word problem in ${chapter} yields two candidate solutions, how do you verify the valid root?`, o: [`Pick the larger number`, `Pick the negative number`, `Substitute back into the original constraint equation`, `Average the two numbers`], c: 2, exp: `Substituting the value back into the original statement verifies physical and mathematical validity.` }
            ]
          },
          'Science': {
            1: [
              { q: `[${chapter}] Which fundamental scientific principle explains ${chapter}?`, o: [`Core natural law of ${chapter}`, `Spontaneous generation`, `Unrelated magnetic drift`, `Thermal destruction`], c: 0, exp: `The core physical/biological principle directly explains ${chapter}.` },
              { q: `[${chapter}] Which SI unit or standard indicator is most relevant when studying ${chapter}?`, o: [`Cubic lightyears`, `Standard laboratory metric unit for ${chapter}`, `Arbitrary footsteps`, `Unmeasured guesswork`], c: 1, exp: `Standard SI units ensure reproducible scientific measurements in ${chapter}.` }
            ],
            2: [
              { q: `[${chapter}] In a controlled laboratory setup demonstrating ${chapter}, what is observed?`, o: [`Complete disappearance of matter`, `Measurable state or energy change predicted by ${chapter}`, `Spontaneous freezing of air`, `Violation of conservation laws`], c: 1, exp: `Controlled experiments confirm the conservation and transformation laws of ${chapter}.` },
              { q: `[${chapter}] Why is a control group or baseline measurement necessary in ${chapter} experiments?`, o: [`To waste time`, `To isolate the effect of the single independent variable`, `To change room temperature`, `To avoid recording data`], c: 1, exp: `A baseline control isolates the effect of the variable being tested.` }
            ],
            3: [
              { q: `[${chapter}] Evaluate what happens to the system in ${chapter} if external resistance is doubled:`, o: [`Efficiency becomes infinite`, `System halts instantly`, `Rate of process adjusts inversely according to ${chapter} relationships`, `Mass increases spontaneously`], c: 2, exp: `Physical and biological systems respond proportionally to external constraints.` },
              { q: `[${chapter}] How does energy conservation apply to the processes described in ${chapter}?`, o: [`Energy is created from nothing`, `Energy is destroyed after reaction`, `Total energy remains constant while converting between forms`, `Temperature never changes`], c: 2, exp: `The law of conservation of energy states that energy only transforms from one state to another.` }
            ]
          },
          'Social Science': {
            1: [
              { q: `[${chapter}] What is the primary historical, geographical, or civic focus of "${chapter}"?`, o: [`Constitutional, spatial, or historical framework of ${chapter}`, `Ancient mythology`, `Fictional trade routes`, `Unrelated astronomy`], c: 0, exp: `This chapter examines the real-world societal and geographical impact of ${chapter}.` },
              { q: `[${chapter}] Which primary source or indicator helps historians and geographers study "${chapter}"?`, o: [`Fictional novels`, `Verified archival records, maps, and census data`, `Rumors`, `Unverified legends`], c: 1, exp: `Empirical records, maps, and constitutional documents provide reliable evidence.` }
            ],
            2: [
              { q: `[${chapter}] How do the principles of "${chapter}" shape governance and community life?`, o: [`By abolishing all laws`, `By establishing structured rights, resource distribution, and civic order`, `By isolating regions permanently`, `By halting agriculture`], c: 1, exp: `Civic and geographical structures organize resources and democratic participation.` },
              { q: `[${chapter}] Why is equitable resource and power distribution emphasized in "${chapter}"?`, o: [`To create conflict`, `To prevent concentration of power and ensure sustainable development`, `To stop trade`, `To reduce literacy`], c: 1, exp: `Balanced power and resource sharing promote stability and inclusive growth.` }
            ],
            3: [
              { q: `[${chapter}] Analyze the long-term socio-economic outcome of the developments in "${chapter}":`, o: [`Zero impact on society`, `Immediate return to feudalism`, `Sustainable institutional and regional transformation`, `Decline of public infrastructure`], c: 2, exp: `Historical and developmental shifts create lasting institutional frameworks.` },
              { q: `[${chapter}] Compare local community needs with national policy goals in "${chapter}":`, o: [`They never interact`, `Local participation strengthens constitutional and developmental goals`, `National policy ignores geography`, `Only urban areas matter`], c: 1, exp: `Decentralized participation aligns local realities with broader developmental goals.` }
            ]
          },
          'Information Technology': isPython ? {
            1: [
              { q: `[${chapter}] What is the output of \`x = 5; print(x + 3)\` when learning ${chapter}?`, o: [`8`, `53`, `Error`, `None`], c: 0, exp: `In Python, integer addition evaluates 5 + 3 to 8.` },
              { q: `[${chapter}] Which data type is stored in \`flag = True\` in Python?`, o: [`str`, `bool`, `int`, `list`], c: 1, exp: `True and False are boolean (bool) values in Python.` }
            ],
            2: [
              { q: `[${chapter}] Given \`data = [10, 20, 30]\`, what does \`len(data)\` evaluate to in ${chapter}?`, o: [`10`, `3`, `30`, `2`], c: 1, exp: `The len() function returns the total number of elements in the sequence.` },
              { q: `[${chapter}] What is the output of \`word = 'Sutra'; print(word[0])\`?`, o: [`u`, `S`, `a`, `Sutra`], c: 1, exp: `Python uses zero-based indexing, so index 0 returns the first character 'S'.` }
            ],
            3: [
              { q: `[${chapter}] Which Python snippet properly iterates over 3 numbers without a SyntaxError?`, o: [`for i in range(3) print(i)`, `if x == 5 then:`, `for i in range(3): print(i)`, `def func[] =>`], c: 2, exp: `Python requires a colon (:) at the end of control flow headers.` },
              { q: `[${chapter}] What is printed by \`nums = [1, 2, 3]; nums.append(4); print(len(nums))\`?`, o: [`3`, `4`, `5`, `10`], c: 1, exp: `append(4) adds one item to the 3-element list, making its length 4.` }
            ]
          } : {
            1: [
              { q: `[${chapter}] Which core component or digital rule is essential in "${chapter}"?`, o: [`Structured protocol and safe operation in ${chapter}`, `Deleting system files`, `Sharing passwords publicly`, `Disconnecting hardware randomly`], c: 0, exp: `Following structured computing protocols ensures accuracy and safety.` },
              { q: `[${chapter}] What is the primary purpose of organizing data systematically in "${chapter}"?`, o: [`To slow down the CPU`, `To enable fast retrieval, accuracy, and clear processing`, `To fill up the hard disk`, `To hide files from the user`], c: 1, exp: `Structured data organization improves efficiency and reduces errors.` }
            ],
            2: [
              { q: `[${chapter}] When executing a workflow in "${chapter}", what is the best practice?`, o: [`Skip verification`, `Validate inputs and follow a step-by-step logical sequence`, `Click unverified pop-up links`, `Turn off the monitor`], c: 1, exp: `Logical sequencing and input validation prevent runtime errors.` },
              { q: `[${chapter}] How does two-factor authentication or permission control protect users in "${chapter}"?`, o: [`It deletes accounts`, `It adds a second layer of identity verification against unauthorized access`, `It makes the internet slower`, `It publishes user data`], c: 1, exp: `Layered security prevents unauthorized access even if a password is leaked.` }
            ],
            3: [
              { q: `[${chapter}] Diagnose why an operation in "${chapter}" fails when given invalid parameters:`, o: [`Hardware melted`, `Screen brightness is low`, `Logical constraint or syntax rule violation`, `Mouse battery low`], c: 2, exp: `Software systems reject instructions that violate syntax or security constraints.` },
              { q: `[${chapter}] Which strategy ensures both data integrity and ethical compliance in "${chapter}"?`, o: [`Copying unlicensed software`, `Using verified sources, regular backups, and respecting digital privacy`, `Disabling all firewalls`, `Using weak passwords`], c: 1, exp: `Backups, verification, and privacy protection uphold digital ethics and reliability.` }
            ]
          }
        };

        const t = templates[subj] || templates['Science'];
        DDA_QUESTION_BANK[cls][subj][chapter] = {
          1: t[1].map((item, idx) => ({ id: `${cls}_${subj}_${chapter}_L1_${idx}`, level: 1, levelLabel: 'Level 1: Easy (Foundational)', xp: 25, question: item.q, options: item.o, correctIndex: item.c, explanation: item.exp, hint: `Focus on the fundamental definition of ${chapter}.`, prerequisite: `Basics of ${subj}` })),
          2: t[2].map((item, idx) => ({ id: `${cls}_${subj}_${chapter}_L2_${idx}`, level: 2, levelLabel: 'Level 2: Medium (Standard)', xp: 50, question: item.q, options: item.o, correctIndex: item.c, explanation: item.exp, hint: `Apply the standard rule of ${chapter} step by step.`, prerequisite: `Foundations of ${chapter}` })),
          3: t[3].map((item, idx) => ({ id: `${cls}_${subj}_${chapter}_L3_${idx}`, level: 3, levelLabel: 'Level 3: Hard (Advanced)', xp: 100, question: item.q, options: item.o, correctIndex: item.c, explanation: item.exp, hint: `Consider the multi-step analytical impact in ${chapter}.`, prerequisite: `Application of ${chapter}` }))
        };
      }
    });
  });
});

// Encouraging Feedback Pools
const POSITIVE_MESSAGES = [
  "Well done!",
  "Excellent!",
  "You got it!",
  "Super work!",
  "Brilliant thinking!"
];

const SOFT_ENCOURAGEMENT_MESSAGES = [
  "Good try! Every mistake helps you learn.",
  "Almost there, keep going!",
  "Nice effort. Let's understand this one together.",
  "Mistakes are part of learning. You're getting there!",
  "Great attempt! Read the explanation and try the next one."
];

const REWARDS_STORE = [
  { id: 'r1', name: 'Avatar Frame', cost: 50, icon: User },
  { id: 'r2', name: 'Gold Star Sticker', cost: 30, icon: Star },
  { id: 'r3', name: 'Blue Theme', cost: 80, icon: Layers },
  { id: 'r4', name: 'Progress Certificate', cost: 150, icon: Award }
];

const SUPABASE_SCHEMA_SQL = `-- SutraAI Production Supabase SQL Schema
-- Supports Classes 6-10, Multi-Subject Syllabus, Points Ledger, Redemptions & Focus Violations

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  roll_no TEXT UNIQUE,
  teacher_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
  class_group TEXT DEFAULT 'Class 8',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.concepts (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  class_level TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  prerequisite_id TEXT
);

CREATE TABLE IF NOT EXISTS public.attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_seconds INT NOT NULL,
  timed_out BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, reward_id)
);

CREATE TABLE IF NOT EXISTS public.violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  class_group TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;

export default function App() {
  // --- FIREBASE AUTH & FIRESTORE LISTENER SETUP ---
  const [fbUser, setFbUser] = useState(null);
  const [dbViolations, setDbViolations] = useState([]);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        // Fallback silently if offline
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setFbUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!fbUser || !db) return;
    const violationsCol = collection(db, 'artifacts', appId, 'public', 'data', 'violations');
    const unsubscribe = onSnapshot(
      violationsCol,
      (snapshot) => {
        const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setDbViolations(fetched);
      },
      () => {
        // Ignore permission/offline errors and rely on local state mirror
      }
    );
    return () => unsubscribe();
  }, [fbUser]);

  // --- THEME & NAVIGATION STATE ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authRoleTab, setAuthRoleTab] = useState('student');
  const [loginInputId, setLoginInputId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setRawActiveTab] = useState('home');
  const [tabHistory, setTabHistory] = useState([]);

  const setActiveTab = useCallback((newTab, resetHistory = false) => {
    if (resetHistory) {
      setTabHistory([]);
      setRawActiveTab(newTab);
      return;
    }
    setRawActiveTab(prev => {
      if (prev !== newTab) {
        setTabHistory(h => [...h, prev]);
      }
      return newTab;
    });
  }, []);

  const handleBack = useCallback(() => {
    setTabHistory(prev => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const last = copy.pop();
      setRawActiveTab(last);
      return copy;
    });
  }, []);

  // --- ROSTER & OFFLINE STATE ---
  const [studentsRoster, setStudentsRoster] = useState(SEEDED_STUDENTS);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [syncToast, setSyncToast] = useState('');
  const [globalNotification, setGlobalNotification] = useState(null);

  const showNotification = useCallback((msg, type = 'info') => {
    setGlobalNotification({ msg, type });
    setTimeout(() => setGlobalNotification(null), 4000);
  }, []);

  // --- STUDENT LEARNING, POINTS, BADGES & REWARDS STATE ---
  const [activeSubject, setActiveSubject] = useState('Science');
  const [activeChapter, setActiveChapter] = useState('Food: Where Does It Come From');
  const [selectedLang, setSelectedLang] = useState('en');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const [pointsLedger, setPointsLedger] = useState([
    { id: 'init_1', user_id: 'st_001', points: 120, reason: 'Initial Baseline Bonus', created_at: new Date().toISOString() },
    { id: 'init_2', user_id: 'st_007', points: 95, reason: 'Initial Baseline Bonus', created_at: new Date().toISOString() }
  ]);
  const [earnedBadges, setEarnedBadges] = useState([
    { user_id: 'st_001', chapter: 'Knowing Our Numbers', subject: 'Mathematics' }
  ]);
  const [redemptions, setRedemptions] = useState([]); // { id, user_id, reward_id, created_at }
  const [chapterAttemptTracker, setChapterAttemptTracker] = useState({}); // key: `${user_id}_${chapter}` -> { count, correct }
  const [unlockedChaptersMap, setUnlockedChaptersMap] = useState({}); // key: `${user_id}_${subject}` -> highestUnlockedIndex
  const [attemptsLog, setAttemptsLog] = useState([]); // { id, user_id, question_id, is_correct, response_seconds, timed_out, created_at }

  // Star of the Class state
  const [starCheers, setStarCheers] = useState({ st_001: 4, st_002: 7, st_008: 3 });
  const [cheersGiven, setCheersGiven] = useState({});
  const [cheerAnim, setCheerAnim] = useState(false);
  const [appreciationNotes, setAppreciationNotes] = useState({
    st_002: "Outstanding accuracy and speed in Linear Equations this week! Keep inspiring Class 8."
  });
  const [teacherNoteInput, setTeacherNoteInput] = useState('');

  // --- FOCUS MODE STATE (Classes 6 to 10) ---
  const [classFocusModeEnabled, setClassFocusModeEnabled] = useState({
    'Class 6': true,
    'Class 7': true,
    'Class 8': true,
    'Class 9': true,
    'Class 10': true
  });
  const [focusSessionId, setFocusSessionId] = useState(() => `sess_${Date.now()}`);
  const [sessionViolationsCount, setSessionViolationsCount] = useState(0);
  const [showViolationBanner, setShowViolationBanner] = useState(false);
  const [showFocusWelcomeBanner, setShowFocusWelcomeBanner] = useState(false);
  const [showStretchBreakModal, setShowStretchBreakModal] = useState(false);
  const [localViolations, setLocalViolations] = useState([
    { id: 'v_seed_1', user_id: 'st_005', session_id: 'sess_0', class_group: 'Class 8', created_at: new Date().toISOString() },
    { id: 'v_seed_2', user_id: 'st_005', session_id: 'sess_0', class_group: 'Class 8', created_at: new Date().toISOString() },
    { id: 'v_seed_3', user_id: 'st_001', session_id: 'sess_0', class_group: 'Class 6', created_at: new Date().toISOString() }
  ]);
  const lastViolationTimestampRef = useRef(0);

  // --- DDA SOLVER & COUNTDOWN TIMER STATE ---
  const [currentLevel, setCurrentLevel] = useState(1);
  const [questionBankIndex, setQuestionBankIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [consecutiveCorrectCount, setConsecutiveCorrectCount] = useState(0);
  const [celebrationBanner, setCelebrationBanner] = useState('');
  const [lastFeedbackMsg, setLastFeedbackMsg] = useState('');
  const [currentFeedbackMsg, setCurrentFeedbackMsg] = useState('');
  const [showHintDrawer, setShowHintDrawer] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [scratchpadNote, setScratchpadNote] = useState('');

  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTimeForQuestion, setTotalTimeForQuestion] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const autoAdvanceTimeoutRef = useRef(null);

  // --- TEACHER DASHBOARD & MODALS STATE ---
  const [dashboardClass, setDashboardClass] = useState('Class 8');
  const [dashboardSubject, setDashboardSubject] = useState('Mathematics');
  const [heatmapFilter, setHeatmapFilter] = useState('all');
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudentDrawer, setSelectedStudentDrawer] = useState(null);
  const [selectedCellDetail, setSelectedCellDetail] = useState(null);
  const [showRemedialGenerator, setShowRemedialGenerator] = useState(false);
  const [generatedRemedialPlan, setGeneratedRemedialPlan] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newRollNo, setNewRollNo] = useState('');
  const [newName, setNewName] = useState('');
  const [newClassGroup, setNewClassGroup] = useState('Class 8');
  const [newPassword, setNewPassword] = useState('password123');
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetTargetStudent, setResetTargetStudent] = useState(null);
  const [resetNewPassword, setResetNewPassword] = useState('password123');
  const [copiedSchema, setCopiedSchema] = useState(false);

  // --- COMPUTED VALUES ---
  const isStudentInLesson = currentUser?.role === 'student' && (activeTab === 'learn' || activeTab === 'solve');
  const isFocusActiveForStudent = Boolean(
    isStudentInLesson && currentUser && classFocusModeEnabled[currentUser.class_group]
  );

  // Combine Firestore and local violations without duplicates
  const allViolations = useMemo(() => {
    const map = new Map();
    localViolations.forEach(v => map.set(v.id, v));
    dbViolations.forEach(v => map.set(v.id, v));
    return Array.from(map.values());
  }, [localViolations, dbViolations]);

  // Calculate total points strictly from pointsLedger
  const currentUserPoints = useMemo(() => {
    if (!currentUser) return 0;
    return pointsLedger
      .filter(entry => entry.user_id === currentUser.id)
      .reduce((acc, entry) => acc + entry.points, 0);
  }, [pointsLedger, currentUser]);

  // --- FOCUS MODE EFFECT (Tab switch, window blur, fullscreen exit, 15-min stretch break) ---
  const requestLessonFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      // Fullscreen may be blocked by iframe permissions; continue gracefully
    }
  }, []);

  const startLessonWithFocus = useCallback((subject, chapter, targetTab = 'learn') => {
    setActiveSubject(subject);
    setActiveChapter(chapter);
    setSelectedOption(null);
    setAnswerSubmitted(false);
    setIsTimedOut(false);
    setActiveTab(targetTab);

    if (currentUser && classFocusModeEnabled[currentUser.class_group]) {
      setShowFocusWelcomeBanner(true);
      requestLessonFullscreen();
    }
  }, [currentUser, classFocusModeEnabled, requestLessonFullscreen, setActiveTab]);

  useEffect(() => {
    if (!isFocusActiveForStudent || !currentUser) return;

    const recordFocusViolation = async () => {
      const now = Date.now();
      // Ignore any duplicate signal within 3 seconds of the previous one
      if (now - lastViolationTimestampRef.current < 3000) return;
      lastViolationTimestampRef.current = now;

      setSessionViolationsCount(prev => prev + 1);
      setShowViolationBanner(true);

      const newViolation = {
        id: `v_${now}_${Math.random().toString(36).slice(2, 6)}`,
        user_id: currentUser.id,
        session_id: focusSessionId,
        class_group: currentUser.class_group,
        created_at: new Date().toISOString()
      };

      setLocalViolations(prev => [newViolation, ...prev]);

      if (db && fbUser) {
        try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'violations'), {
            user_id: newViolation.user_id,
            session_id: newViolation.session_id,
            class_group: newViolation.class_group,
            created_at: newViolation.created_at
          });
        } catch (err) {
          // Saved in localViolations mirror
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordFocusViolation();
      }
    };

    const handleWindowBlur = () => {
      recordFocusViolation();
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        recordFocusViolation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Every 15 minutes, show "Great focus! Stretch for one minute."
    const breakInterval = setInterval(() => {
      setShowStretchBreakModal(true);
    }, 15 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearInterval(breakInterval);
    };
  }, [isFocusActiveForStudent, currentUser, focusSessionId, fbUser]);

  const handleReturnToLesson = () => {
    setShowViolationBanner(false);
    requestLessonFullscreen();
  };

  // --- OFFLINE QUEUE LOGGER ---
  const logOfflineAction = useCallback((actionType, payload) => {
    const item = { id: Date.now(), actionType, payload, time: new Date().toLocaleTimeString() };
    setOfflineQueue(prev => [item, ...prev]);
    if (!isOnline) {
      setSyncToast(`[Offline Mode] Cached locally: ${actionType}`);
      setTimeout(() => setSyncToast(''), 3000);
    }
  }, [isOnline]);

  const handleToggleOnline = () => {
    if (!isOnline) {
      setIsOnline(true);
      setSyncToast(`Synced ${offlineQueue.length} offline progress records to Sutra Cloud!`);
      setTimeout(() => {
        setOfflineQueue([]);
        setSyncToast('');
      }, 3500);
    } else {
      setIsOnline(false);
      setSyncToast('Offline Mode Active. Questions and progress cached locally.');
      setTimeout(() => setSyncToast(''), 3500);
    }
  };

  // --- AUTHENTICATION HANDLERS ---
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    const formattedId = loginInputId.trim().toUpperCase();

    if (authRoleTab === 'student') {
      const foundStudent = studentsRoster.find(s => s.roll_no.toUpperCase() === formattedId);
      if (foundStudent && loginPassword === 'password123') {
        const defaultSubj = 'Science';
        const firstChap = SYLLABUS[foundStudent.class_group]?.[defaultSubj]?.[0] || 'Food: Where Does It Come From';
        setCurrentUser(foundStudent);
        setActiveSubject(defaultSubj);
        setActiveChapter(firstChap);
        setFocusSessionId(`sess_${Date.now()}`);
        setSessionViolationsCount(0);
        setShowViolationBanner(false);
        setActiveTab('home', true);
        setLoginInputId('');
        setLoginPassword('');
      } else {
        setAuthError("Login failed. Please check your Roll Number and Password.");
      }
    } else {
      const foundTeacher = SEEDED_TEACHERS.find(t => t.teacher_id.toUpperCase() === formattedId);
      if (foundTeacher && loginPassword === 'password123') {
        setCurrentUser(foundTeacher);
        setDashboardClass(foundTeacher.class_group || 'Class 8');
        setDashboardSubject('Mathematics');
        setActiveTab('dashboard', true);
        setLoginInputId('');
        setLoginPassword('');
      } else {
        setAuthError("Login failed. Please check your Teacher ID and Password.");
      }
    }
  };

  const handleQuickFillStudent = (studentObj) => {
    setAuthRoleTab('student');
    setLoginInputId(studentObj.roll_no);
    setLoginPassword('password123');
    setAuthError('');
  };

  const handleQuickFillTeacher = (teacherObj) => {
    setAuthRoleTab('teacher');
    setLoginInputId(teacherObj.teacher_id);
    setLoginPassword('password123');
    setAuthError('');
  };

  const handleLogout = () => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch (e) {}
    setCurrentUser(null);
    setShowViolationBanner(false);
    setShowFocusWelcomeBanner(false);
    setAuthError('');
    setTabHistory([]);
  };

  // --- DDA QUESTION & TIMER LOGIC ---
  const getInitialTimeForQuestion = useCallback((level, classGroup) => {
    let baseTime = 30; // Easy = 30s
    if (level === 2) baseTime = 45; // Medium = 45s
    if (level === 3) baseTime = 60; // Hard = 60s
    // Students in Class 6 and Class 7 get 15 extra seconds at every level
    if (classGroup === 'Class 6' || classGroup === 'Class 7') {
      baseTime += 15;
    }
    return baseTime;
  }, []);

  const activeQuestion = useMemo(() => {
    const cls = currentUser?.class_group || 'Class 8';
    const chapterQuestions = DDA_QUESTION_BANK[cls]?.[activeSubject]?.[activeChapter]?.[currentLevel]
      || DDA_QUESTION_BANK['Class 8']?.['Mathematics']?.['Linear Equations in 1 Var']?.[currentLevel]
      || DDA_QUESTION_BANK['Class 8']['Mathematics']['Linear Equations in 1 Var'][1];
    return chapterQuestions[questionBankIndex % chapterQuestions.length];
  }, [currentUser, activeSubject, activeChapter, currentLevel, questionBankIndex]);

  const handleNextQuestion = useCallback(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    setSelectedOption(null);
    setAnswerSubmitted(false);
    setIsTimedOut(false);
    setCurrentFeedbackMsg('');
    setShowHintDrawer(false);
    setQuestionBankIndex(prev => prev + 1);
  }, []);

  const getNonRepeatingMessage = useCallback((pool) => {
    const available = pool.filter(msg => msg !== lastFeedbackMsg);
    const chosen = available[Math.floor(Math.random() * available.length)] || pool[0];
    setLastFeedbackMsg(chosen);
    return chosen;
  }, [lastFeedbackMsg]);

  // Record weekly accuracy & chapter progression
  const updateStudentStatsAndChapterProgress = useCallback((isCorrect, responseSeconds, timedOut) => {
    if (!currentUser) return;

    // 1. Save attempt in attemptsLog
    const attemptEntry = {
      id: `att_${Date.now()}`,
      user_id: currentUser.id,
      question_id: activeQuestion.id,
      is_correct: isCorrect,
      response_seconds: responseSeconds,
      timed_out: timedOut,
      created_at: new Date().toISOString()
    };
    setAttemptsLog(prev => [attemptEntry, ...prev]);

    // 2. Update student's weeklyStats for Star of the Class ranking
    setStudentsRoster(prev => prev.map(st => {
      if (st.id !== currentUser.id) return st;
      const prevTotal = st.weeklyStats?.total_answered || 0;
      const prevCorrect = st.weeklyStats?.correct || 0;
      const prevAvg = st.weeklyStats?.avg_time || 15;
      const newTotal = prevTotal + 1;
      const newCorrect = prevCorrect + (isCorrect ? 1 : 0);
      const newAvg = Math.round(((prevAvg * prevTotal) + responseSeconds) / newTotal);
      return {
        ...st,
        xp: st.xp + (isCorrect ? activeQuestion.xp : 0),
        weeklyStats: { total_answered: newTotal, correct: newCorrect, avg_time: newAvg }
      };
    }));

    // 3. Award Points in points_ledger (+10 for correct, +2 for attempted question)
    const earnedPts = isCorrect ? 10 : 2;
    setPointsLedger(prev => [
      {
        id: `pt_${Date.now()}`,
        user_id: currentUser.id,
        points: earnedPts,
        reason: isCorrect ? `Correct Answer (${activeChapter})` : `Attempted Question (${activeChapter})`,
        created_at: new Date().toISOString()
      },
      ...prev
    ]);

    // 4. Track 5-question chapter completion (at least 3 of 5 correct completes chapter & unlocks next)
    const trackerKey = `${currentUser.id}_${activeChapter}`;
    setChapterAttemptTracker(prev => {
      const current = prev[trackerKey] || { count: 0, correct: 0 };
      const nextCount = current.count + 1;
      const nextCorrect = current.correct + (isCorrect ? 1 : 0);

      if (nextCount >= 5) {
        if (nextCorrect >= 3) {
          // Unlock next chapter in subject sequence
          const subjChapters = SYLLABUS[currentUser.class_group]?.[activeSubject] || [];
          const chapIdx = subjChapters.indexOf(activeChapter);
          const unlockKey = `${currentUser.id}_${activeSubject}`;
          setUnlockedChaptersMap(uPrev => ({
            ...uPrev,
            [unlockKey]: Math.max(uPrev[unlockKey] || 0, chapIdx + 1)
          }));

          // Award badge & +50 bonus points if not already earned
          const alreadyEarned = earnedBadges.some(b => b.user_id === currentUser.id && b.chapter === activeChapter);
          if (!alreadyEarned) {
            setEarnedBadges(bPrev => [...bPrev, { user_id: currentUser.id, chapter: activeChapter, subject: activeSubject }]);
            setPointsLedger(lPrev => [
              {
                id: `pt_chap_${Date.now()}`,
                user_id: currentUser.id,
                points: 50,
                reason: `Completed Chapter: ${activeChapter}`,
                created_at: new Date().toISOString()
              },
              ...lPrev
            ]);
            setCelebrationBanner(`🏆 "${activeChapter} Champion" Badge Earned! (+50 Bonus Points)`);
            setTimeout(() => setCelebrationBanner(''), 5000);
          }
        } else {
          showNotification(`Chapter set finished (${nextCorrect}/5 correct). Get at least 3/5 correct to complete "${activeChapter}"!`, 'info');
        }
        return { ...prev, [trackerKey]: { count: 0, correct: 0 } };
      }

      return { ...prev, [trackerKey]: { count: nextCount, correct: nextCorrect } };
    });
  }, [currentUser, activeQuestion, activeChapter, activeSubject, earnedBadges, showNotification]);

  const handleTimeout = useCallback(() => {
    setIsTimerRunning(false);
    setSelectedOption(null);
    setAnswerSubmitted(true);
    setIsTimedOut(true);
    setConsecutiveCorrectCount(0);

    updateStudentStatsAndChapterProgress(false, totalTimeForQuestion, true);
    logOfflineAction('SUBMIT_ANSWER', {
      questionId: activeQuestion.id,
      result: 'TIMED_OUT',
      xp: 0,
      response_seconds: totalTimeForQuestion,
      timed_out: true
    });

    if (currentLevel > 1) {
      setCurrentLevel(prev => prev - 1);
    }

    // Auto-advance after 3 seconds
    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    autoAdvanceTimeoutRef.current = setTimeout(() => {
      handleNextQuestion();
    }, 3000);
  }, [totalTimeForQuestion, updateStudentStatsAndChapterProgress, logOfflineAction, activeQuestion, currentLevel, handleNextQuestion]);

  // Initialize timer whenever a new question appears on Solve
  useEffect(() => {
    if (activeTab === 'solve' && currentUser?.role === 'student' && !answerSubmitted) {
      const initialSeconds = getInitialTimeForQuestion(currentLevel, currentUser.class_group);
      setTimeLeft(initialSeconds);
      setTotalTimeForQuestion(initialSeconds);
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
    }
  }, [activeTab, questionBankIndex, currentLevel, activeChapter, activeSubject, currentUser, answerSubmitted, getInitialTimeForQuestion]);

  // Tick timer every second
  useEffect(() => {
    if (!isTimerRunning) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const intervalId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isTimerRunning, timeLeft, handleTimeout]);

  // Cleanup autoAdvanceTimeoutRef only on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  const handleAnswerSubmit = (optionIndex) => {
    if (answerSubmitted) return;
    setIsTimerRunning(false);
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    setSelectedOption(optionIndex);
    setAnswerSubmitted(true);
    setIsTimedOut(false);

    const isCorrect = optionIndex === activeQuestion.correctIndex;
    const responseSeconds = Math.max(1, totalTimeForQuestion - timeLeft);

    updateStudentStatsAndChapterProgress(isCorrect, responseSeconds, false);

    if (isCorrect) {
      const nextStreak = consecutiveCorrectCount + 1;
      setConsecutiveCorrectCount(nextStreak);
      setCurrentFeedbackMsg(getNonRepeatingMessage(POSITIVE_MESSAGES));

      logOfflineAction('SUBMIT_ANSWER', {
        questionId: activeQuestion.id,
        result: 'CORRECT',
        xp: activeQuestion.xp,
        response_seconds: responseSeconds,
        timed_out: false
      });

      if (nextStreak === 3) {
        setCelebrationBanner("3 in a row! You're on fire! 🔥 (+50 Bonus XP)");
        setTimeout(() => setCelebrationBanner(''), 5000);
      } else if (nextStreak >= 2 && currentLevel < 3) {
        const nextLvl = currentLevel + 1;
        setCurrentLevel(nextLvl);
        setCelebrationBanner(`🎉 2 Correct in a Row! Upgraded to Level ${nextLvl}`);
        setTimeout(() => setCelebrationBanner(''), 5000);
      }
    } else {
      setConsecutiveCorrectCount(0);
      setCurrentFeedbackMsg(getNonRepeatingMessage(SOFT_ENCOURAGEMENT_MESSAGES));

      logOfflineAction('SUBMIT_ANSWER', {
        questionId: activeQuestion.id,
        result: 'INCORRECT',
        xp: 0,
        response_seconds: responseSeconds,
        timed_out: false
      });

      if (currentLevel > 1) {
        setCurrentLevel(prev => prev - 1);
      }
      setShowHintDrawer(true);
    }
  };

  // --- STAR OF THE CLASS RANKING (Classes 6, 7, 8) ---
  const getClassLeaderboard = useCallback((className) => {
    const eligible = studentsRoster.filter(
      s => s.class_group === className && (s.weeklyStats?.total_answered || 0) >= 20
    );
    return [...eligible].sort((a, b) => {
      const accA = a.weeklyStats.correct / a.weeklyStats.total_answered;
      const accB = b.weeklyStats.correct / b.weeklyStats.total_answered;
      if (Math.abs(accA - accB) > 0.0001) return accB - accA;
      return a.weeklyStats.avg_time - b.weeklyStats.avg_time;
    });
  }, [studentsRoster]);

  const handleCheerStar = (starId) => {
    if (!currentUser) return;
    if (cheersGiven[currentUser.id]) {
      showNotification("You have already sent your weekly cheer!", "info");
      return;
    }
    setCheersGiven(prev => ({ ...prev, [currentUser.id]: true }));
    setStarCheers(prev => ({ ...prev, [starId]: (prev[starId] || 0) + 1 }));
    setCheerAnim(true);
    setTimeout(() => setCheerAnim(false), 1000);
    showNotification("Cheer sent to your class star! 🌟", "success");
  };

  // --- REWARDS STORE REDEMPTION (Classes 6 & 7) ---
  const handleRedeemReward = (reward) => {
    if (!currentUser) return;
    const alreadyRedeemed = redemptions.some(r => r.user_id === currentUser.id && r.reward_id === reward.id);
    if (alreadyRedeemed || currentUserPoints < reward.cost) return;

    setPointsLedger(prev => [
      {
        id: `redeem_pt_${Date.now()}`,
        user_id: currentUser.id,
        points: -reward.cost,
        reason: `Redeemed Reward: ${reward.name}`,
        created_at: new Date().toISOString()
      },
      ...prev
    ]);

    setRedemptions(prev => [
      {
        id: `red_${Date.now()}`,
        user_id: currentUser.id,
        reward_id: reward.id,
        created_at: new Date().toISOString()
      },
      ...prev
    ]);

    showNotification(`Successfully redeemed "${reward.name}"!`, 'success');
  };

  // --- TEACHER HANDLERS ---
  const filteredStudents = useMemo(() => {
    return studentsRoster.filter(st => {
      if (st.class_group !== dashboardClass) return false;
      const matchesSearch = st.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
                            st.roll_no.toLowerCase().includes(searchStudent.toLowerCase());
      let matchesFilter = true;
      if (heatmapFilter === 'struggling') {
        matchesFilter = st.status === 'Needs Attention' || st.avgMastery < 60;
      } else if (heatmapFilter === 'mastered') {
        matchesFilter = st.status === 'Mastered' || st.avgMastery >= 85;
      }
      return matchesSearch && matchesFilter;
    });
  }, [studentsRoster, dashboardClass, searchStudent, heatmapFilter]);

  const handleGenerateRemediation = () => {
    setShowRemedialGenerator(true);
    setGeneratedRemedialPlan(null);
    const chapters = SYLLABUS[dashboardClass]?.[dashboardSubject] || ['Core Chapter'];

    setTimeout(() => {
      setGeneratedRemedialPlan({
        topic: `${dashboardSubject}: ${chapters[0]}`,
        microGap: `Difficulty applying multi-step concepts and maintaining accuracy under timer constraints in ${chapters[0]}.`,
        teacherStrategy: [
          `Min 1: Visual Concept Hook — Draw a clear diagram or balance model for ${chapters[0]} on the blackboard.`,
          `Min 2: Guided Walkthrough — Solve 1 standard Level 2 problem aloud while highlighting common sign/unit pitfalls.`,
          `Min 3–4: Peer Pairing — Pair Class Mentors (>85% mastery) with Mentees (<60% mastery) for 2 rapid slate problems.`,
          `Min 5: Exit Ticket — Run a 1-question check to verify concept retention.`
        ],
        blackboardProblems: [
          { prob: `1. Foundational Check (${chapters[0]})`, step1: "Identify given constants and target unknown", step2: "Apply primary formula to verify solution" },
          { prob: `2. Standard Application (${chapters[0]})`, step1: "Translate real-world statement into relationship", step2: "Simplify step-by-step and check units" },
          { prob: `3. Challenge Verification`, step1: "Substitute result back into initial condition", step2: "Confirm LHS equals RHS" }
        ],
        peerPairings: [
          { mentor: "Akella K. (Mentor)", mentee: "Rohan V. (Mentee)", promptCard: `Walk through the first step of isolating the core term in ${chapters[0]}.` },
          { mentor: "Ananya R. (Mentor)", mentee: "Siddharth N. (Mentee)", promptCard: "Explain how to check the final answer before submitting." }
        ]
      });
    }, 450);
  };

  const handleCreateStudent = (e) => {
    e.preventDefault();
    const formattedRoll = newRollNo.trim().toUpperCase();
    if (!formattedRoll || !newName.trim()) return;

    const parts = newName.trim().split(' ');
    const display_name = `${parts[0]} ${parts[1] ? parts[1].charAt(0) + '.' : ''}`.trim();

    const newStudentObj = {
      id: `st_${Date.now()}`,
      roll_no: formattedRoll,
      name: newName.trim(),
      display_name,
      role: 'student',
      class_group: newClassGroup,
      avgMastery: 55,
      xp: 100,
      streak: 1,
      status: 'Needs Attention',
      velocity: 'Newly Enrolled',
      errorPattern: 'Baseline diagnostic pending',
      weeklyStats: { total_answered: 0, correct: 0, avg_time: 0 }
    };

    setStudentsRoster(prev => [newStudentObj, ...prev]);
    setShowAddStudentModal(false);
    setNewRollNo('');
    setNewName('');
    showNotification(`Student ${newStudentObj.name} (${formattedRoll}) added to ${newClassGroup}!`, 'success');
  };

  const handleResetPasswordSubmit = (e) => {
    e.preventDefault();
    showNotification(`Password for ${resetTargetStudent?.name} (${resetTargetStudent?.roll_no}) updated!`, 'success');
    setShowResetPasswordModal(false);
    setResetTargetStudent(null);
  };

  const currentLessonText = VERNACULAR_LESSONS[selectedLang] || VERNACULAR_LESSONS.en;

  // Theme helper classes for high contrast in both Light and Dark mode
  const bgMain = isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';
  const cardBg = isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const subCardBg = isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800';
  const mutedText = isDarkMode ? 'text-slate-300' : 'text-slate-600';

  return (
    <div className={`min-h-screen ${bgMain} font-sans flex flex-col selection:bg-sky-500 selection:text-white transition-colors duration-200`}>
      
      {/* GLOBAL TOAST NOTIFICATION */}
      {globalNotification && (
        <div className="fixed top-20 right-4 z-50 max-w-sm animate-bounce">
          <div className={`px-4 py-3 rounded-xl shadow-xl border flex items-center space-x-3 ${
            globalNotification.type === 'success'
              ? 'bg-emerald-900 border-emerald-500 text-white'
              : 'bg-slate-900 border-sky-500 text-white'
          }`}>
            {globalNotification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-sky-400 flex-shrink-0" />
            )}
            <span className="font-bold text-xs sm:text-sm">{globalNotification.msg}</span>
            <button onClick={() => setGlobalNotification(null)} className="text-slate-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- TOP HEADER NAVIGATION --- */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-sky-600 to-indigo-600 p-2 rounded-xl flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">SutraAI</span>
                <span className="text-xs bg-sky-900 text-sky-200 font-bold px-2 py-0.5 rounded-full border border-sky-700">सूत्र AI</span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">Offline-First Adaptive Platform • Classes 6–10</p>
            </div>
          </div>

          {/* Right Controls: Offline Toggle, User Info, and Light/Dark Mode Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Offline Simulator Button */}
            <button
              onClick={handleToggleOnline}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isOnline 
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900' 
                  : 'bg-amber-950 text-amber-300 border-amber-700 hover:bg-amber-900 animate-pulse'
              }`}
              title="Toggle network connectivity simulation"
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
              <span className="hidden md:inline">{isOnline ? 'Online / Synced' : 'Offline Mode'}</span>
              {offlineQueue.length > 0 && (
                <span className="bg-amber-400 text-slate-950 font-extrabold px-1.5 py-0.5 rounded-full text-[10px]">
                  {offlineQueue.length}
                </span>
              )}
            </button>

            {/* User Profile Badge */}
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs font-extrabold">
                  {currentUser.role === 'student' ? currentUser.roll_no.slice(0, 4) : currentUser.teacher_id}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-white line-clamp-1">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-300 capitalize">{currentUser.role} • {currentUser.class_group}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 text-slate-300 hover:text-rose-400 transition-colors"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:block text-xs text-sky-300 font-bold bg-sky-950 border border-sky-800 px-3 py-1.5 rounded-xl">
                Sign In Below
              </div>
            )}

            {/* High-Contrast Light / Dark Mode Toggle at Top Right Corner */}
            <button
              onClick={() => setIsDarkMode(prev => !prev)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-all flex items-center space-x-1"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Light or Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-sky-300" />}
              <span className="text-xs font-bold hidden lg:inline text-white">{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>

          </div>
        </div>
      </header>

      {/* Sync Toast Banner */}
      {syncToast && (
        <div className="bg-slate-800 border-b border-sky-700 text-sky-200 px-4 py-2 text-xs font-bold text-center flex items-center justify-center space-x-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Celebratory Banner */}
      {celebrationBanner && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white px-4 py-2.5 text-xs sm:text-sm text-center font-extrabold shadow-md flex items-center justify-center space-x-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{celebrationBanner}</span>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ========================================================= */}
        {/* LOGIN SCREEN (IF LOGGED OUT)                              */}
        {/* ========================================================= */}
        {!currentUser && (
          <div className="max-w-md mx-auto my-4 space-y-6">
            
            <div className={`${cardBg} rounded-2xl shadow-xl border overflow-hidden`}>
              <div className="bg-slate-900 p-6 text-white text-center space-y-2">
                <div className="inline-flex items-center space-x-1.5 bg-sky-900 border border-sky-700 text-sky-200 text-xs px-3 py-1 rounded-full font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sutra Secure Auth Engine</span>
                </div>
                <h2 className="text-xl font-extrabold">Welcome to SutraAI</h2>
                <p className="text-xs text-slate-300">Adaptive Multi-Subject Platform for Classes 6–10</p>
              </div>

              <div className={`p-2 flex border-b ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => { setAuthRoleTab('student'); setAuthError(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 ${
                    authRoleTab === 'student' ? 'bg-sky-600 text-white shadow-sm' : mutedText
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Student Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setAuthRoleTab('teacher'); setAuthError(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 ${
                    authRoleTab === 'teacher' ? 'bg-sky-600 text-white shadow-sm' : mutedText
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Teacher Login</span>
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
                {authError && (
                  <div className="p-3 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div>
                  <label className={`block text-xs font-extrabold uppercase tracking-wider mb-1.5 ${mutedText}`}>
                    {authRoleTab === 'student' ? 'Roll Number' : 'Teacher ID'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder={authRoleTab === 'student' ? 'e.g. STU001, STU002, STU003' : 'e.g. T001, T002'}
                      value={loginInputId}
                      onChange={(e) => setLoginInputId(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 text-xs font-bold border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-extrabold uppercase tracking-wider mb-1.5 ${mutedText}`}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="password123"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 text-xs font-bold border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <span>Sign In as {authRoleTab === 'student' ? 'Student' : 'Teacher'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Quick Fill Demo Credentials */}
            <div className={`${cardBg} rounded-2xl p-5 shadow-sm border space-y-3`}>
              <div className="text-xs font-extrabold flex items-center space-x-1.5">
                <Key className="w-4 h-4 text-amber-500" />
                <span>Quick Fill Demo Credentials (Password: password123)</span>
              </div>

              <div className="space-y-2">
                <div className={`text-[11px] font-bold uppercase tracking-wider ${mutedText}`}>Demo Students (Class 6, 8, 10):</div>
                <div className="grid grid-cols-3 gap-2">
                  {studentsRoster.slice(0, 3).map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleQuickFillStudent(st)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isDarkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-sky-50 hover:bg-sky-100 border-sky-200'
                      }`}
                    >
                      <div className="font-extrabold text-xs text-sky-500">{st.roll_no}</div>
                      <div className="text-[11px] font-bold truncate">{st.name.split(' ')[0]}</div>
                      <div className={`text-[10px] font-semibold ${mutedText}`}>{st.class_group}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className={`text-[11px] font-bold uppercase tracking-wider ${mutedText}`}>Demo Teachers:</div>
                <div className="grid grid-cols-2 gap-2">
                  {SEEDED_TEACHERS.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleQuickFillTeacher(t)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isDarkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-purple-50 hover:bg-purple-100 border-purple-200'
                      }`}
                    >
                      <div className="font-extrabold text-xs text-purple-500">{t.teacher_id}</div>
                      <div className="text-[11px] font-bold truncate">{t.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* LOGGED-IN NAVIGATION BAR & FOCUS MODE BANNERS             */}
        {/* ========================================================= */}
        {currentUser && (
          <div className="space-y-6">
            
            {/* Main Navigation Bar with Back Button */}
            <div className={`${cardBg} rounded-2xl p-2.5 shadow-sm border flex flex-wrap items-center justify-between gap-2`}>
              <div className="flex flex-wrap items-center gap-1.5">
                
                {/* Back Button */}
                <button
                  onClick={handleBack}
                  disabled={tabHistory.length === 0}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1 border ${
                    tabHistory.length === 0
                      ? 'opacity-40 cursor-not-allowed border-transparent'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                  }`}
                  title="Go back to previous view"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                {currentUser.role === 'student' ? (
                  <>
                    <button
                      onClick={() => setActiveTab('home')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                        activeTab === 'home' ? 'bg-sky-600 text-white shadow-sm' : `${mutedText} hover:bg-slate-200/50`
                      }`}
                    >
                      <Star className="w-4 h-4" />
                      <span>Home</span>
                    </button>

                    <button
                      onClick={() => startLessonWithFocus(activeSubject, activeChapter, 'learn')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                        activeTab === 'learn' ? 'bg-sky-600 text-white shadow-sm' : `${mutedText} hover:bg-slate-200/50`
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>1. Vernacular Learn</span>
                    </button>

                    <button
                      onClick={() => startLessonWithFocus(activeSubject, activeChapter, 'solve')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                        activeTab === 'solve' ? 'bg-sky-600 text-white shadow-sm' : `${mutedText} hover:bg-slate-200/50`
                      }`}
                    >
                      <Brain className="w-4 h-4" />
                      <span>2. DDA Solve</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('test')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                        activeTab === 'test' ? 'bg-sky-600 text-white shadow-sm' : `${mutedText} hover:bg-slate-200/50`
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>3. Mind Maps (KG)</span>
                    </button>

                    {/* Badges & Rewards tabs shown ONLY for Class 6 and Class 7 students */}
                    {(currentUser.class_group === 'Class 6' || currentUser.class_group === 'Class 7') && (
                      <>
                        <button
                          onClick={() => setActiveTab('badges')}
                          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                            activeTab === 'badges' ? 'bg-sky-600 text-white shadow-sm' : `${mutedText} hover:bg-slate-200/50`
                          }`}
                        >
                          <Medal className="w-4 h-4" />
                          <span>Badges</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('rewards')}
                          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                            activeTab === 'rewards' ? 'bg-amber-600 text-white shadow-sm' : `${mutedText} hover:bg-slate-200/50`
                          }`}
                        >
                          <Gift className="w-4 h-4" />
                          <span>Rewards</span>
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                        activeTab === 'dashboard' ? 'bg-sky-600 text-white shadow-sm' : `${mutedText} hover:bg-slate-200/50`
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Classroom Heatmap & Leaderboard</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('manage')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                        activeTab === 'manage' ? 'bg-sky-600 text-white shadow-sm' : `${mutedText} hover:bg-slate-200/50`
                      }`}
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Manage Students ({studentsRoster.length})</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('schema')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                        activeTab === 'schema' ? 'bg-purple-600 text-white shadow-sm' : `${mutedText} hover:bg-slate-200/50`
                      }`}
                    >
                      <Database className="w-4 h-4" />
                      <span>Supabase Schema</span>
                    </button>
                  </>
                )}
              </div>

              <div className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${subCardBg}`}>
                <span>{currentUser.name}</span>
                <span className="mx-1.5">•</span>
                <span className="text-sky-500 font-extrabold">{currentUser.class_group}</span>
              </div>
            </div>

            {/* --- FOCUS MODE LESSON BAR & NON-BLOCKING VIOLATION NOTICE (Neutral colors, >=16px text) --- */}
            {isFocusActiveForStudent && (
              <div className="space-y-3">
                {/* Top Lesson Counter Bar */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}>
                  <div className="flex items-center space-x-3">
                    <Maximize className="w-5 h-5 text-sky-500 flex-shrink-0" />
                    <span className="text-base sm:text-lg font-bold">
                      Focus Mode is on. Let's learn together!
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className={`px-4 py-2 rounded-xl font-extrabold text-base border ${
                      isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                    }`}>
                      Violations today: {sessionViolationsCount}
                    </div>

                    <button
                      type="button"
                      onClick={requestLessonFullscreen}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-base transition-all shadow-sm"
                    >
                      Full-Screen
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowStretchBreakModal(true)}
                      className={`px-3 py-2 rounded-xl font-bold text-sm border ${
                        isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                      }`}
                      title="Preview 15-Minute Stretch Break"
                    >
                      15m Break Preview
                    </button>
                  </div>
                </div>

                {/* Neutral Non-Blocking Violation Notice (Never locks screen!) */}
                {showViolationBanner && (
                  <div className={`p-5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md ${
                    isDarkMode ? 'bg-slate-800 border-slate-500 text-slate-100' : 'bg-slate-200 border-slate-400 text-slate-900'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <EyeOff className="w-6 h-6 text-slate-600 dark:text-slate-300 flex-shrink-0" />
                      <span className="text-base sm:text-lg font-extrabold">
                        Violation {sessionViolationsCount} recorded. Return to your lesson.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleReturnToLesson}
                      className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-base shadow-md transition-all self-start sm:self-auto"
                    >
                      Return to lesson
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* STUDENT TAB 0: HOME (SUBJECTS, POINTS & STAR OF CLASS)    */}
            {/* ========================================================= */}
            {currentUser.role === 'student' && activeTab === 'home' && (
              <div className="space-y-6">
                
                {/* Total Points Banner with Coin Icon (For Class 6 and Class 7) */}
                {(currentUser.class_group === 'Class 6' || currentUser.class_group === 'Class 7') && (
                  <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-xs">
                        <Coins className="w-8 h-8 text-yellow-100" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold uppercase tracking-wider text-amber-100">Rewards Wallet • {currentUser.class_group}</div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold">{currentUserPoints} Total Points</h2>
                        <p className="text-xs text-amber-100 mt-0.5">+10 pts per correct answer • +2 pts per attempt • +50 pts per completed chapter</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setActiveTab('badges')}
                        className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-extrabold text-xs transition-all"
                      >
                        View Badges ({earnedBadges.filter(b => b.user_id === currentUser.id).length})
                      </button>
                      <button
                        onClick={() => setActiveTab('rewards')}
                        className="px-5 py-2.5 bg-white text-orange-700 hover:bg-orange-50 rounded-xl font-extrabold text-xs shadow-md transition-all"
                      >
                        Redeem Points
                      </button>
                    </div>
                  </div>
                )}

                {/* Star of the Class Card (Shown for Classes 6, 7, and 8) */}
                {['Class 6', 'Class 7', 'Class 8'].includes(currentUser.class_group) && (
                  <div className={`${cardBg} rounded-2xl p-6 shadow-sm border space-y-4`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-200 dark:border-slate-700">
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <h3 className="text-lg font-extrabold">Star of the Class • {currentUser.class_group}</h3>
                      </div>
                      <span className={`text-xs font-bold ${mutedText}`}>
                        Weekly Ranking (Monday – Sunday • Resets every Monday • Min 20 Qs)
                      </span>
                    </div>

                    {(() => {
                      const leaderboard = getClassLeaderboard(currentUser.class_group);
                      const starStudent = leaderboard[0];

                      if (!starStudent) {
                        return (
                          <div className="py-6 text-center text-sm font-semibold text-slate-500">
                            No student has answered 20 questions yet this week. Practice now to claim the Star badge!
                          </div>
                        );
                      }

                      const isMe = starStudent.id === currentUser.id;
                      const accuracy = Math.round((starStudent.weeklyStats.correct / starStudent.weeklyStats.total_answered) * 100);
                      const totalCheers = starCheers[starStudent.id] || 0;

                      return (
                        <div className={`p-5 rounded-2xl border-2 flex flex-col md:flex-row items-center justify-between gap-6 ${
                          isDarkMode ? 'bg-slate-800/90 border-amber-500/60' : 'bg-amber-50/70 border-amber-300'
                        }`}>
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-extrabold text-2xl shadow-md">
                                {starStudent.display_name.charAt(0)}
                              </div>
                              <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-1 rounded-full shadow">
                                <Star className="w-4 h-4 fill-white" />
                              </div>
                            </div>
                            <div>
                              <div className="inline-flex items-center space-x-1 bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-extrabold px-2.5 py-0.5 rounded-full mb-1">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span>Star Badge Winner</span>
                              </div>
                              <h4 className="text-xl font-extrabold">{starStudent.display_name}</h4>
                              <p className={`text-xs font-bold mt-0.5 ${mutedText}`}>
                                Weekly Accuracy: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{accuracy}%</span> ({starStudent.weeklyStats.correct}/{starStudent.weeklyStats.total_answered} correct)
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-center sm:items-end space-y-2">
                            {isMe ? (
                              <div className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs sm:text-sm flex items-center space-x-2 shadow-sm">
                                <Heart className="w-4 h-4 fill-white" />
                                <span>Your classmates are cheering for you! ({totalCheers} Cheers)</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleCheerStar(starStudent.id)}
                                disabled={Boolean(cheersGiven[currentUser.id])}
                                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center space-x-2 transition-all shadow-md ${
                                  cheersGiven[currentUser.id]
                                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-not-allowed'
                                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950 hover:scale-105'
                                } ${cheerAnim ? 'scale-110 ring-4 ring-amber-300' : ''}`}
                              >
                                <ThumbsUp className="w-4 h-4" />
                                <span>{cheersGiven[currentUser.id] ? 'Cheer Sent!' : 'Cheer'}</span>
                                <span className="bg-slate-900/20 px-2 py-0.5 rounded-full text-xs">{totalCheers}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Teacher Appreciation Note if present */}
                    {(() => {
                      const starStudent = getClassLeaderboard(currentUser.class_group)[0];
                      if (starStudent && appreciationNotes[starStudent.id]) {
                        return (
                          <div className={`p-3.5 rounded-xl border flex items-start space-x-3 ${
                            isDarkMode ? 'bg-sky-950/60 border-sky-800 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-950'
                          }`}>
                            <Award className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <span className="font-extrabold">Teacher Appreciation for {starStudent.display_name}: </span>
                              <span className="italic">"{appreciationNotes[starStudent.id]}"</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Past Stars History List */}
                    <div className="pt-2">
                      <div className={`text-xs font-extrabold uppercase tracking-wider mb-2 ${mutedText}`}>Past Weekly Stars History:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(PAST_STARS_HISTORY[currentUser.class_group] || []).map((h, i) => (
                          <div key={i} className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${subCardBg}`}>
                            <span className="font-semibold">{h.week}</span>
                            <span className="font-extrabold text-amber-600 dark:text-amber-400">{h.display_name} ({h.accuracy}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Subject Cards Grid & Sequential Chapter List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-extrabold flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-sky-500" />
                    <span>My Subjects • {currentUser.class_group}</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {SUBJECTS.map(subj => {
                      const chapters = SYLLABUS[currentUser.class_group]?.[subj] || [];
                      if (chapters.length === 0) return null;
                      const unlockKey = `${currentUser.id}_${subj}`;
                      const unlockedIdx = unlockedChaptersMap[unlockKey] ?? 0;
                      const completedCount = Math.min(chapters.length, unlockedIdx + (earnedBadges.some(b => b.user_id === currentUser.id && b.subject === subj) ? 1 : 0));
                      const progressPct = getDeterministicScore(`${currentUser.id}_${subj}`);
                      const isSelected = activeSubject === subj;

                      return (
                        <div
                          key={subj}
                          onClick={() => {
                            setActiveSubject(subj);
                            setActiveChapter(chapters[0]);
                          }}
                          className={`${cardBg} p-5 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md ${
                            isSelected ? 'border-sky-500 ring-2 ring-sky-500/20' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-sky-500">{currentUser.class_group}</span>
                            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                              {progressPct}% Mastery
                            </span>
                          </div>
                          <h4 className="font-extrabold text-base mb-1">{subj}</h4>
                          <p className={`text-xs font-semibold mb-3 ${mutedText}`}>
                            {completedCount} / {chapters.length} Chapters Completed
                          </p>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-sky-500 h-full rounded-full" style={{ width: `${progressPct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chapters for Selected Subject (Sequential Unlocking) */}
                  <div className={`${cardBg} rounded-2xl p-6 border shadow-sm space-y-4`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-200 dark:border-slate-700">
                      <div>
                        <h4 className="font-extrabold text-base">{activeSubject} Chapters ({currentUser.class_group})</h4>
                        <p className={`text-xs ${mutedText}`}>Chapters unlock in order. Complete a chapter (95% mastery or 3/5 questions correct) to unlock the next!</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(SYLLABUS[currentUser.class_group]?.[activeSubject] || []).map((chap, idx) => {
                        const unlockKey = `${currentUser.id}_${activeSubject}`;
                        const maxUnlocked = unlockedChaptersMap[unlockKey] ?? 1;
                        const isUnlocked = idx <= maxUnlocked;
                        const isBadgeEarned = earnedBadges.some(b => b.user_id === currentUser.id && b.chapter === chap);
                        const masteryScore = isBadgeEarned ? 96 : getDeterministicScore(`${currentUser.id}_${chap}`);

                        return (
                          <div
                            key={chap}
                            className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                              isUnlocked ? subCardBg : 'opacity-60 bg-slate-200/50 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-sky-500/20 text-sky-600 dark:text-sky-300">
                                  Ch {idx + 1}
                                </span>
                                <span className="font-extrabold text-sm">{chap}</span>
                              </div>
                              <div className={`text-xs font-semibold ${mutedText}`}>
                                {idx > 0 ? `Prerequisite: ${SYLLABUS[currentUser.class_group][activeSubject][idx - 1]}` : 'Foundational Chapter'} • Mastery: {masteryScore}%
                              </div>
                            </div>

                            {isUnlocked ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => startLessonWithFocus(activeSubject, chap, 'learn')}
                                  className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-extrabold rounded-xl transition-all"
                                >
                                  Learn
                                </button>
                                <button
                                  onClick={() => startLessonWithFocus(activeSubject, chap, 'solve')}
                                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center space-x-1"
                                >
                                  <span>Solve</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-xs font-bold text-slate-500">
                                <Lock className="w-4 h-4" />
                                <span>Locked</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* STUDENT TAB 1: VERNACULAR LEARN                           */}
            {/* ========================================================= */}
            {currentUser.role === 'student' && activeTab === 'learn' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className={`lg:col-span-2 ${cardBg} rounded-2xl p-6 shadow-sm border space-y-6`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md">
                        {currentUser.class_group} • {activeSubject} • {activeChapter}
                      </span>
                      <h2 className="text-2xl font-extrabold mt-2">{currentLessonText.title}</h2>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="relative flex items-center">
                        <Globe className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                        <select
                          value={selectedLang}
                          onChange={(e) => setSelectedLang(e.target.value)}
                          className={`pl-9 pr-8 py-2 text-xs font-extrabold border rounded-xl cursor-pointer ${
                            isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="en">English</option>
                          <option value="hi">हिंदी (Hindi)</option>
                          <option value="te">తెలుగు (Telugu)</option>
                        </select>
                      </div>

                      <button
                        onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                        className={`py-2 px-3 rounded-xl border transition-all flex items-center space-x-1.5 text-xs font-extrabold ${
                          isPlayingAudio 
                            ? 'bg-sky-600 text-white border-sky-600 shadow-md' 
                            : subCardBg
                        }`}
                      >
                        {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{isPlayingAudio ? 'Pause' : 'Listen'}</span>
                      </button>

                      {isPlayingAudio && (
                        <select
                          value={playbackSpeed}
                          onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                          className="py-2 px-2 text-xs font-extrabold bg-sky-100 text-sky-900 rounded-xl border border-sky-300"
                        >
                          <option value="1">1.0x</option>
                          <option value="1.25">1.25x</option>
                          <option value="1.5">1.5x</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {isPlayingAudio && (
                    <div className="p-3.5 bg-sky-500/10 border border-sky-500/30 rounded-xl text-xs flex items-start space-x-2">
                      <Volume2 className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0 animate-bounce" />
                      <div>
                        <span className="font-extrabold">Audio Transcript ({playbackSpeed}x): </span>
                        <span>"{currentLessonText.audioTranscript}"</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border ${subCardBg}`}>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-500 mb-1">Core Concept Breakdown: {activeChapter}</h3>
                      <p className="text-sm leading-relaxed font-medium">{currentLessonText.concept}</p>
                      <div className="mt-3 inline-block bg-slate-900 text-sky-300 px-3.5 py-1.5 rounded-lg font-mono text-sm font-bold">
                        {currentLessonText.formula}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-amber-950/40 border-amber-800 text-amber-100' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
                      <div className="flex items-center space-x-2 font-extrabold text-xs uppercase tracking-wider mb-1">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <span>{currentLessonText.contextTitle}</span>
                      </div>
                      <p className="text-sm">{currentLessonText.realWorld}</p>
                      <div className="mt-2 text-xs font-mono font-extrabold p-2.5 rounded-lg bg-amber-500/20">
                        {currentLessonText.mathSolution}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold mb-3">Key Rules to Remember:</h4>
                      <ul className="space-y-2">
                        {currentLessonText.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start space-x-2.5 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <button
                      onClick={() => setActiveTab('solve')}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2 text-sm"
                    >
                      <span>Proceed to Timed DDA Practice</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-slate-900 to-sky-950 rounded-2xl p-5 text-white shadow-md">
                    <div className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider mb-1">Offline Cache Engine</div>
                    <h4 className="font-extrabold text-base mb-1.5">Local Micro-Lesson Storage</h4>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      All vernacular text and audio scripts are cached in local storage for zero-data offline learning.
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-emerald-300 font-bold bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{currentUser.class_group} {activeSubject} Cached</span>
                    </div>
                  </div>

                  <div className={`${cardBg} rounded-2xl p-5 shadow-sm border space-y-3`}>
                    <h4 className="font-extrabold text-sm flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-sky-500" />
                      <span>Quick Reference Cheatsheet</span>
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className={`p-2.5 rounded-lg border ${subCardBg}`}>
                        <div className="font-mono font-bold">Addition ➔ Subtraction</div>
                        <div className={`text-[11px] ${mutedText}`}>x + a = b ➔ x = b - a</div>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${subCardBg}`}>
                        <div className="font-mono font-bold">Multiplication ➔ Division</div>
                        <div className={`text-[11px] ${mutedText}`}>ax = b ➔ x = b / a</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* STUDENT TAB 2: DDA ADAPTIVE SOLVE WITH COUNTDOWN TIMER    */}
            {/* ========================================================= */}
            {currentUser.role === 'student' && activeTab === 'solve' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className={`lg:col-span-2 ${cardBg} rounded-2xl p-6 shadow-sm border space-y-6`}>
                  
                  {/* Chapter & Difficulty Level Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-sky-500">
                          {activeSubject} • {activeChapter}
                        </span>
                        <span className="text-xs bg-sky-500/20 text-sky-600 dark:text-sky-300 font-extrabold px-2 py-0.5 rounded-full">
                          +{activeQuestion.xp} XP
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold mt-1">{activeQuestion.levelLabel}</h3>
                    </div>

                    <div className="flex items-center space-x-2">
                      {[1, 2, 3].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => {
                            setCurrentLevel(lvl);
                            setSelectedOption(null);
                            setAnswerSubmitted(false);
                            setIsTimedOut(false);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                            currentLevel === lvl
                              ? 'bg-sky-600 text-white shadow-md'
                              : currentLevel > lvl
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                              : subCardBg
                          }`}
                        >
                          Lvl {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Circular Countdown Timer Above Question (360px friendly, never covers text) */}
                  {(() => {
                    const radius = 24;
                    const circumference = 2 * Math.PI * radius;
                    const dashOffset = totalTimeForQuestion > 0
                      ? circumference - (timeLeft / totalTimeForQuestion) * circumference
                      : 0;

                    let timerStroke = "stroke-sky-500";
                    let timerText = "text-sky-600 dark:text-sky-400";
                    if (timeLeft <= 5) {
                      timerStroke = "stroke-rose-600";
                      timerText = "text-rose-600 dark:text-rose-400 animate-pulse";
                    } else if (timeLeft <= 10) {
                      timerStroke = "stroke-amber-500";
                      timerText = "text-amber-600 dark:text-amber-400";
                    }

                    return (
                      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 ${subCardBg}`}>
                        <div className="flex items-center space-x-3 sm:border-r sm:pr-4 border-slate-300 dark:border-slate-700 flex-shrink-0">
                          <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg className="transform -rotate-90 w-16 h-16">
                              <circle
                                cx="32"
                                cy="32"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="5"
                                fill="transparent"
                                className="text-slate-300 dark:text-slate-700"
                              />
                              <circle
                                cx="32"
                                cy="32"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="5"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                className={`${timerStroke} transition-all duration-700 ease-linear`}
                              />
                            </svg>
                            <span className={`absolute font-extrabold text-sm ${timerText}`}>
                              {timeLeft}s
                            </span>
                          </div>
                          <div className="sm:hidden text-xs font-bold">
                            <div>Time Limit: {totalTimeForQuestion}s</div>
                            <div className={mutedText}>{(currentUser.class_group === 'Class 6' || currentUser.class_group === 'Class 7') ? 'Includes +15s bonus' : 'Standard timer'}</div>
                          </div>
                        </div>

                        <div className="w-full font-bold text-base leading-relaxed">
                          {activeQuestion.question}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 4 Distinct Multiple Choice Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeQuestion.options.map((option, idx) => {
                      let btnStyle = isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-100 hover:border-sky-500'
                        : 'bg-white border-slate-300 text-slate-900 hover:border-sky-500 hover:bg-sky-50/50';
                      
                      if (answerSubmitted) {
                        if (idx === activeQuestion.correctIndex) {
                          btnStyle = 'bg-emerald-600 border-emerald-500 text-white font-extrabold';
                        } else if (idx === selectedOption) {
                          btnStyle = 'bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-200 font-bold';
                        } else {
                          btnStyle = 'opacity-50 border-slate-300 dark:border-slate-700';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={answerSubmitted}
                          onClick={() => handleAnswerSubmit(idx)}
                          className={`p-4 rounded-xl border-2 text-left font-bold text-sm transition-all flex items-center justify-between shadow-2xs ${btnStyle}`}
                        >
                          <span>{option}</span>
                          {answerSubmitted && idx === activeQuestion.correctIndex && (
                            <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Cards */}
                  {answerSubmitted && (
                    <div className="space-y-3">
                      {isTimedOut ? (
                        <div className="p-4 rounded-xl bg-amber-500/15 border-2 border-amber-500 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 font-extrabold text-sm text-amber-600 dark:text-amber-300">
                              <Clock className="w-4 h-4" />
                              <span>Time's up! Auto-loading next question in 3 seconds...</span>
                            </div>
                          </div>
                          <div className="text-xs space-y-1">
                            <div><strong className="font-extrabold text-emerald-600 dark:text-emerald-400">Correct Answer:</strong> {activeQuestion.options[activeQuestion.correctIndex]}</div>
                            <div><strong className="font-extrabold">Explanation:</strong> {activeQuestion.explanation}</div>
                          </div>
                        </div>
                      ) : selectedOption === activeQuestion.correctIndex ? (
                        <div className="p-4 rounded-xl bg-emerald-500/15 border-2 border-emerald-500 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 font-extrabold text-base text-emerald-600 dark:text-emerald-300">
                              <Sparkles className="w-5 h-5" />
                              <span>{currentFeedbackMsg}</span>
                            </div>
                            <span className="bg-emerald-600 text-white font-extrabold text-xs px-3 py-1 rounded-full">
                              +10 Points & +{activeQuestion.xp} XP
                            </span>
                          </div>
                          <div className="text-xs pt-1 border-t border-emerald-500/30">
                            <strong>Explanation:</strong> {activeQuestion.explanation}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-amber-500/15 border-2 border-amber-500 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 font-extrabold text-sm text-amber-600 dark:text-amber-300">
                              <Lightbulb className="w-4 h-4" />
                              <span>{currentFeedbackMsg}</span>
                            </div>
                            <span className="bg-amber-600 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full">
                              +2 Attempt Points
                            </span>
                          </div>
                          <div className="text-xs space-y-1 pt-1 border-t border-amber-500/30">
                            <div><strong className="text-emerald-600 dark:text-emerald-400">Correct Answer:</strong> {activeQuestion.options[activeQuestion.correctIndex]}</div>
                            <div><strong>Explanation:</strong> {activeQuestion.explanation}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Controls: Hint, Scratchpad, Next Question */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowHintDrawer(!showHintDrawer)}
                        className="text-xs font-extrabold text-sky-600 dark:text-sky-300 bg-sky-500/15 px-3 py-2 rounded-xl border border-sky-500/30 flex items-center space-x-1"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Need Help? Hint</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowScratchpad(!showScratchpad)}
                        className={`text-xs font-extrabold px-3 py-2 rounded-xl border flex items-center space-x-1 ${subCardBg}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Scratchpad</span>
                      </button>
                    </div>

                    {answerSubmitted && (
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 shadow-md"
                      >
                        <span>Next Question</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {showHintDrawer && (
                    <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs space-y-1">
                      <div className="font-extrabold text-sky-500">1-Minute Concept Hint:</div>
                      <p>{activeQuestion.hint}</p>
                      <div className={`text-[11px] font-bold ${mutedText}`}>Prerequisite: {activeQuestion.prerequisite}</div>
                    </div>
                  )}

                  {showScratchpad && (
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2">
                      <div className="text-xs font-bold text-slate-400 flex justify-between items-center">
                        <span>Rough Work Scratchpad</span>
                        <button onClick={() => setScratchpadNote('')} className="text-xs text-rose-400 hover:underline">Clear</button>
                      </div>
                      <textarea
                        value={scratchpadNote}
                        onChange={(e) => setScratchpadNote(e.target.value)}
                        placeholder="Write steps and calculations here..."
                        rows={3}
                        className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-lg text-xs font-mono focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Right Column: DDA Streak & Chapter Progress */}
                <div className="space-y-6">
                  <div className={`${cardBg} rounded-2xl p-5 shadow-sm border space-y-4`}>
                    <h3 className="font-extrabold text-sm flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-sky-500" />
                      <span>DDA Streak & Chapter Progress</span>
                    </h3>

                    <div className={`p-3.5 rounded-xl border space-y-2 ${subCardBg}`}>
                      <div className="text-xs font-bold">Consecutive Correct for Level Up:</div>
                      <div className="flex items-center space-x-2">
                        {[1, 2].map(step => (
                          <div
                            key={step}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs ${
                              consecutiveCorrectCount >= step ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {step}
                          </div>
                        ))}
                        <span className="text-xs font-bold">{consecutiveCorrectCount} / 2 Correct</span>
                      </div>
                    </div>

                    {(() => {
                      const tracker = chapterAttemptTracker[`${currentUser.id}_${activeChapter}`] || { count: 0, correct: 0 };
                      return (
                        <div className={`p-3.5 rounded-xl border space-y-2 ${subCardBg}`}>
                          <div className="text-xs font-extrabold">Current Chapter Badge Progress:</div>
                          <div className="text-xs">
                            Answered: <strong>{tracker.count} / 5</strong> • Correct: <strong className="text-emerald-500">{tracker.correct}</strong> (Need 3/5)
                          </div>
                          <div className="w-full bg-slate-300 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(tracker.count / 5) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* STUDENT TAB 3: CHAPTER-WISE MIND MAPS (KG TAB)            */}
            {/* ========================================================= */}
            {currentUser.role === 'student' && activeTab === 'test' && (
              <div className={`${cardBg} rounded-2xl p-6 shadow-sm border space-y-6`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-700">
                  <div>
                    <h2 className="text-xl font-extrabold flex items-center space-x-2">
                      <Layers className="w-5 h-5 text-sky-500" />
                      <span>Subject & Chapter-Wise Interactive Mind Maps • {currentUser.class_group}</span>
                    </h2>
                    <p className={`text-xs mt-1 ${mutedText}`}>
                      Click any chapter node in the mind map tree to jump directly into adaptive practice for that chapter.
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 text-xs font-bold">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span>Mastered (&ge;80%)</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span>Developing (60–79%)</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <span>Needs Focus (&lt;60%)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {SUBJECTS.map(subj => {
                    const chapters = SYLLABUS[currentUser.class_group]?.[subj] || [];
                    if (chapters.length === 0) return null;

                    return (
                      <div key={subj} className={`p-5 rounded-2xl border overflow-x-auto ${subCardBg}`}>
                        <div className="flex items-center space-x-2 mb-4">
                          <div className="px-3 py-1 rounded-lg bg-sky-600 text-white font-extrabold text-xs uppercase tracking-wider">
                            {subj}
                          </div>
                          <span className={`text-xs font-bold ${mutedText}`}>
                            {currentUser.class_group} Sequential Concept Tree ({chapters.length} Chapters)
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 min-w-max py-2">
                          {/* Root Subject Node */}
                          <div className="px-4 py-3 rounded-2xl bg-slate-900 text-white font-extrabold text-xs shadow-md border border-slate-700 flex-shrink-0">
                            {subj}
                          </div>

                          {chapters.map((chap, idx) => {
                            const score = earnedBadges.some(b => b.user_id === currentUser.id && b.chapter === chap)
                              ? 96
                              : getDeterministicScore(`${currentUser.id}_${subj}_${chap}`);

                            let borderCol = 'border-emerald-500 bg-emerald-500/10';
                            let pillCol = 'bg-emerald-600 text-white';
                            if (score < 60) {
                              borderCol = 'border-rose-500 bg-rose-500/10';
                              pillCol = 'bg-rose-600 text-white';
                            } else if (score < 80) {
                              borderCol = 'border-amber-500 bg-amber-500/10';
                              pillCol = 'bg-amber-600 text-white';
                            }

                            return (
                              <React.Fragment key={chap}>
                                <ArrowRight className="w-5 h-5 text-sky-500 flex-shrink-0" />
                                <div
                                  onClick={() => startLessonWithFocus(subj, chap, 'solve')}
                                  className={`w-56 p-3.5 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 shadow-xs flex-shrink-0 ${borderCol}`}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                                      Chapter {idx + 1}
                                    </span>
                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${pillCol}`}>
                                      {score}%
                                    </span>
                                  </div>
                                  <div className="font-extrabold text-xs line-clamp-2 min-h-[2rem]">
                                    {chap}
                                  </div>
                                  <div className="mt-2 pt-1.5 border-t border-slate-400/20 flex items-center justify-between text-[11px] font-bold text-sky-500">
                                    <span>Practice Node</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* STUDENT TAB 4: BADGES PAGE (CLASS 6 & 7 ONLY)             */}
            {/* ========================================================= */}
            {currentUser.role === 'student' && activeTab === 'badges' && (currentUser.class_group === 'Class 6' || currentUser.class_group === 'Class 7') && (
              <div className={`${cardBg} rounded-2xl p-6 shadow-sm border space-y-6`}>
                <div className="border-b pb-4 border-slate-200 dark:border-slate-700">
                  <h2 className="text-xl font-extrabold flex items-center space-x-2">
                    <Medal className="w-6 h-6 text-amber-500" />
                    <span>Chapter Champion Badges • {currentUser.class_group}</span>
                  </h2>
                  <p className={`text-xs mt-1 ${mutedText}`}>
                    Answer 5 questions in a chapter with at least 3 correct to earn its Champion Badge and +50 bonus points! Earned badges shine in color; locked badges are shown in grey.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {SUBJECTS.flatMap(subj =>
                    (SYLLABUS[currentUser.class_group]?.[subj] || []).map(chap => ({ subj, chap }))
                  ).map(({ subj, chap }) => {
                    const isEarned = earnedBadges.some(b => b.user_id === currentUser.id && b.chapter === chap);
                    return (
                      <div
                        key={`${subj}_${chap}`}
                        className={`p-5 rounded-2xl border-2 text-center transition-all flex flex-col justify-between ${
                          isEarned
                            ? 'border-amber-400 bg-gradient-to-b from-amber-500/15 to-sky-500/10 shadow-md'
                            : 'border-slate-300 dark:border-slate-700 bg-slate-200/50 dark:bg-slate-800/40 grayscale opacity-65'
                        }`}
                      >
                        <div>
                          <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 shadow ${
                            isEarned ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950' : 'bg-slate-400 text-slate-700'
                          }`}>
                            <Medal className="w-7 h-7" />
                          </div>
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-500">{subj}</div>
                          <h4 className="font-extrabold text-sm mt-1">{chap} Champion</h4>
                        </div>

                        <div className="mt-4 pt-2 border-t border-slate-300 dark:border-slate-700">
                          {isEarned ? (
                            <span className="inline-flex items-center space-x-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Earned (+50 pts)</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => startLessonWithFocus(subj, chap, 'solve')}
                              className="text-xs font-extrabold text-sky-600 dark:text-sky-400 hover:underline"
                            >
                              Locked • Practice Now ➔
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* STUDENT TAB 5: REWARDS STORE (CLASS 6 & 7 ONLY)           */}
            {/* ========================================================= */}
            {currentUser.role === 'student' && activeTab === 'rewards' && (currentUser.class_group === 'Class 6' || currentUser.class_group === 'Class 7') && (
              <div className={`${cardBg} rounded-2xl p-6 shadow-sm border space-y-6`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-700">
                  <div>
                    <h2 className="text-xl font-extrabold flex items-center space-x-2">
                      <Gift className="w-6 h-6 text-amber-500" />
                      <span>Student Rewards Store • {currentUser.class_group}</span>
                    </h2>
                    <p className={`text-xs mt-1 ${mutedText}`}>
                      Redeem your earned points for exclusive items! Each reward can be redeemed once.
                    </p>
                  </div>

                  <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center space-x-2">
                    <Coins className="w-5 h-5 text-amber-500" />
                    <span className="font-extrabold text-sm">{currentUserPoints} Points Available</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {REWARDS_STORE.map(reward => {
                    const isRedeemed = redemptions.some(r => r.user_id === currentUser.id && r.reward_id === reward.id);
                    const canAfford = currentUserPoints >= reward.cost;
                    const IconComponent = reward.icon;

                    return (
                      <div key={reward.id} className={`p-5 rounded-2xl border-2 flex flex-col justify-between text-center ${subCardBg}`}>
                        <div>
                          <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 ${
                            isRedeemed ? 'bg-emerald-600 text-white' : 'bg-sky-500/20 text-sky-500'
                          }`}>
                            <IconComponent className="w-7 h-7" />
                          </div>
                          <h4 className="font-extrabold text-base">{reward.name}</h4>
                          <div className="text-xs font-extrabold text-amber-500 my-2">{reward.cost} Points</div>
                        </div>

                        <button
                          type="button"
                          disabled={isRedeemed || !canAfford}
                          onClick={() => handleRedeemReward(reward)}
                          className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                            isRedeemed
                              ? 'bg-emerald-600 text-white cursor-not-allowed'
                              : canAfford
                              ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-md'
                              : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isRedeemed ? 'Redeemed' : canAfford ? 'Redeem Now' : `Need ${reward.cost - currentUserPoints} more pts`}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Points Ledger History Table */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-extrabold mb-3">Recent Points Ledger (`points_ledger`)</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pointsLedger.filter(l => l.user_id === currentUser.id).map(entry => (
                      <div key={entry.id} className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${subCardBg}`}>
                        <span className="font-bold">{entry.reason}</span>
                        <span className={`font-extrabold ${entry.points >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {entry.points >= 0 ? `+${entry.points}` : entry.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TEACHER TAB 1: DASHBOARD, HEATMAP, STAR & FOCUS PANEL     */}
            {/* ========================================================= */}
            {currentUser.role === 'teacher' && activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Command Center Header with Class & Subject Dropdowns */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-extrabold text-sky-400 uppercase tracking-wider">Teacher Command Center</span>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <h1 className="text-xl sm:text-2xl font-extrabold">Classroom Analytics:</h1>
                      <select
                        value={dashboardClass}
                        onChange={(e) => setDashboardClass(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm font-extrabold rounded-xl px-3 py-2"
                      >
                        {Object.keys(SYLLABUS).map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>

                      <select
                        value={dashboardSubject}
                        onChange={(e) => setDashboardSubject(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-sky-300 text-xs sm:text-sm font-extrabold rounded-xl px-3 py-2"
                      >
                        {SUBJECTS.map(subj => (
                          <option key={subj} value={subj}>{subj}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateRemediation}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center space-x-2 text-xs sm:text-sm self-start lg:self-auto"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate 5-Min Remedial Plan</span>
                  </button>
                </div>

                {/* 4 Summary Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`${cardBg} p-5 rounded-2xl border shadow-2xs`}>
                    <div className={`text-xs font-bold ${mutedText}`}>Enrolled in {dashboardClass}</div>
                    <div className="text-2xl font-extrabold mt-1">
                      {studentsRoster.filter(s => s.class_group === dashboardClass).length} Students
                    </div>
                    <div className="text-[11px] text-emerald-500 font-bold mt-1">100% Synced</div>
                  </div>

                  <div className={`${cardBg} p-5 rounded-2xl border shadow-2xs`}>
                    <div className={`text-xs font-bold ${mutedText}`}>{dashboardSubject} Avg Mastery</div>
                    <div className="text-2xl font-extrabold text-sky-500 mt-1">
                      {getDeterministicScore(`${dashboardClass}_${dashboardSubject}`)}%
                    </div>
                    <div className={`text-[11px] mt-1 ${mutedText}`}>+6% vs last week</div>
                  </div>

                  <div className={`${cardBg} p-5 rounded-2xl border shadow-2xs`}>
                    <div className={`text-xs font-bold ${mutedText}`}>Needs Attention (&lt;60%)</div>
                    <div className="text-2xl font-extrabold text-amber-500 mt-1">
                      {studentsRoster.filter(s => s.class_group === dashboardClass && s.avgMastery < 60).length} Students
                    </div>
                    <div className="text-[11px] text-amber-500 font-bold mt-1">Targeted for remediation</div>
                  </div>

                  <div className={`${cardBg} p-5 rounded-2xl border shadow-2xs`}>
                    <div className={`text-xs font-bold ${mutedText}`}>Focus Mode ({dashboardClass})</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-sm font-extrabold ${classFocusModeEnabled[dashboardClass] ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {classFocusModeEnabled[dashboardClass] ? 'ON (Default)' : 'OFF'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setClassFocusModeEnabled(prev => ({ ...prev, [dashboardClass]: !prev[dashboardClass] }))}
                        className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                          classFocusModeEnabled[dashboardClass]
                            ? 'bg-rose-600 text-white hover:bg-rose-700'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {classFocusModeEnabled[dashboardClass] ? 'Turn OFF' : 'Turn ON'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Weekly Class Leaderboard (Top 5) + Focus Violations Panel + Class Redemptions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Weekly Class Leaderboard (Top 5) */}
                  <div className={`lg:col-span-2 ${cardBg} rounded-2xl p-5 shadow-sm border space-y-4`}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-extrabold flex items-center space-x-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <span>Weekly Class Leaderboard (Top 5 • {dashboardClass})</span>
                      </h2>
                      <span className={`text-xs font-bold ${mutedText}`}>Display Names Only • Min 20 Qs</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className={`border-b font-extrabold ${subCardBg}`}>
                            <th className="py-2.5 px-3">Rank</th>
                            <th className="py-2.5 px-3">Display Name</th>
                            <th className="py-2.5 px-3">Accuracy</th>
                            <th className="py-2.5 px-3">Avg Response Time</th>
                            <th className="py-2.5 px-3 text-right">Cheers</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {(() => {
                            const top5 = getClassLeaderboard(dashboardClass).slice(0, 5);
                            if (top5.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={5} className="py-4 text-center text-slate-500">
                                    No eligible students with 20+ questions answered yet.
                                  </td>
                                </tr>
                              );
                            }
                            return top5.map((st, idx) => {
                              const acc = Math.round((st.weeklyStats.correct / st.weeklyStats.total_answered) * 100);
                              return (
                                <tr key={st.id} className={idx === 0 ? 'bg-amber-500/10 font-extrabold' : ''}>
                                  <td className="py-2.5 px-3">#{idx + 1}</td>
                                  <td className="py-2.5 px-3">{st.display_name}</td>
                                  <td className="py-2.5 px-3 text-emerald-500 font-extrabold">{acc}%</td>
                                  <td className="py-2.5 px-3 font-mono">{st.weeklyStats.avg_time}s</td>
                                  <td className="py-2.5 px-3 text-right text-amber-500 font-extrabold">{starCheers[st.id] || 0}</td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Give Appreciation Note to Star Student */}
                    {(() => {
                      const star = getClassLeaderboard(dashboardClass)[0];
                      if (!star) return null;
                      return (
                        <div className={`p-3.5 rounded-xl border space-y-2 ${subCardBg}`}>
                          <div className="text-xs font-extrabold">Give Appreciation to Star Student ({star.display_name}):</div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              placeholder={`Write a short note for ${star.display_name}...`}
                              value={teacherNoteInput}
                              onChange={(e) => setTeacherNoteInput(e.target.value)}
                              className={`flex-1 px-3 py-2 text-xs font-bold rounded-xl border ${
                                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!teacherNoteInput.trim()) return;
                                setAppreciationNotes(prev => ({ ...prev, [star.id]: teacherNoteInput.trim() }));
                                setTeacherNoteInput('');
                                showNotification(`Appreciation note shared with ${star.display_name}!`, 'success');
                              }}
                              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-extrabold"
                            >
                              Give Appreciation
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Focus Mode Violations Panel & Class Redemptions */}
                  <div className="space-y-6">
                    <div className={`${cardBg} rounded-2xl p-5 shadow-sm border space-y-3`}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold flex items-center space-x-2">
                          <EyeOff className="w-4 h-4 text-slate-500" />
                          <span>Focus Mode Violations ({dashboardClass})</span>
                        </h3>
                      </div>
                      <p className={`text-[11px] ${mutedText}`}>Sorted from most to fewest (Display Names only)</p>

                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {studentsRoster
                          .filter(s => s.class_group === dashboardClass)
                          .map(st => {
                            const todayCount = allViolations.filter(v => v.user_id === st.id).length;
                            const weekCount = todayCount + (getDeterministicScore(st.id) % 3);
                            return { st, todayCount, weekCount };
                          })
                          .sort((a, b) => b.todayCount - a.todayCount || b.weekCount - a.weekCount)
                          .map(({ st, todayCount, weekCount }) => (
                            <div key={st.id} className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${subCardBg}`}>
                              <span className="font-extrabold">{st.display_name}</span>
                              <div className="flex items-center space-x-3">
                                <span>Today: <strong>{todayCount}</strong></span>
                                <span className={mutedText}>Week: <strong>{weekCount}</strong></span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Class Redemptions Panel (For Class 6 & 7) */}
                    {(dashboardClass === 'Class 6' || dashboardClass === 'Class 7') && (
                      <div className={`${cardBg} rounded-2xl p-5 shadow-sm border space-y-3`}>
                        <h3 className="text-sm font-extrabold flex items-center space-x-2">
                          <Gift className="w-4 h-4 text-amber-500" />
                          <span>Reward Redemptions ({dashboardClass})</span>
                        </h3>
                        <div className="space-y-2 max-h-36 overflow-y-auto text-xs">
                          {redemptions
                            .filter(r => {
                              const st = studentsRoster.find(s => s.id === r.user_id);
                              return st && st.class_group === dashboardClass;
                            })
                            .map(r => {
                              const st = studentsRoster.find(s => s.id === r.user_id);
                              const rw = REWARDS_STORE.find(item => item.id === r.reward_id);
                              return (
                                <div key={r.id} className={`p-2 rounded-lg border flex items-center justify-between ${subCardBg}`}>
                                  <span className="font-bold">{st?.display_name}</span>
                                  <span className="text-sky-500 font-extrabold">{rw?.name}</span>
                                </div>
                              );
                            })}
                          {redemptions.filter(r => {
                            const st = studentsRoster.find(s => s.id === r.user_id);
                            return st && st.class_group === dashboardClass;
                          }).length === 0 && (
                            <div className={`italic ${mutedText}`}>No rewards redeemed in {dashboardClass} yet.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Classroom Concept Mastery Heatmap */}
                <div className={`${cardBg} rounded-2xl shadow-sm border overflow-hidden`}>
                  <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-extrabold">{dashboardClass} • {dashboardSubject} Mastery Heatmap</h2>
                      <p className={`text-xs ${mutedText}`}>Click a student's name for diagnostic velocity or click any cell for chapter details</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className={`p-1 rounded-xl flex items-center border ${subCardBg}`}>
                        <button
                          onClick={() => setHeatmapFilter('all')}
                          className={`px-3 py-1 rounded-lg text-xs font-extrabold ${heatmapFilter === 'all' ? 'bg-sky-600 text-white' : ''}`}
                        >
                          Show All
                        </button>
                        <button
                          onClick={() => setHeatmapFilter('struggling')}
                          className={`px-3 py-1 rounded-lg text-xs font-extrabold ${heatmapFilter === 'struggling' ? 'bg-rose-600 text-white' : ''}`}
                        >
                          Needs Attention
                        </button>
                        <button
                          onClick={() => setHeatmapFilter('mastered')}
                          className={`px-3 py-1 rounded-lg text-xs font-extrabold ${heatmapFilter === 'mastered' ? 'bg-emerald-600 text-white' : ''}`}
                        >
                          Mastered
                        </button>
                      </div>

                      <div className="relative w-full sm:w-48">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search student..."
                          value={searchStudent}
                          onChange={(e) => setSearchStudent(e.target.value)}
                          className={`w-full pl-8 pr-3 py-1.5 text-xs font-bold border rounded-xl ${
                            isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b font-extrabold ${subCardBg}`}>
                          <th className="py-3 px-4 min-w-[180px]">Roll No & Student</th>
                          {(SYLLABUS[dashboardClass]?.[dashboardSubject] || []).map(chap => (
                            <th key={chap} className="py-3 px-3 text-center min-w-[130px]">{chap}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredStudents.map(student => (
                          <tr key={student.id} className="hover:bg-sky-500/5 transition-all">
                            <td
                              onClick={() => setSelectedStudentDrawer(student)}
                              className="py-3 px-4 font-bold cursor-pointer flex items-center justify-between"
                            >
                              <div>
                                <div className="text-sky-500 font-extrabold">{student.roll_no}</div>
                                <div>{student.name}</div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </td>

                            {(SYLLABUS[dashboardClass]?.[dashboardSubject] || []).map(chap => {
                              const score = getDeterministicScore(`${student.id}_${dashboardSubject}_${chap}`);
                              let cellStyle = 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40';
                              if (score < 60) {
                                cellStyle = 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 font-extrabold';
                              } else if (score < 80) {
                                cellStyle = 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40';
                              }
                              return (
                                <td key={chap} className="p-2 text-center">
                                  <button
                                    onClick={() => setSelectedCellDetail({ student, chap, score })}
                                    className={`w-full py-2 rounded-lg border text-xs font-extrabold transition-transform hover:scale-105 ${cellStyle}`}
                                  >
                                    {score}%
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* TEACHER TAB 2: MANAGE STUDENTS                            */}
            {/* ========================================================= */}
            {currentUser.role === 'teacher' && activeTab === 'manage' && (
              <div className={`${cardBg} rounded-2xl p-6 shadow-sm border space-y-6`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-700">
                  <div>
                    <h2 className="text-xl font-extrabold">Manage Classroom Student Accounts</h2>
                    <p className={`text-xs ${mutedText}`}>Enroll new students or reset passwords across Classes 6–10</p>
                  </div>
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-2 text-xs"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add New Student</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b font-extrabold ${subCardBg}`}>
                        <th className="py-3 px-4">Roll No</th>
                        <th className="py-3 px-4">Full Name</th>
                        <th className="py-3 px-4">Display Name</th>
                        <th className="py-3 px-4">Class</th>
                        <th className="py-3 px-4">Avg Mastery</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {studentsRoster.map(st => (
                        <tr key={st.id}>
                          <td className="py-3 px-4 font-extrabold text-sky-500">{st.roll_no}</td>
                          <td className="py-3 px-4 font-bold">{st.name}</td>
                          <td className="py-3 px-4">{st.display_name}</td>
                          <td className="py-3 px-4 font-bold">{st.class_group}</td>
                          <td className="py-3 px-4 font-extrabold">{st.avgMastery}%</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setResetTargetStudent(st);
                                setShowResetPasswordModal(true);
                              }}
                              className={`px-3 py-1.5 rounded-lg font-extrabold text-[11px] border inline-flex items-center space-x-1 ${subCardBg}`}
                            >
                              <Key className="w-3 h-3 text-amber-500" />
                              <span>Reset Password</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TEACHER TAB 3: SUPABASE SCHEMA                            */}
            {/* ========================================================= */}
            {currentUser.role === 'teacher' && activeTab === 'schema' && (
              <div className={`${cardBg} rounded-2xl p-6 shadow-sm border space-y-4`}>
                <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-700">
                  <div>
                    <h2 className="text-xl font-extrabold">Production Database Schema</h2>
                    <p className={`text-xs ${mutedText}`}>Includes tables for profiles, concepts, attempts, points_ledger, redemptions, and violations</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
                      setCopiedSchema(true);
                      showNotification('SQL Schema copied to clipboard!', 'success');
                      setTimeout(() => setCopiedSchema(false), 2000);
                    }}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl flex items-center space-x-2"
                  >
                    {copiedSchema ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedSchema ? 'Copied!' : 'Copy SQL'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 text-sky-300 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                  <pre>{SUPABASE_SCHEMA_SQL}</pre>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* --- MODAL: 15-MINUTE FOCUS STRETCH BREAK --- */}
      {showStretchBreakModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`${cardBg} w-full max-w-md rounded-2xl shadow-2xl border p-6 text-center space-y-4`}>
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold">Great focus! Stretch for one minute.</h3>
            <p className={`text-base ${mutedText}`}>
              Taking a short 1-minute stretch refreshes your mind while keeping your learning session active.
            </p>
            <button
              type="button"
              onClick={() => setShowStretchBreakModal(false)}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-xl text-base shadow-md"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL: CELL DETAIL --- */}
      {selectedCellDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`${cardBg} w-full max-w-md rounded-2xl shadow-2xl border p-6 space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
              <h3 className="font-extrabold text-base">{selectedCellDetail.student.name} • Chapter Breakdown</h3>
              <button onClick={() => setSelectedCellDetail(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2 text-xs">
              <div><strong>Chapter:</strong> {selectedCellDetail.chap}</div>
              <div><strong>Mastery Score:</strong> <span className="font-extrabold text-sky-500">{selectedCellDetail.score}%</span></div>
              <div><strong>Identified Pattern:</strong> {selectedCellDetail.student.errorPattern}</div>
            </div>
            <button
              onClick={() => setSelectedCellDetail(null)}
              className="w-full py-2.5 bg-sky-600 text-white font-extrabold rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* --- SLIDE-OVER DRAWER: STUDENT DIAGNOSTIC --- */}
      {selectedStudentDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className={`${cardBg} w-full max-w-md h-full shadow-2xl border-l p-6 flex flex-col justify-between overflow-y-auto`}>
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="font-extrabold text-base">{selectedStudentDrawer.name}</h3>
                  <p className={`text-xs ${mutedText}`}>{selectedStudentDrawer.roll_no} • {selectedStudentDrawer.class_group}</p>
                </div>
                <button onClick={() => setSelectedStudentDrawer(null)}><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl border ${subCardBg}`}>
                  <div className={`text-[10px] font-bold ${mutedText}`}>Overall Mastery</div>
                  <div className="text-lg font-extrabold text-sky-500 mt-0.5">{selectedStudentDrawer.avgMastery}%</div>
                </div>
                <div className={`p-3 rounded-xl border ${subCardBg}`}>
                  <div className={`text-[10px] font-bold ${mutedText}`}>Mastery Velocity</div>
                  <div className="text-xs font-extrabold text-emerald-500 flex items-center space-x-1 mt-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{selectedStudentDrawer.velocity}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 space-y-1">
                <div className="text-xs font-extrabold text-amber-500 uppercase">Diagnostic Error Pattern</div>
                <p className="text-xs font-medium">{selectedStudentDrawer.errorPattern}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedStudentDrawer(null)}
              className="w-full py-2.5 bg-sky-600 text-white font-extrabold rounded-xl text-xs"
            >
              Close Diagnostic Drawer
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD NEW STUDENT --- */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`${cardBg} w-full max-w-md rounded-2xl shadow-2xl border p-6 space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
              <h3 className="font-extrabold text-base">Register New Student</h3>
              <button onClick={() => setShowAddStudentModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div>
                <label className="block font-extrabold uppercase mb-1">Roll Number</label>
                <input
                  type="text"
                  required
                  placeholder="STU031"
                  value={newRollNo}
                  onChange={(e) => setNewRollNo(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl font-bold uppercase ${subCardBg}`}
                />
              </div>
              <div>
                <label className="block font-extrabold uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Ramesh Chandra"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl font-bold ${subCardBg}`}
                />
              </div>
              <div>
                <label className="block font-extrabold uppercase mb-1">Class</label>
                <select
                  value={newClassGroup}
                  onChange={(e) => setNewClassGroup(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl font-bold ${subCardBg}`}
                >
                  {Object.keys(SYLLABUS).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddStudentModal(false)} className={`px-4 py-2 rounded-xl font-bold ${subCardBg}`}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white font-extrabold rounded-xl">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: RESET PASSWORD --- */}
      {showResetPasswordModal && resetTargetStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`${cardBg} w-full max-w-md rounded-2xl shadow-2xl border p-6 space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
              <h3 className="font-extrabold text-base">Reset Student Password</h3>
              <button onClick={() => setShowResetPasswordModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="text-xs">Resetting password for <strong>{resetTargetStudent.name}</strong> ({resetTargetStudent.roll_no})</div>
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <input
                type="password"
                required
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                className={`w-full p-2.5 border rounded-xl font-bold ${subCardBg}`}
              />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowResetPasswordModal(false)} className={`px-4 py-2 rounded-xl font-bold ${subCardBg}`}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white font-extrabold rounded-xl">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: 5-MIN REMEDIAL ACTION PLAN GENERATOR --- */}
      {showRemedialGenerator && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`${cardBg} w-full max-w-3xl rounded-2xl shadow-2xl border p-6 space-y-5 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-sky-500" />
                <h3 className="text-lg font-extrabold">AI-Generated 5-Minute Remedial Action Plan</h3>
              </div>
              <button onClick={() => setShowRemedialGenerator(false)}><X className="w-5 h-5" /></button>
            </div>

            {!generatedRemedialPlan ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
                <p className="text-xs font-bold">Analyzing {dashboardClass} Heatmap & Generating Peer Matrix...</p>
              </div>
            ) : (
              <div className="space-y-5 text-xs">
                <div className="p-3.5 rounded-xl bg-sky-500/15 border border-sky-500/30">
                  <div className="font-extrabold text-sm">{generatedRemedialPlan.topic}</div>
                  <div className="mt-1">{generatedRemedialPlan.microGap}</div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm">1. 5-Minute Micro-Teaching Script:</h4>
                  {generatedRemedialPlan.teacherStrategy.map((step, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${subCardBg}`}>{step}</div>
                  ))}
                </div>

                <div>
                  <h4 className="font-extrabold text-sm mb-2">2. Blackboard Practice Problems:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {generatedRemedialPlan.blackboardProblems.map((p, i) => (
                      <div key={i} className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
                        <div className="font-bold text-sky-300">{p.prob}</div>
                        <div className="text-[11px] text-slate-300">{p.step1}</div>
                        <div className="text-[11px] text-emerald-400 font-bold">{p.step2}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm">3. Peer-Pairing Matrix:</h4>
                  {generatedRemedialPlan.peerPairings.map((pair, i) => (
                    <div key={i} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <div className="font-extrabold">{pair.mentor} ➔ {pair.mentee}</div>
                      <div className="mt-1 italic">Prompt: "{pair.promptCard}"</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button onClick={() => setShowRemedialGenerator(false)} className={`px-4 py-2 rounded-xl font-bold ${subCardBg}`}>Close</button>
                  <button
                    onClick={() => showNotification("Remedial Plan exported for printing!", "success")}
                    className="px-4 py-2 bg-sky-600 text-white rounded-xl font-extrabold flex items-center space-x-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Export PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-4 px-6 text-xs text-center mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SutraAI (सूत्र AI) — Offline-First Teacher-Centric Adaptive Learning Platform</span>
          <span className="text-slate-400">Classes 6–10 • Mathematics, Science, Social Science & Information Technology</span>
        </div>
      </footer>

    </div>
  );
}