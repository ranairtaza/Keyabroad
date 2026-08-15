export interface Destination {
  id: string;
  name: string;
  image: string;
  about: string;
  universities: { name: string; url: string }[];
  courses: string[];
  whyChoose: string[];
  flagCode: string;
  wavingFlagImage?: string;
  wavingFlagPosition?: string;
  wavingFlagStyle?: string;
}

const defaultCourses = ["Health/Science", "Business", "I.T", "Computing", "Accounting/Finance/HRM", "Engineering"];

export const destinations: Destination[] = [
  {
    id: "united-kingdom",
    name: "United Kingdom",
    image: "/destinations/uk-v2.jpg",
    wavingFlagImage: "/destinations/uk-waving-flag.png",
    about: "Studying in the UK means learning at some of the world's most prestigious universities. With shorter, intensive courses and a rich cultural heritage, you'll graduate faster and step confidently into your career.",
    universities: [
      { name: "University of Greater Manchester", url: "https://manchester.ac.uk" },
      { name: "Birmingham City University", url: "https://www.bcu.ac.uk/" },
      { name: "University of Law", url: "https://www.law.ac.uk/" },
      { name: "De Montfort University", url: "https://www.dmu.ac.uk/" },
      { name: "University of Dundee", url: "https://www.dundee.ac.uk/" },
      { name: "University of Aberdeen", url: "https://www.abdn.ac.uk/" },
      { name: "University of Greenwich", url: "https://www.gre.ac.uk/" },
      { name: "University of Stirling", url: "https://www.stir.ac.uk/" }
    ],
    courses: [...defaultCourses, "Nursing", "Education"],
    whyChoose: ["MOI accepted", "Dependents allowed", "Career-focused programmes", "Post-study work opportunities", "100% visa success ratio"],
    flagCode: "gb"
  },
  {
    id: "usa",
    name: "USA",
    image: "/destinations/usa-v2.jpg",
    wavingFlagImage: "/destinations/usa-waving-flag.png",
    wavingFlagStyle: "-translate-x-4 -translate-y-4",
    about: "The USA remains the top choice for ambitious students worldwide. From unparalleled academic flexibility and cutting-edge research to an unforgettable campus life, it's the perfect place to build a global network.",
    universities: [
      { name: "Post University", url: "https://post.edu/" },
      { name: "Harvard University", url: "https://www.harvard.edu/" },
      { name: "Stanford University", url: "https://www.stanford.edu/" },
      { name: "University of Chicago", url: "https://www.uchicago.edu/" },
      { name: "Columbia University", url: "https://www.columbia.edu/" },
      { name: "Webster University", url: "https://www.webster.edu/" },
      { name: "Yale University", url: "https://www.yale.edu/" },
      { name: "Millennia Atlantic University", url: "https://www.maufl.edu/" },
      { name: "Elon University", url: "https://www.elon.edu/" }
    ],
    courses: defaultCourses,
    whyChoose: ["Flexible intakes available", "Practical learning approach", "Affordable fee", "With/without IELTS", "Part-time work allowed"],
    flagCode: "us"
  },
  {
    id: "canada",
    name: "Canada",
    image: "/destinations/canada-new.jpg",
    wavingFlagImage: "/destinations/canada-waving-flag.png",
    about: "Known for its incredibly welcoming and safe multicultural environment, Canada offers world-class education paired with some of the best post-graduation work opportunities in the world.",
    universities: [
      { name: "University of Toronto (UofT)", url: "https://www.utoronto.ca/" },
      { name: "McGill University", url: "https://www.mcgill.ca/" },
      { name: "University of British Columbia (UBC)", url: "https://www.ubc.ca/" },
      { name: "University of Waterloo", url: "https://uwaterloo.ca/" },
      { name: "University of Alberta", url: "https://www.ualberta.ca/" },
      { name: "McMaster University", url: "https://www.mcmaster.ca/" },
      { name: "Université de Montréal", url: "https://www.umontreal.ca/" },
      { name: "Western University", url: "https://www.uwo.ca/" },
      { name: "Queen's University", url: "https://www.queensu.ca/" }
    ],
    courses: defaultCourses,
    whyChoose: ["High-quality education", "Post-graduation work opportunities", "Welcoming multicultural environment", "Safe and secure environment"],
    flagCode: "ca"
  },
  {
    id: "ireland",
    name: "Ireland",
    image: "/destinations/ireland-v2.jpg",
    wavingFlagImage: "/destinations/ireland-waving-flag.png",
    wavingFlagStyle: "scale-75 md:scale-[0.85] origin-top-left -translate-x-4 -translate-y-4",
    about: "Often called the 'Silicon Valley of Europe', Ireland offers top-tier education with direct links to global tech giants. Enjoy a friendly, English-speaking environment with fantastic post-study work options.",
    universities: [
      { name: "Holmes Institute Dublin", url: "https://www.holmesinstitute.ie/" },
      { name: "Trinity College Dublin (TCD)", url: "https://www.tcd.ie/" },
      { name: "University College Dublin (UCD)", url: "https://www.ucd.ie/" },
      { name: "National University of Ireland Galway (NUIG)", url: "https://www.universityofgalway.ie/" },
      { name: "University College Cork (UCC)", url: "https://www.ucc.ie/" },
      { name: "Dublin City University (DCU)", url: "https://www.dcu.ie/" },
      { name: "Maynooth University", url: "https://www.maynoothuniversity.ie/" },
      { name: "University of Limerick (UL)", url: "https://www.ul.ie/" }
    ],
    courses: defaultCourses,
    whyChoose: ["High employability rate", "Online tests acceptable", "Part-time work allowed"],
    flagCode: "ie"
  },
  {
    id: "malta",
    name: "Malta",
    image: "/destinations/malta-v2.jpg",
    wavingFlagImage: "/destinations/malta-waving-flag.png",
    about: "Experience world-class education in the heart of the Mediterranean. With English as an official language and a safe, sun-drenched environment, Malta is a brilliant, affordable pathway to Europe.",
    universities: [
      { name: "GBS Malta", url: "https://gbs.edu.mt/" },
      { name: "eie European Business School, Malta", url: "https://www.eieinstitute.com/" },
      { name: "YHANK Institute", url: "#" },
      { name: "Idea College, Malta", url: "#" },
      { name: "University of Malta", url: "https://www.um.edu.mt/" },
      { name: "MCAST – Malta College of Arts, Science & Technology", url: "https://mcast.edu.mt/" },
      { name: "American University of Malta", url: "https://aum.edu.mt/" }
    ],
    courses: defaultCourses,
    whyChoose: ["No language barrier", "With/without IELTS", "Schengen visa", "Affordable tuition fees", "Post-study work opportunities"],
    flagCode: "mt"
  },
  {
    id: "cyprus",
    name: "Cyprus",
    image: "/destinations/cyprus-v2.jpg",
    wavingFlagImage: "/destinations/cyprus-waving-flag.png",
    about: "Cyprus perfectly blends high-quality European education with surprisingly affordable tuition. Join a rapidly growing international community while enjoying breathtaking Mediterranean scenery.",
    universities: [
      { name: "UCLan Cyprus", url: "https://www.uclancyprus.ac.cy/" },
      { name: "American College", url: "https://www.ac.ac.cy/" },
      { name: "Neapolis University", url: "https://www.nup.ac.cy/" },
      { name: "University of Limassol", url: "https://www.uol.ac.cy/" },
      { name: "Limassol College", url: "https://thelimassolcollege.ac.cy/" },
      { name: "CDA College", url: "https://www.cdacollege.ac.cy/" },
      { name: "Frederick University", url: "https://www.frederick.ac.cy/" },
      { name: "University of Nicosia", url: "https://www.unic.ac.cy/" },
      { name: "Cyprus University of Technology", url: "https://www.cut.ac.cy/" }
    ],
    courses: [...defaultCourses, "Nursing", "Education"],
    whyChoose: ["Low IELTS Requirements", "1 Day Bank Statement Required", "Post-study work opportunities", "No Interview", "100% visa ratio"],
    flagCode: "cy"
  },
  {
    id: "germany",
    name: "Germany",
    image: "/destinations/germany-v2.jpg",
    wavingFlagImage: "/destinations/germany-waving-flag.png",
    about: "As a global powerhouse for engineering and technology, Germany offers outstanding research facilities and a robust economy. Best of all, you can often study for free or at a very low cost at public universities.",
    universities: [
      { name: "University of Applied Management Studies", url: "https://www.fham.de/" },
      { name: "University of Applied Sciences for Healthcare & Social Sciences", url: "https://www.srh-gesundheitshochschule.de/" },
      { name: "Technical University of Munich (TUM)", url: "https://www.tum.de/" },
      { name: "Berlin University of Psychology", url: "https://www.psychologische-hochschule.de/" },
      { name: "Heidelberg University", url: "https://www.uni-heidelberg.de/" },
      { name: "University of Berlin", url: "https://www.hu-berlin.de/" },
      { name: "EF Education First, Germany", url: "https://www.ef.com/" }
    ],
    courses: defaultCourses,
    whyChoose: ["Schengen visa", "Affordable tuition fees", "Part-time work allowed"],
    flagCode: "de"
  },
  {
    id: "australia",
    name: "Australia",
    image: "/destinations/australia-v2.jpg",
    wavingFlagImage: "/destinations/australia-waving-flag.png",
    about: "Australia offers a brilliant combination of a world-class education system and an unbeatable, relaxed lifestyle. Graduate from top universities and take advantage of excellent post-study work rights.",
    universities: [
      { name: "University of Melbourne", url: "https://www.unimelb.edu.au/" },
      { name: "University of Sydney", url: "https://www.sydney.edu.au/" },
      { name: "UNSW Sydney", url: "https://www.unsw.edu.au/" },
      { name: "Australian National University (ANU)", url: "https://www.anu.edu.au/" },
      { name: "Monash University", url: "https://www.monash.edu/" }
    ],
    courses: defaultCourses,
    whyChoose: ["World-class education system", "Excellent post-study work rights", "Relaxed lifestyle", "High standard of living"],
    flagCode: "au"
  },
  {
    id: "france",
    name: "France",
    image: "/destinations/france-v2.jpg",
    wavingFlagImage: "/destinations/france-waving-flag.png",
    about: "Celebrated globally for its excellence in arts, business, and science, France offers highly affordable education. Immerse yourself in rich culture while studying right in the heart of Europe.",
    universities: [
      { name: "Schiller International University", url: "https://schiller.edu/" },
      { name: "ICN Business School", url: "https://www.icn-artem.com/" },
      { name: "DSTI - Data Science Tech Institute", url: "https://www.dsti.institute/" },
      { name: "EF Education First", url: "https://www.ef.com/" },
      { name: "Sciences Po Paris", url: "https://www.sciencespo.fr/" },
      { name: "Université PSL (Paris Sciences et Lettres)", url: "https://psl.eu/" },
      { name: "Université de Lyon", url: "https://www.universite-lyon.fr/" },
      { name: "Université Paris-Saclay", url: "https://www.universite-paris-saclay.fr/" }
    ],
    courses: defaultCourses,
    whyChoose: ["English-taught Programmes", "MOI options available", "With/without IELTS", "Affordable tuition fees", "Schengen visa"],
    flagCode: "fr"
  },
  {
    id: "sweden",
    name: "Sweden",
    image: "/destinations/sweden-v2.jpg",
    wavingFlagImage: "/destinations/sweden-waving-flag.png",
    about: "If you value innovation and sustainability, Sweden is your ideal destination. Enjoy a highly progressive, informal learning environment where your ideas are truly valued.",
    universities: [
      { name: "Karolinska Institute", url: "https://ki.se/" },
      { name: "Lund University", url: "https://www.lunduniversity.lu.se/" },
      { name: "Uppsala University", url: "https://www.uu.se/" },
      { name: "Stockholm University", url: "https://www.su.se/" },
      { name: "Chalmers University of Technology", url: "https://www.chalmers.se/" },
      { name: "KTH Royal Institute of Technology", url: "https://www.kth.se/" },
      { name: "Linköping University", url: "https://liu.se/" },
      { name: "Umeå University", url: "https://www.umu.se/" }
    ],
    courses: defaultCourses,
    whyChoose: ["Dependent allowed", "Part-time work allowed", "Schengen visa", "Post-study work opportunities"],
    flagCode: "se"
  },
  {
    id: "italy",
    name: "Italy",
    image: "/destinations/italy-v2.jpg",
    wavingFlagImage: "/destinations/italy-waving-flag.png",
    about: "Study in the birthplace of the Renaissance. Italy offers some of the oldest and most respected universities in the world, combined with affordable tuition and an unmatched lifestyle.",
    universities: [
      { name: "University of Bologna", url: "https://www.unibo.it/" },
      { name: "Sapienza University of Rome", url: "https://www.uniroma1.it/" },
      { name: "University of Milan", url: "https://www.unimi.it/" },
      { name: "University of Padua", url: "https://www.unipd.it/" },
      { name: "University of Turin", url: "https://www.unito.it/" },
      { name: "University of Pisa", url: "https://www.unipi.it/" },
      { name: "University of Florence", url: "https://www.unifi.it/" },
      { name: "University of Naples", url: "https://www.unina.it/" },
      { name: "University of Bari Aldo Moro", url: "https://www.uniba.it/" },
      { name: "University of Genoa", url: "https://unige.it/" },
      { name: "University of Salerno", url: "https://www.unisa.it/" }
    ],
    courses: defaultCourses,
    whyChoose: ["Affordable tuition fees", "Rich cultural experience", "Oldest universities in the Western world", "Central location in Europe"],
    flagCode: "it"
  },
  {
    id: "finland",
    name: "Finland",
    image: "/destinations/finland-v2.jpg",
    wavingFlagImage: "/destinations/finland-waving-flag.png",
    about: "Consistently ranked as the happiest country on Earth, Finland offers a cutting-edge education system, incredibly safe cities, and a beautiful, nature-focused lifestyle.",
    universities: [
      { name: "University of Helsinki", url: "https://www.helsinki.fi/" },
      { name: "Aalto University", url: "https://www.aalto.fi/" },
      { name: "University of Turku", url: "https://www.utu.fi/" },
      { name: "Tampere University", url: "https://www.tuni.fi/" },
      { name: "University of Eastern Finland (UEF)", url: "https://www.uef.fi/" },
      { name: "University of Oulu", url: "https://www.oulu.fi/" },
      { name: "University of Lapland", url: "https://www.ulapland.fi/" }
    ],
    courses: defaultCourses,
    whyChoose: ["Dependent allowed", "Part-time work allowed", "Schengen visa", "Post-study work opportunities"],
    flagCode: "fi"
  },
  {
    id: "netherlands",
    name: "Netherlands",
    image: "/destinations/netherlands-v2.jpg",
    wavingFlagImage: "/destinations/netherlands-waving-flag.png",
    about: "The Netherlands is famous for its innovative, open-minded society and highly interactive teaching methods. You'll find a massive selection of English-taught programs to suit any career goal.",
    universities: [
      { name: "University of Applied Sciences Europe", url: "https://www.ue-germany.com/" },
      { name: "Delft University of Technology", url: "https://www.tudelft.nl/" },
      { name: "University of Amsterdam (UvA)", url: "https://www.uva.nl/" },
      { name: "Eindhoven University of Technology", url: "https://www.tue.nl/" },
      { name: "Leiden University", url: "https://www.universiteitleiden.nl/" },
      { name: "Utrecht University", url: "https://www.uu.nl/" },
      { name: "Maastricht University", url: "https://www.maastrichtuniversity.nl/" },
      { name: "Radboud University", url: "https://www.ru.nl/" }
    ],
    courses: defaultCourses,
    whyChoose: ["English-taught programmes", "High graduate employability", "Part-time work allowed"],
    flagCode: "nl"
  },
  {
    id: "malaysia",
    name: "Malaysia",
    image: "/destinations/malaysia-new.jpg",
    wavingFlagImage: "/destinations/malaysia-waving-flag.png",
    about: "As a rapidly growing educational hub in Asia, Malaysia allows you to earn prestigious degrees from international branch campuses while enjoying a highly affordable, vibrant lifestyle.",
    universities: [
      { name: "Asia Pacific University (APU)", url: "https://www.apu.edu.my/" },
      { name: "LSBF Malaysia", url: "#" },
      { name: "GlobalNxt University", url: "https://www.globalnxt.edu.my/" },
      { name: "SEGI University", url: "https://www.segi.edu.my/" },
      { name: "Taylor's University", url: "https://university.taylors.edu.my/" },
      { name: "Malaysia University of Science and Technology", url: "https://www.must.edu.my/" },
      { name: "Monash University Malaysia", url: "https://www.monash.edu.my/" },
      { name: "Lincoln University College", url: "https://www.lincoln.edu.my/" },
      { name: "University of Nottingham Malaysia Campus", url: "https://www.nottingham.edu.my/" },
      { name: "YTL College", url: "#" }
    ],
    courses: defaultCourses,
    whyChoose: ["No language test", "No bank statement", "No interview", "100% visa ratio", "Pathway to Europe and the UK"],
    flagCode: "my"
  },
  {
    id: "dubai",
    name: "Dubai",
    image: "/destinations/dubai-v2.jpg",
    wavingFlagImage: "/destinations/dubai-waving-flag.png",
    about: "Step into the future in Dubai. Study at global university branch campuses with world-class facilities, and take advantage of incredible tax-free career opportunities after you graduate.",
    universities: [
      { name: "GBS Dubai", url: "https://gbs.ac.ae/" },
      { name: "Idea College Dubai", url: "#" },
      { name: "University of Ajman", url: "https://www.ajman.ac.ae/" },
      { name: "DeMontfort University", url: "https://www.dmu.ac.ae/" },
      { name: "Heriot-Watt University Dubai", url: "https://www.hw.ac.uk/dubai/" },
      { name: "Middlesex University Dubai", url: "https://www.mdx.ac.ae/" },
      { name: "University of Dubai", url: "https://ud.ac.ae/" }
    ],
    courses: defaultCourses,
    whyChoose: ["Pathway to Europe and the UK", "No bank statement", "No language test", "Part-time work allowed"],
    flagCode: "ae"
  },
  {
    id: "new-zealand",
    name: "New Zealand",
    image: "/destinations/new-zealand.jpg",
    // No individual flag uploaded yet
    about: "Renowned as one of the safest and most beautiful countries in the world, New Zealand provides a high-quality education system and an adventurous, welcoming lifestyle.",
    universities: [
      { name: "Ara Institute of Canterbury", url: "https://www.ara.ac.nz/" },
      { name: "Auckland Institute of Studies", url: "https://www.ais.ac.nz/" },
      { name: "Auckland University of Technology", url: "https://www.aut.ac.nz/" },
      { name: "Eastern Institute of Technology (EIT)", url: "https://www.eit.ac.nz/" },
      { name: "FutureSkills", url: "https://www.futureskills.co.nz/" },
      { name: "University of Auckland", url: "https://www.auckland.ac.nz/" },
      { name: "University of Otago", url: "https://www.otago.ac.nz/" },
      { name: "Victoria University of Wellington", url: "https://www.wgtn.ac.nz/" },
      { name: "University of Canterbury", url: "https://www.canterbury.ac.nz/" },
      { name: "Massey University", url: "https://www.massey.ac.nz/" },
      { name: "University of Waikato", url: "https://www.waikato.ac.nz/" },
      { name: "Lincoln University", url: "https://www.lincoln.ac.nz/" },
      { name: "Unitec Institute of Technology", url: "https://www.unitec.ac.nz/" },
      { name: "Waikato Institute of Technology (Wintec)", url: "https://www.wintec.ac.nz/" },
      { name: "Manukau Institute of Technology (MIT)", url: "https://www.manukau.ac.nz/" },
      { name: "Southern Institute of Technology (SIT)", url: "https://www.sit.ac.nz/" }
    ],
    courses: defaultCourses,
    whyChoose: ["Safe environment", "High-quality education", "Post-study work rights"],
    flagCode: "nz"
  },
  {
    id: "turkey",
    name: "Turkey",
    image: "/destinations/turkey.jpg",
    // No individual flag uploaded yet
    about: "Experience a fascinating blend of Eastern and Western cultures. Turkey offers highly affordable education, beautiful campuses, and a rich historical backdrop for your studies.",
    universities: [
      { name: "Koç University", url: "https://www.ku.edu.tr/" },
      { name: "Middle East Technical University", url: "https://www.metu.edu.tr/" },
      { name: "Bilkent University", url: "https://www.bilkent.edu.tr/" },
      { name: "Boğaziçi University", url: "https://www.boun.edu.tr/" },
      { name: "Istanbul Technical University", url: "https://www.itu.edu.tr/" },
      { name: "Sabancı University", url: "https://www.sabanciuniv.edu/" },
      { name: "Hacettepe University", url: "https://www.hacettepe.edu.tr/" },
      { name: "Istanbul University", url: "https://www.istanbul.edu.tr/" },
      { name: "Ankara University", url: "https://www.ankara.edu.tr/" }
    ],
    courses: defaultCourses,
    whyChoose: ["Affordable tuition fees", "Rich culture", "No language barrier"],
    flagCode: "tr"
  }
];
