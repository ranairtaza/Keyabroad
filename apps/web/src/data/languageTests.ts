export interface LanguageTest {
  id: string;
  name: string;
  description: string;
  about: string;
  whyChooseUs: string[];
}

export const languageTests: LanguageTest[] = [
  {
    id: "ielts",
    name: "IELTS",
    description: "Master all four modules: Reading, Writing, Listening, and Speaking.",
    about: "The International English Language Testing System (IELTS) is designed to help you work, study or migrate to a country where English is the native language. Our comprehensive course covers all four modules—Reading, Writing, Listening, and Speaking—giving you the techniques and practice needed to achieve a high band score.",
    whyChooseUs: [
      "Experienced instructors with proven track records of high-band students",
      "Regular full-length mock tests mimicking real exam conditions",
      "Detailed, personalized feedback on writing and speaking modules",
      "Extensive library of practice materials and resources",
      "Small batch sizes ensuring individual attention"
    ]
  },
  {
    id: "pte",
    name: "PTE Academic",
    description: "Computer-based English test preparation focusing on real-life skills.",
    about: "The Pearson Test of English (PTE) Academic is a computer-based test aimed at non-native English speakers wanting to study abroad. It tests Reading, Writing, Listening, and Speaking. We provide hands-on practice in computer labs with software that simulates the exact test environment.",
    whyChooseUs: [
      "Dedicated computer labs with authentic PTE simulation software",
      "Strategies specifically designed to score well in computerized scoring",
      "Focus on time-management and quick-response techniques",
      "Template-based learning for speaking and writing tasks",
      "Instant scoring feedback on mock exams"
    ]
  },
  {
    id: "duolingo",
    name: "Duolingo",
    description: "Fast and convenient test preparation for the popular Duolingo test.",
    about: "The Duolingo English Test is an innovative and accessible English proficiency assessment. Completed entirely online from your own computer, it is increasingly accepted by universities worldwide. Our preparation course familiarizes you with the unique adaptive question types.",
    whyChooseUs: [
      "In-depth breakdown of Duolingo's unique adaptive algorithm",
      "Intensive vocabulary building exercises",
      "Techniques for the 'Listen and Type' and 'Speak the Word' tasks",
      "Strategies for the un-graded video interview segment",
      "Fast-track courses available for urgent deadlines"
    ]
  },
  {
    id: "other",
    name: "Other Tests (TOEFL, etc.)",
    description: "Tailored guidance for TOEFL, GRE, and GMAT depending on demands.",
    about: "In addition to IELTS, PTE, and Duolingo, we offer customized preparation modules for exams like TOEFL, GRE, and GMAT. Whether you need comprehensive instruction or just focused practice on specific weak areas, our expert tutors can create a tailored study plan for you.",
    whyChooseUs: [
      "Highly customized study plans based on diagnostic testing",
      "Flexible timing options to suit working professionals and students",
      "One-on-one coaching available upon request",
      "Expert guidance on interpreting complex question structures",
      "Comprehensive score-boosting strategies"
    ]
  }
];
