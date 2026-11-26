/* ROMANIA: UNLOCKED — all game content.
   Every fact here was checked against a published source (listed in presenter notes).
   Images load from Wikimedia Commons; if they fail, an illustrated fallback is shown. */

const IMG_FILES = {
  intro: 'Romania_Transfagarasan.jpg',
  bran: 'Bran_Castle_-_Castelul_Bran.JPG',
  parliament: 'Bucarest,_Palazzo_del_Parlamento_di_notte_01.JPG',
  bear: 'Carpathian_Brown_Bear_(232367505).jpeg',
  delta: 'White_pelicans_(Pelecanus_onocrotalus)_Danube_delta.jpg',
  martisor: 'Martisor.jpg',
  merry: 'Merry_Cemetery,_Sapanta,_Maramures,_Romania.jpg',
  sighisoara: 'Clock_Tower,_Stundturm,_Sighisoara_(Schäßburg),_Romania,_Rumänien20120922.jpg',
  maramures: 'BarsanaMM2012_(134).JPG',
  transf: 'Transfagarasan_road_with_Bilea_Lake.jpg',
  constanta: 'Constanta_Casino.JPG',
  business: 'Bucharest_Business_District.jpg',
  sarmale: 'Sarmale_with_mamaligă.jpg',
  mici: 'Mititei_la_gratar.jpg',
  mamaliga: 'MamaligaBranza.JPG',
  papanasi: 'Papanasi_cu_cirese.jpg',
  cozonac: 'Cozonac-cu-nuca-103.jpg',
  ciorba: 'Ciorba_de_burta_2.jpg',
  boeuf: 'Salata_boeuf_02.jpg',
  zacusca: 'Zacuscă.jpg',
  untold: 'Untold_Festival.jpg',
  blouse: 'Blouse_MET_23.123.1.jpg',
  horezu: 'Ceramică_Horezu_unu.jpg',
  village: 'Muzeul_Satului_din_Bucuresti,_casa_din_Maramures.jpg',
  calusari: 'Calusarii.jpg'
};
const imgURL = (key, w = 1280) => IMG_FILES[key]
  ? 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(IMG_FILES[key]) + '?width=' + w
  : '';

const DEFAULT_TEAMS = [
  { id: 't1', name: 'TEAM DRACULA', color: '#ff2e3b' },
  { id: 't2', name: 'TEAM CARPATHIANS', color: '#ffd60a' },
  { id: 't3', name: 'TEAM DACIA', color: '#2f6bff' }
];
const EXTRA_TEAM_COLORS = ['#ffffff', '#ff8a00', '#00d1a0'];

const XP = { correct: 100, bonus: 50, attempt: 100, success: 150, participation: 50, level: 200 };

/* ---------- LEVEL 01: MYTH OR REALITY ---------- */
const L1 = [
  { s: 'Count Dracula, the vampire, was a real Transylvanian nobleman.', a: false, tag: 'MYTH', img: 'bran',
    ex: 'Count Dracula is fictional. Irish author Bram Stoker invented him in 1897. He borrowed the name from Vlad III "Drăculea" — a real, brutal 15th-century prince of Wallachia (not Transylvania), and no vampire.',
    take: '"Drăculea" means "son of Dracul". His father joined the Order of the Dragon — "dracul" = "the dragon".',
    notes: 'Vlad III ruled Wallachia (southern Romania) in 1448, 1456–1462 and 1476. Nickname "Țepeș" (the Impaler) came later. The vampire link is 100% Stoker. Source: Encyclopaedia Britannica, "Vlad the Impaler".' },
  { s: 'Bram Stoker travelled across Romania to research his novel.', a: false, tag: 'HISTORY', img: null,
    ex: 'Stoker never set foot in Romania. He researched Transylvania in libraries — travel books, maps and folklore collections.',
    take: 'The most famous story about Transylvania was written by someone who never saw it.',
    notes: 'Widely documented by Stoker biographers; his working notes (Rosenbach Museum, Philadelphia) show library research. Source: Britannica, "Dracula (novel)".' },
  { s: 'Bran Castle was Vlad the Impaler\'s home.', a: false, tag: 'MYTH', img: 'bran',
    ex: 'There is no evidence Vlad ever lived there. Tourism made it "Dracula\'s Castle" because it looks the part. In 1920 the city of Brașov gave it to Queen Marie of Romania.',
    take: 'Inside, it is mostly a museum about a queen — not a vampire.',
    notes: 'Bran was built in the late 14th century as a customs fortress on the Wallachia–Transylvania pass. Royal residence 1920–1947. Source: Bran Castle museum; Britannica.' },
  { s: 'Romania has the largest brown bear population in Europe outside Russia.', a: true, tag: 'FACT', img: 'bear',
    ex: 'A national DNA study presented in 2025 estimated roughly 10,600–12,800 brown bears, mostly in the Carpathian forests.',
    take: 'Hiking in the Carpathians? Bears are real neighbours here — not a legend.',
    notes: 'Genetic census of ~24,000 samples (2022–2025), presented by the Environment Ministry in Dec 2025: 10,657–12,787 bears. WWF (2024): Romania holds ~43% of the EU\'s bears. Sources: Xinhua/The Star Dec 2025; WWF CEE Aug 2024.' },
  { s: 'Bucharest\'s Palace of the Parliament is the heaviest building in the world.', a: true, tag: 'FACT', img: 'parliament',
    ex: 'It holds the Guinness World Record for the heaviest building. Construction started in 1984 under the communist dictator Nicolae Ceaușescu.',
    take: 'It has more than 1,000 rooms — and is still not fully used.',
    notes: 'Also one of the largest administrative buildings in the world by floor area. Today it hosts both chambers of Parliament and a contemporary art museum. Source: Guinness World Records; Romanian Parliament site.' },
  { s: 'Romania\'s home internet is among the fastest in the world.', a: true, tag: 'FACT', img: null,
    ex: 'In speed-test rankings, Romania\'s fixed broadband sits near the global top and in Europe\'s top five — and Bucharest has been in the world\'s top 10 cities.',
    take: 'In the 2000s, small local networks cabled apartment blocks building by building — one reason speeds jumped early.',
    notes: 'Ookla Speedtest Global Index (mid-2024): Romania 12th globally, 5th in Europe; Bucharest top 10 cities (~251 Mbps median). Mobile is slower (~38th). Source: Romania Insider, Jun 2024.' },
  { s: 'Romanian is a Slavic language, like Serbian and Bulgarian.', a: false, tag: 'FACT', img: null,
    ex: 'Romanian is a Romance language — it comes from Latin, like Italian, Spanish and French. It does have many Slavic, Turkish and Hungarian loanwords.',
    take: 'Italians, try it: apă = acqua, casă = casa, noapte = notte.',
    notes: 'Romanian descends from the Latin spoken in the Roman provinces along the Danube. It is the main Romance language of Eastern Europe. Source: Britannica, "Romanian language".' },
  { s: 'The Danube Delta is a UNESCO World Heritage Site.', a: true, tag: 'FACT', img: 'delta',
    ex: 'Listed in 1991. It is one of Europe\'s largest wetlands, where the Danube meets the Black Sea — home to over 300 bird species, including huge pelican colonies.',
    take: 'Some villages there are reachable only by boat.',
    notes: 'Also a UNESCO Biosphere Reserve. The Danube flows through 10 countries before reaching the delta. Source: UNESCO World Heritage List no. 588.' },
  { s: 'On 1 March, Romanians give each other a small red-and-white string token.', a: true, tag: 'TRADITION', img: 'martisor',
    ex: 'It\'s the mărțișor — a symbol of spring. People give it to friends, family and colleagues and wear it for days or weeks.',
    take: 'Bulgarians do it too: the martenitsa. UNESCO listed the tradition in 2017 for Bulgaria, Moldova, North Macedonia and Romania.',
    notes: 'UNESCO ICH 2017: "Cultural practices associated to the 1st of March". Ask the Bulgarian participants to show how they tie theirs!' },
  { s: 'Romania has a cemetery famous for colourful graves with funny poems.', a: true, tag: 'FACT', img: 'merry',
    ex: 'The Merry Cemetery in Săpânța, Maramureș. Carved wooden crosses are painted bright blue, with scenes and humorous poems about the people buried there.',
    take: 'The tradition was started in 1935 by local woodcarver Stan Ioan Pătraș.',
    notes: 'Over 800 crosses today. The poems often joke about the person\'s habits — a celebration of life rather than a mourning of death.' }
];

/* ---------- LEVEL 02: EXPLORE THE MAP ---------- */
const L2 = [
  { id: 'transylvania', name: 'Transylvania', lon: 24.4, lat: 46.6, img: 'sighisoara',
    desc: 'The heart of the country, inside the Carpathian arc — a mix of Romanian, Hungarian and Saxon (German) heritage.',
    facts: ['The name comes from Latin: "the land beyond the forest".', 'Its German name, Siebenbürgen, means "seven fortresses".', 'The medieval citadel of Sighișoara is a UNESCO site — and people still live in it.'],
    q: 'What does "Transylvania" mean?', opts: ['Land of vampires', 'Beyond the forest', 'Seven mountains'], c: 1,
    notes: 'Saxon settlers arrived from the 12th century. Villages with fortified churches and Sighișoara are UNESCO-listed (1993/1999).' },
  { id: 'maramures', name: 'Maramureș', lon: 24.0, lat: 47.72, img: 'maramures',
    desc: 'Far north, by the Ukrainian border: wooden villages where old traditions are still everyday life.',
    facts: ['Eight wooden churches here are on the UNESCO World Heritage list.', 'Their tall, thin bell towers can reach over 50 metres.', 'Home of the Merry Cemetery in Săpânța.'],
    q: 'The crosses of the Merry Cemetery are painted which colour?', opts: ['Black', 'Blue', 'Gold'], c: 1,
    notes: 'UNESCO "Wooden Churches of Maramureș" (1999): Bârsana, Budești, Desești, Ieud, Plopiș, Poienile Izei, Rogoz, Șurdești. Șurdești\'s tower is ~54 m.' },
  { id: 'carpathians', name: 'The Carpathians', lon: 24.75, lat: 45.62, img: 'transf',
    desc: 'A mountain arc that wraps around Transylvania — wild forests, bears, wolves and lynx.',
    facts: ['Highest peak: Moldoveanu, 2,544 m, in the Făgăraș Mountains.', 'The Transfăgărășan road (built 1970–1974) zig-zags across them.', 'In 2009 the TV show Top Gear called it "the best road in the world".'],
    q: 'What did Top Gear call the Transfăgărășan?', opts: ['The best road in the world', 'The most dangerous road', 'The longest road'], c: 0,
    notes: 'The upper Transfăgărășan is usually closed from November to June/July because of snow.' },
  { id: 'bucharest', name: 'Bucharest', lon: 26.1, lat: 44.43, img: 'parliament',
    desc: 'The capital and biggest city — Belle Époque palaces, communist mega-buildings and glass towers side by side.',
    facts: ['Between the World Wars it was nicknamed "Little Paris".', 'It has its own Arc de Triomphe.', 'Home of the Palace of the Parliament — the world\'s heaviest building.'],
    q: 'What was Bucharest\'s nickname?', opts: ['Little Vienna', 'Little Rome', 'Little Paris'], c: 2,
    notes: 'The current Arcul de Triumf dates from 1936. Lipscani (Old Town) is the nightlife centre.' },
  { id: 'delta', name: 'The Danube Delta', lon: 29.15, lat: 45.15, img: 'delta',
    desc: 'Where Europe\'s second-longest river meets the Black Sea — a maze of channels, reeds and lakes.',
    facts: ['UNESCO World Heritage Site since 1991.', 'Over 300 bird species live here, including pelicans.', 'The Danube flows through 10 countries before arriving.'],
    q: 'How many countries does the Danube flow through?', opts: ['6', '10', '14'], c: 1,
    notes: 'Germany, Austria, Slovakia, Hungary, Croatia, Serbia, Romania, Bulgaria, Moldova, Ukraine. Serbian and Bulgarian participants: it flows past your capitals/borders too!' },
  { id: 'coast', name: 'The Black Sea Coast', lon: 28.65, lat: 44.17, img: 'constanta',
    desc: 'Beaches, festivals and one of Romania\'s oldest cities: Constanța, once the Greek colony of Tomis.',
    facts: ['The Roman poet Ovid was exiled to Tomis in the year 8 AD — and died there.', 'The Port of Constanța is the largest port on the Black Sea.', 'Its Art Nouveau Casino (1910) stands right on the seafront.'],
    q: 'Which famous Roman poet was exiled to Constanța (Tomis)?', opts: ['Virgil', 'Ovid', 'Horace'], c: 1,
    notes: 'Italian participants: Ovid (Publius Ovidius Naso) was born in Sulmona, Abruzzo. A statue of him stands in Ovid Square, Constanța.' }
];

/* ---------- LEVEL 03: FOOD DETECTIVE ---------- */
const L3 = [
  { name: 'Sarmale', img: 'sarmale', opts: ['Sarmale', 'Mici', 'Papanași', 'Cozonac'], c: 0,
    inside: 'Cabbage leaves (often pickled) rolled around minced pork, rice and spices, slow-cooked for hours.',
    when: 'Christmas, weddings and big family celebrations — with mămăligă and sour cream.',
    fact: 'Neighbours make it too: sarma in Serbia and Turkey, sarmi in Bulgaria. The name comes from Turkish "sarmak" — to wrap.',
    notes: 'There are countless regional versions — with vine leaves in summer, with smoked meat in some regions.' },
  { name: 'Mici', img: 'mici', opts: ['Ciorbă', 'Mici', 'Zacuscă', 'Sarmale'], c: 1,
    inside: 'Grilled, skinless rolls of minced meat (beef, often mixed with pork or lamb), garlic and spices such as thyme.',
    when: 'Every barbecue — above all on 1 May — with mustard, bread and usually a beer.',
    fact: 'Legend says they were invented in a Bucharest inn in the 19th century, when the cook ran out of sausage casings. (Legend, not proven!)',
    notes: 'Full name "mititei" = "the little ones". Romanians grill millions of them on 1 May (Labour Day).' },
  { name: 'Mămăligă', img: 'mamaliga', opts: ['Salată de boeuf', 'Cozonac', 'Mămăligă', 'Papanași'], c: 2,
    inside: 'A thick porridge of maize (corn) flour, water and salt.',
    when: 'Served with cheese and sour cream, or next to sarmale. Once the everyday "bread" of Romanian villages.',
    fact: 'Italians call it polenta. Serbs and Bulgarians call it kačamak / kachamak.',
    notes: 'Maize arrived in the region from the Americas in the 17th century; before that a similar dish was made from millet.' },
  { name: 'Papanași', img: 'papanasi', opts: ['Papanași', 'Cozonac', 'Mici', 'Ciorbă'], c: 0,
    inside: 'Doughnuts made with soft fresh cheese, fried (or boiled), topped with sour cream and jam — usually sour cherry.',
    when: 'A favourite dessert, at restaurants and at home.',
    fact: 'The classic look: a big ring with a small ball on top, like a little hat.',
    notes: 'One of the most ordered desserts in Romanian restaurants. The fried version is the most common.' },
  { name: 'Cozonac', img: 'cozonac', opts: ['Zacuscă', 'Cozonac', 'Mămăligă', 'Salată de boeuf'], c: 1,
    inside: 'Sweet yeast bread with a swirl of walnuts, cocoa, raisins or Turkish delight (rahat).',
    when: 'Easter and Christmas — grandmothers often bake several at once.',
    fact: 'Bulgaria has kozunak; Italy\'s panettone is a close cousin.',
    notes: 'The dough needs long kneading and rising — making cozonac is a family event in many homes.' },
  { name: 'Ciorbă', img: 'ciorba', opts: ['Sarmale', 'Ciorbă', 'Mici', 'Papanași'], c: 1,
    inside: 'A sour soup, soured with borș (fermented wheat bran), lemon or sauerkraut juice. The one in the photo is ciorbă de burtă (tripe soup) with sour cream and garlic.',
    when: 'A daily lunch starter. Ciorbă de burtă is a famous folk "hangover cure".',
    fact: 'The word comes from Turkish "çorba" — soup. Turkish participants will recognise it!',
    notes: 'Main versions: ciorbă de perișoare (meatballs), de fasole (beans), de burtă (tripe), de legume (vegetables).' },
  { name: 'Salată de boeuf', img: 'boeuf', opts: ['Salată de boeuf', 'Zacuscă', 'Cozonac', 'Mămăligă'], c: 0,
    inside: 'Boiled potatoes and carrots, meat (beef or chicken), pickles and peas, all bound with mayonnaise and decorated on top.',
    when: 'The star of New Year\'s Eve and holiday tables.',
    fact: 'A cousin of the Russian Olivier salad. The French-sounding name just means "beef salad".',
    notes: 'Families argue about the right decoration — olives, pepper strips or mayonnaise patterns.' },
  { name: 'Zacuscă', img: 'zacusca', opts: ['Ciorbă', 'Papanași', 'Zacuscă', 'Sarmale'], c: 2,
    inside: 'A spread of roasted aubergine and/or red peppers, onion, tomato and oil, cooked slowly.',
    when: 'Made in autumn, stored in jars for winter and eaten on bread.',
    fact: 'The word comes from the Slavic "zakuska" — snack or appetiser.',
    notes: 'Serbian and Bulgarian participants: it is close to ajvar and lyutenitsa — ask them to compare!' }
];

/* ---------- LEVEL 04: LANGUAGE CHAOS ---------- */
const L4_LETTERS = [
  ['ă', 'uh', 'like the "a" in "about"'],
  ['â / î', 'ih', 'a deep sound from the throat — no English twin'],
  ['ș', 'sh', 'as in "shoe"'],
  ['ț', 'ts', 'as in "cats"'],
  ['ce / ci', 'che / chi', 'as in "chess", "cheese"'],
  ['che / chi', 'ke / ki', 'as in "kettle", "key"']
];
const L4_ROUNDS = [
  { round: 'ROUND 1 · WARM-UP', words: [
    { w: 'Bună!', say: 'BOO-nuh', mean: 'Hi!', opts: ['Hi!', 'Goodbye!', 'Good night!'], c: 0, note: 'Literally "good (one)". Short for "Bună ziua" — good day.' },
    { w: 'Noroc!', say: 'no-ROK', mean: 'Cheers! / Good luck!', opts: ['Sorry!', 'Cheers!', 'Watch out!'], c: 1, note: 'Used for toasts — and also as a casual hello in some regions.' },
    { w: 'Ce faci?', say: 'cheh FAHTCH', mean: 'How are you?', opts: ['What time is it?', 'Where are you?', 'How are you?'], c: 2, note: 'Literally "what are you doing?". Answer: "Bine!" (BEE-neh) — good!' }
  ] },
  { round: 'ROUND 2 · LEVEL UP', words: [
    { w: 'Mulțumesc!', say: 'mool-tsoo-MESK', mean: 'Thank you!', opts: ['Thank you!', 'Excuse me!', 'Delicious!'], c: 0, note: 'The ț is a "ts". The most useful word of the week.' },
    { w: 'Poftă bună!', say: 'POHF-tuh BOO-nuh', mean: 'Enjoy your meal!', opts: ['Good morning!', 'Enjoy your meal!', 'Have a nice trip!'], c: 1, note: 'Like "buon appetito" / "afiyet olsun" / "dobar tek".' },
    { w: 'Bine ai venit!', say: 'BEE-neh eye veh-NEET', mean: 'Welcome!', opts: ['See you soon!', 'Well done!', 'Welcome!'], c: 2, note: 'To a group: "Bine ați venit!" (BEE-neh ahts veh-NEET).' }
  ] },
  { round: 'ROUND 3 · HARD MODE', words: [
    { w: 'Dragoste', say: 'DRAH-goh-steh', mean: 'Love', opts: ['Dragon', 'Love', 'Drink'], c: 1, note: 'Not a dragon! (That would be "dragon" or "balaur".)' },
    { w: 'Îmbrățișare', say: 'um-bruh-tsee-SHAH-reh', mean: 'Hug', opts: ['Hug', 'Embarrassment', 'Umbrella'], c: 0, note: 'Five syllables of warmth. Hard mode unlocked.' },
    { w: 'Dor', say: 'DOR (roll the r!)', mean: 'Longing — missing someone or somewhere', opts: ['Door', 'Gold', 'Longing'], c: 2, note: 'Often called "untranslatable": a deep, sweet-and-sad missing of a person, place or time. Close to Portuguese "saudade".' }
  ] }
];
const L4_TWISTERS = [
  { w: 'Șase sași în șase saci.', say: 'SHAH-seh SAHSH un SHAH-seh SAHCH', mean: 'Six Saxons in six sacks.', note: 'The classic. Say it three times, fast.' },
  { w: 'Capra calcă piatra, piatra crapă-n patru.', say: 'KAH-prah KAHL-kuh PYAH-trah, PYAH-trah KRAH-puhn PAH-troo', mean: 'The goat steps on the stone, the stone cracks in four.', note: 'The full version continues with a playful curse on the goat. Boss level of Romanian tongue twisters.' }
];

/* ---------- LEVEL 05: OLD vs NEW ---------- */
const L5 = [
  { title: 'Wooden church, Maramureș', img: 'maramures', a: 'OLD',
    ex: 'Built in the 18th century from local wood by village carpenters, with a needle-like bell tower. Eight of these churches are UNESCO-listed.',
    notes: 'Bârsana church (1711–1720), part of the UNESCO "Wooden Churches of Maramureș".' },
  { title: 'A festival in a stadium', img: 'untold', a: 'NEW',
    ex: 'Untold, in Cluj-Napoca. It started in 2015 — and was named Best Major Festival at the European Festival Awards after its very first edition.',
    notes: 'European Festival Awards 2015 (gala Jan 2016, Groningen) — beat Tomorrowland and Sziget in that category. Electric Castle (near Cluj) is another big one.' },
  { title: 'An embroidered blouse', img: 'blouse', a: 'BOTH',
    ex: 'The "ie" is centuries-old folk dress — and today a fashion item worn in cities. UNESCO listed the art of the blouse with "altiță" embroidery in 2022.',
    notes: 'Inscribed Dec 2022 with the Republic of Moldova. 24 June is celebrated as the Universal Day of the Romanian Blouse, an idea launched online in 2013. Photo: a historic blouse from a museum collection.' },
  { title: 'Hand-painted pottery', img: 'horezu', a: 'OLD',
    ex: 'Horezu ceramics: red clay painted with roosters, spirals and stars. A traditional craft passed down in families — UNESCO-listed in 2012 and still made today.',
    notes: 'Horezu is in Vâlcea county. UNESCO ICH 2012: "Craftsmanship of Horezu ceramics".' },
  { title: 'Glass towers in Bucharest', img: 'business', a: 'NEW',
    ex: 'Bucharest is a tech hub. UiPath, founded in Bucharest in 2005, became Romania\'s first "unicorn" (a start-up worth over $1 billion) and listed on the New York Stock Exchange in 2021.',
    notes: 'Bucharest and Cluj-Napoca host large IT industries; software outsourcing and start-ups are a major growing sector.' },
  { title: 'Peasant houses in the capital', img: 'village', a: 'BOTH',
    ex: 'The National Village Museum: real historic houses, mills and churches moved from villages all over Romania into a park in the middle of modern Bucharest. Open since 1936.',
    notes: 'Named after sociologist Dimitrie Gusti. Next to King Michael I (Herăstrău) Park.' },
  { title: 'The călușari dancers', img: 'calusari', a: 'OLD',
    ex: 'Căluș is an ancient ritual dance of men with sticks and bells, believed to bring health and luck. It is on UNESCO\'s intangible heritage list.',
    notes: 'UNESCO ICH: proclaimed 2005, inscribed 2008 ("Căluș tradition"). Performed around Whitsun (Rusalii).' },
  { title: 'A red-and-white token', img: 'martisor', a: 'BOTH',
    ex: 'Mărțișor is centuries old — but today it is designed by artists, sold on every corner in late February and given at schools and offices.',
    notes: 'Shared with Bulgaria (martenitsa). UNESCO 2017.' },
  { title: 'A dance-pop hit', img: null, label: 'MR. SAXOBEAT', a: 'NEW',
    ex: 'Romanian pop goes global: Alexandra Stan\'s "Mr. Saxobeat" (2011) became a hit across Europe and beyond. Romania has a big electronic and pop scene.',
    notes: 'Other Romanian exports: Inna, the "Romanian minimal" techno scene. (Careful: "Dragostea din tei" is by O-Zone, a band from the Republic of Moldova.)' }
];

/* ---------- LEVEL 06: SURVIVAL SIMULATOR ---------- */
const L6 = [
  { title: 'THE FAMILY DINNER', s: 'You have eaten three plates. The host looks worried: "But you\'ve barely eaten anything!"',
    opts: [['Leave immediately', 'The host packs food for the road anyway. You leave with 2 kg of sarmale.'],
           ['Politely refuse another serving', 'Accepted… the first time. The second offer arrives in 30 seconds.'],
           ['Say "just a little more"', 'Perfect. The host is delighted. You are now family.']], best: 2, label: 'JOKE',
    culture: 'Hosts often offer food several times — it\'s hospitality. Refusing politely is fine; you may just need to say it twice.' },
  { title: 'VIN IMEDIAT', s: 'Someone tells you: "Vin imediat!" — "I\'ll be right back!" How long do you wait?',
    opts: [['1 minute', 'Optimist detected. Please sit down.'],
           ['15 minutes', 'Realistic. You survived.'],
           ['Bring a sleeping bag', 'Dramatic. But at least you\'re comfortable.']], best: 1, label: 'STEREOTYPE',
    culture: '"Imediat" literally means "immediately" — in casual talk it\'s flexible. It\'s a running joke; plenty of Romanians are very punctual.' },
  { title: 'GRANDMA\'S HOUSE', s: 'You visit a Romanian grandmother. You only came to say hello. Can you leave without eating?',
    opts: [['Yes — "I already ate"', 'She hears "I\'m starving". Soup is served.'],
           ['Accept "just a coffee"', 'The coffee arrives with cake, cozonac and three kinds of jam.'],
           ['Sit down. The table is already set.', 'Correct. Resistance was never an option.']], best: 2, label: 'JOKE',
    culture: 'For many grandparents, feeding guests is how they show love. Saying "mulțumesc, a fost delicios!" (thank you, it was delicious) wins hearts.' },
  { title: 'THE WEDDING', s: 'You are at a Romanian wedding. Music starts. Everyone grabs hands. The hora begins.',
    opts: [['Hide in the bathroom', 'They find you. They always find you.'],
           ['Join the circle and hold hands', 'Survived! Even if you stepped on three feet.'],
           ['Film it from your chair', 'Great video. Then an aunt pulls you into the circle anyway.']], best: 1, label: 'TRADITION',
    culture: 'The hora is a circle dance everyone joins. Romanian weddings often last until morning, and guests traditionally give a money gift in an envelope.' },
  { title: 'JUST ONE COFFEE', s: 'A friend invites you for "a quick coffee". Two hours later, nobody has moved.',
    opts: [['Check your watch and leave', 'Technically correct. Socially risky.'],
           ['Order another coffee', 'Survived. This is what a quick coffee means.'],
           ['Invite everyone to lunch', 'Legendary move. The coffee becomes dinner.']], best: 1, label: 'STEREOTYPE',
    culture: 'Coffee on a terrace is about the people, not the coffee. Long, slow conversations are a big part of social life — Turks, Serbs and Italians will recognise this.' },
  { title: 'THE MYSTERY PARTY', s: 'It\'s 30 November. Your friend Andrei says it\'s not his birthday — but everyone keeps calling him.',
    opts: [['Ignore it, it\'s not his birthday', 'Andrei is a little hurt. Everyone else remembered.'],
           ['Text him "La mulți ani!"', 'Survived! "To many years!" — perfect wishes.'],
           ['Ask where the cake is', 'Fair question. There probably is cake.']], best: 1, label: 'TRADITION',
    culture: 'Romanians celebrate name days — the feast day of the saint they are named after. 30 November is St Andrew, patron saint of Romania. Folklore says the night before, garlic on the windows keeps spirits away.' },
  { title: 'THE BUS', s: 'It\'s 35°C on the bus. You open a window. An older lady stares at you in horror.',
    opts: [['Close it and apologise', 'Survived. You avoided "the draft".'],
           ['Explain thermodynamics', 'She has heard of physics. She has also heard of "curent".'],
           ['Open another window', 'Bold. The whole bus now has an opinion.']], best: 0, label: 'STEREOTYPE',
    culture: 'Many people — especially older generations — believe a draft ("curent") makes you ill. Serbs call it "promaja": a famous belief across the Balkans!' }
];

/* ---------- LEVEL 07: BALKAN & EUROPE SHOWDOWN ---------- */
const COUNTRIES = [
  { id: 'RO', name: 'Romania' }, { id: 'RS', name: 'Serbia' }, { id: 'BG', name: 'Bulgaria' },
  { id: 'TR', name: 'Turkey' }, { id: 'CZ', name: 'Czechia' }, { id: 'IT', name: 'Italy' }
];
const L7 = [
  { title: 'CHEERS!', q: 'Which of these toasts is Czech?', opts: ['Noroc!', 'Živeli!', 'Nazdrave!', 'Na zdraví!'], c: 3,
    reveal: [['RO', 'Noroc!'], ['RS', 'Živeli!'], ['BG', 'Nazdrave!'], ['TR', 'Şerefe!'], ['CZ', 'Na zdraví!'], ['IT', 'Salute! / Cin cin!']],
    share: 'Everyone: raise an imaginary glass and teach the room your toast.',
    notes: 'Notice how Czech "na zdraví" and Bulgarian "nazdrave" both mean "to health" — Slavic cousins.' },
  { title: 'WRAPPED', q: 'In how many of our six countries is a stuffed leaf roll called sarma / sarmale / sarmi?', opts: ['2', '4', '6'], c: 1,
    reveal: [['RO', 'sarmale'], ['RS', 'sarma'], ['BG', 'sarmi'], ['TR', 'sarma'], ['CZ', '—'], ['IT', '—']],
    share: 'Whose version is the best? (Answer diplomatically.)',
    notes: 'From Turkish "sarmak" (to wrap). Czechia and Italy have other stuffed dishes but not under this name.' },
  { title: 'CORN CODE', q: 'Which one is NOT a cornmeal dish?', opts: ['Polenta', 'Kačamak', 'Mămăligă', 'Guláš'], c: 3,
    reveal: [['IT', 'polenta'], ['RS', 'kačamak'], ['BG', 'kachamak'], ['RO', 'mămăligă'], ['TR', 'kuymak / mıhlama (Black Sea)'], ['CZ', 'guláš = meat stew!']],
    share: 'Italians vs Romanians: is polenta the same as mămăligă? Discuss.',
    notes: 'Turkish Black Sea region: kuymak/mıhlama = cornmeal cooked with butter and cheese.' },
  { title: 'COFFEE CLUB', q: 'Which coffee tradition has its own UNESCO intangible-heritage listing?', opts: ['Turkish coffee', 'Czech filter coffee', 'Romanian frappé'], c: 0,
    reveal: [['TR', 'Turkish coffee culture — UNESCO 2013'], ['IT', 'Italian cooking — UNESCO 2025'], ['RS', 'domaća kafa'], ['BG', 'Turkish-style coffee is common'], ['RO', 'cafea la ibric'], ['CZ', 'kavárna culture']],
    share: 'How do you drink coffee at home — and how long does "one coffee" last?',
    notes: 'UNESCO ICH 2013: "Turkish coffee culture and tradition". Italian cooking was inscribed in Dec 2025 (New Delhi session). Turkish coffee fortune telling (kahve falı) is a fun follow-up.' },
  { title: 'FIRST OF MARCH', q: 'Which other participating country ties red-and-white threads on 1 March?', opts: ['Italy', 'Bulgaria', 'Czechia', 'Turkey'], c: 1,
    reveal: [['RO', 'mărțișor'], ['BG', 'martenitsa']],
    share: 'Bulgarian team: when do you take your martenitsa off?',
    notes: 'Bulgarian tradition: wear it until you see a stork or a blossoming tree, then tie it to a branch. UNESCO 2017 (BG, MD, MK, RO).' },
  { title: 'CIRCLE OF FRIENDS', q: 'Kolo, horo, hora, halay — what are they?', opts: ['Cheeses', 'Circle dances', 'Card games'], c: 1,
    reveal: [['RS', 'kolo — UNESCO 2017'], ['BG', 'horo'], ['RO', 'hora'], ['TR', 'halay, horon']],
    share: 'Can we make one giant circle with steps from every country? Try it now!',
    notes: 'Serbian kolo inscribed on UNESCO list in Dec 2017. Great moment to get everyone up for 30 seconds.' },
  { title: 'BORROWED WORDS', q: 'Romanian "tavan" (ceiling), "dulap" (cupboard) and "ciorap" (sock) come from which language?', opts: ['Italian', 'Turkish', 'Czech'], c: 1,
    reveal: [['TR', 'tavan, dolap, çorap'], ['CZ', 'gave the world the word "robot"'], ['IT', 'gave Romanian its Latin roots']],
    share: 'Find a word that sounds the same in your language and someone else\'s.',
    notes: '"Robot" comes from Karel Čapek\'s play R.U.R. (1920); the word was suggested by his brother Josef, from "robota" (forced labour).' },
  { title: 'SOUNDS FAMILIAR', q: 'Romanian "noapte", "apă", "frate" — which language sounds closest?', opts: ['Italian', 'Bulgarian', 'Turkish'], c: 0,
    reveal: [['RO', 'noapte · apă · frate'], ['IT', 'notte · acqua · fratello']],
    share: 'Italians: read a Romanian sentence out loud — can you understand it?',
    notes: 'Both from Latin nox/noctem, aqua, frater. Try: "Ce mai faci, frate?" — "How are you doing, brother?"' },
  { title: 'YOUR NEXT ADVENTURE', q: 'Which tradition would you most like to experience?', kind: 'opinion',
    opts: ['A Romanian wedding hora', 'Turkish coffee fortune telling', 'A Serbian slava', 'Bulgarian kukeri masks', 'Czech masopust carnival', 'An Italian Sunday lunch'],
    share: 'Find someone from that country tonight and ask them about it.',
    notes: 'Serbian slava (UNESCO 2014), Bulgarian kukeri/Surova (UNESCO 2015), Czech Shrovetide processions in Hlinecko (UNESCO 2010).' }
];

/* ---------- LEVEL 08: FINAL BOSS ---------- */
const L8 = [
  { q: 'Which region did the real Vlad "Drăculea" rule?', opts: ['Wallachia', 'Transylvania', 'Maramureș', 'Hungary'], c: 0 },
  { q: 'How many times did Bram Stoker visit Romania?', opts: ['Never', 'Once', 'Three times', 'He lived there'], c: 0 },
  { q: 'What does "Transylvania" mean?', opts: ['Land of vampires', 'Beyond the forest', 'Seven mountains', 'Silver valley'], c: 1 },
  { q: 'The Palace of the Parliament holds which world record?', opts: ['Tallest', 'Oldest', 'Heaviest building', 'Most windows'], c: 2 },
  { q: 'Mămăligă is made from…', opts: ['Potatoes', 'Maize (corn) flour', 'Rice', 'Wheat'], c: 1, mult: 2 },
  { q: '"Noroc!" means…', opts: ['Goodbye!', 'Sorry!', 'Cheers! / Good luck!', 'Help!'], c: 2 },
  { q: 'Which Roman poet was exiled to Constanța?', opts: ['Ovid', 'Virgil', 'Dante', 'Homer'], c: 0 },
  { q: '"Sarmale" comes from the Turkish "sarmak", meaning…', opts: ['To boil', 'To wrap', 'To share', 'To eat'], c: 1 },
  { q: 'The Merry Cemetery is in which region?', opts: ['Danube Delta', 'Bucharest', 'Maramureș', 'Black Sea coast'], c: 2 },
  { q: 'How many countries does the Danube flow through?', opts: ['4', '6', '10', '14'], c: 2, mult: 2 },
  { q: '"Dor" is best translated as…', opts: ['Door', 'Gold', 'Anger', 'Longing'], c: 3 },
  { q: 'What do Romanians give each other on 1 March?', opts: ['Mărțișor', 'Cozonac', 'Garlic', 'Mici'], c: 0, mult: 3 }
];

/* ---------- LEVEL INDEX ---------- */
const LEVELS = [
  { id: 1, code: 'L1', title: 'MYTH OR REALITY?', short: 'Truth detection', xp: 1000, theme: 'case',
    brief: 'Ten statements about Romania. Some are true. Some are pure legend. Vote TRUE or FALSE.' },
  { id: 2, code: 'L2', title: 'EXPLORE THE MAP', short: 'Adventure map', xp: 600, theme: 'map',
    brief: 'Six destinations. Unlock each one, learn its secrets, survive its challenge.' },
  { id: 3, code: 'L3', title: 'FOOD DETECTIVE', short: 'Guess the dish', xp: 800, theme: 'food',
    brief: 'Eight dishes, hidden behind pixels. Guess early for glory.' },
  { id: 4, code: 'L4', title: 'LANGUAGE CHAOS', short: 'Say it like a local', xp: 1200, theme: 'lang',
    brief: 'Learn the sounds, guess the meanings — then a volunteer takes on the tongue twister.' },
  { id: 5, code: 'L5', title: 'OLD vs NEW', short: 'Tradition or today?', xp: 900, theme: 'oldnew',
    brief: 'Is it old Romania, new Romania — or both at once?' },
  { id: 6, code: 'L6', title: 'SURVIVAL SIMULATOR', short: 'Social survival', xp: 700, theme: 'survival',
    brief: 'Seven real-life Romanian situations. Choose wisely. Your survival depends on it.' },
  { id: 7, code: 'L7', title: 'BALKAN & EUROPE SHOWDOWN', short: 'Six countries, one table', xp: 800, theme: 'showdown',
    brief: 'Romania, Serbia, Bulgaria, Turkey, Czechia, Italy — more alike than you think.' },
  { id: 8, code: 'L8', title: 'FINAL BOSS', short: 'The Romania quiz', xp: 1500, theme: 'boss',
    brief: 'Twelve questions. A timer. Bonus rounds. Defeat the boss to unlock Romania.' }
];

const PHOTO_CREDITS = Object.entries(IMG_FILES).map(([k, f]) => ({ key: k, file: f, page: 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(f) }));
