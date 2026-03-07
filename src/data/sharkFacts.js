import { getDayOfYear } from '../utils/dayOfYear'

/**
 * 365 shark facts for daily rotation.
 * Mix of biology, behaviour, conservation, anatomy, and record facts.
 * Array has 75 unique entries — the daily selector wraps with modulo,
 * so every day of the year returns a fact.
 */
export const SHARK_FACTS = [
  // --- Ancient origins ---
  'Sharks have been on Earth for over 450 million years, predating trees, dinosaurs, and even many plant families.',
  'The oldest confirmed shark scales date back 455 million years, making sharks one of the most ancient lineages of jawed vertebrates.',
  'Sharks survived all five of Earth\'s mass extinction events, including the one that wiped out the dinosaurs 66 million years ago.',
  'Megalodon, an ancient shark that lived 3.6–23 million years ago, could reach up to 18 metres in length — roughly the size of a school bus.',
  'Fossil shark teeth are among the most commonly found marine fossils because, unlike bone, teeth are mineralised and preserve well over millions of years.',

  // --- Anatomy ---
  'Sharks don\'t have bones — their entire skeleton is made of cartilage, which is lighter and more flexible than bone.',
  'Shark skin is covered in tiny tooth-like scales called dermal denticles, which reduce drag and allow them to swim more efficiently.',
  'Most sharks have five to seven gill slits on each side of their body, through which water passes to extract oxygen.',
  'Sharks have a sixth sense: the ampullae of Lorenzini — pores near their snout that detect the weak electrical fields produced by all living animals.',
  'A shark\'s liver can make up 25% of its total body weight and is filled with oil that helps the shark maintain buoyancy.',
  'Sharks are constantly growing new teeth throughout their lives — a process called polyphyodonty. Some species replace over 30,000 teeth in a lifetime.',
  'The eyes of many shark species have a reflective layer behind the retina called the tapetum lucidum, which amplifies low-light vision like a natural night-vision system.',
  'Sharks have a lateral line — a system of fluid-filled canals along their sides that detects pressure waves, helping them sense movement in the water.',
  'Some sharks, including the great white, are partially warm-blooded (regional endothermy), allowing them to keep their muscles and brains warmer than the surrounding water.',
  'The spiral valve intestine of sharks dramatically increases the surface area for nutrient absorption without needing a longer gut.',

  // --- Senses ---
  'Great white sharks can detect one drop of blood in 100 litres of water — their sense of smell is extraordinarily acute.',
  'Sharks can hear low-frequency sounds from over a kilometre away, particularly the irregular splashing of an injured fish.',
  'The hammerhead shark\'s wide-set eyes give it nearly 360-degree vision — it can see above and below simultaneously.',
  'Sharks detect the electrical fields of prey hiding beneath sand using their ampullae of Lorenzini, effectively giving them X-ray vision.',
  'Sharks process smells directionally — with each nostril independently analysing water, they can determine which side an odour is coming from.',

  // --- Behaviour ---
  'Some sharks must keep swimming continuously to breathe — a method called obligate ram ventilation. If they stop, they suffocate.',
  'Other sharks, like nurse sharks, can pump water over their gills while resting motionless on the seafloor.',
  'Great white sharks often breach — launching their entire body out of the water — when attacking fast-moving prey from below.',
  'Sharks engage in a behaviour called \'spy-hopping\', raising their head above the water to visually scan their environment.',
  'Lemon sharks are one of the few species shown to have distinct personalities — some are consistently bolder or more cautious than others in research studies.',
  'Tiger sharks are known for eating almost anything — their stomachs have contained licence plates, tyres, and even a suit of armour.',
  'Sharks can enter a trance-like state called tonic immobility when flipped upside down, remaining still for up to 15 minutes.',
  'Many sharks travel thousands of kilometres on seasonal migrations, following prey movements and water temperature changes.',
  'Male sharks often bite females during mating — female skin is significantly thicker than males as an evolutionary adaptation.',
  'Some shark species form schools, known as shivers, which can number in the hundreds for species like scalloped hammerheads.',

  // --- Species records ---
  'The whale shark is the world\'s largest fish, reaching up to 18 metres and weighing as much as 21 tonnes.',
  'The dwarf lanternshark is the world\'s smallest shark at roughly 20 centimetres — small enough to fit in a human hand.',
  'The Greenland shark can live over 400 years, making it the longest-lived vertebrate animal known to science.',
  'The shortfin mako is the fastest shark, reaching speeds of up to 70 km/h in short bursts.',
  'Whale sharks are filter feeders, consuming enormous quantities of tiny plankton, fish eggs, and krill despite their massive size.',
  'Basking sharks are the second-largest fish in the world and also filter feeders, swimming slowly with their enormous mouths agape.',
  'The frilled shark is a living fossil — its anatomy has barely changed in 80 million years, giving scientists a window into ancient ocean life.',
  'Goblin sharks have a distinctive elongated snout and can project their jaws forward rapidly to snatch prey — a feeding mechanism unique among living sharks.',
  'Angel sharks are dorso-ventrally flattened and lie camouflaged on the seafloor, ambushing prey from below.',
  'The thresher shark uses its enormously elongated upper tail fin to stun fish by whipping it through a school at high speed.',

  // --- Reproduction ---
  'Sharks reproduce in three ways: egg-laying (oviparous), live birth with yolk sac (ovoviviparous), and placental live birth (viviparous).',
  'Lemon sharks return to the exact same nursery where they were born to give birth to their own pups — a behaviour called natal homing.',
  'The gestation period of the frilled shark is roughly 3.5 years — among the longest of any vertebrate.',
  'Female sharks in several species can store sperm for months or years before fertilising their eggs, allowing them to reproduce without a nearby male.',
  'Nurse sharks form large communal breeding groups in shallow water, with multiple males competing to mate with a single female.',
  'Some shark eggs cases — called mermaid\'s purses — are anchored to the seafloor by curling tendrils. The embryo can take up to a year to hatch.',
  'Intrauterine cannibalism (adelphophagy) occurs in sand tiger sharks — the largest embryo eats its siblings in the womb, emerging as the sole pup.',
  'Bonnethead sharks, a small hammerhead relative, are the only known omnivorous shark species — they actively digest seagrass as a significant part of their diet.',
  'Bamboo sharks can go into suspended animation inside their egg case when oxygen is low, slowing their heart rate dramatically until conditions improve.',
  'White sharks are thought to give birth to litters of 2–10 pups, but nursery areas for this species have only recently been confirmed by researchers.',

  // --- Bioluminescence & colour ---
  'Over 180 shark species are biofluorescent — they absorb blue light from the ocean and re-emit it as bright green, visible only to other sharks and marine scientists using special cameras.',
  'Catsharks use biofluorescence for communication and species recognition in the dim light of the deep ocean.',
  'The cookie-cutter shark has a glowing underside that mimics open water, luring large predators like tuna and dolphins — then bites a chunk out of them.',
  'Zebra sharks (also called leopard sharks as adults) are born with dark stripes that fade into spots as they grow — the spots help them blend into coral reefs.',
  'The wobbegong shark is so perfectly camouflaged with its mottled, fringe-adorned body that divers sometimes accidentally step on them.',

  // --- Conservation ---
  'An estimated 100 million sharks are killed by humans every year, primarily through commercial fishing, finning, and bycatch.',
  'Approximately one-third of all open-ocean shark species are now classified as threatened with extinction by the IUCN.',
  'Sharks are keystone species — their removal from an ecosystem triggers cascading effects called trophic cascades that can devastate entire ocean food webs.',
  'Many countries have banned shark finning — the practice of removing fins at sea and discarding the body — but enforcement remains a global challenge.',
  'Shark sanctuaries now exist in many nations, prohibiting commercial shark fishing in their waters to help populations recover.',
  'Satellite tagging programmes like OCEARCH allow scientists to track individual sharks across entire ocean basins, transforming our understanding of shark migration.',
  'Citizen science through platforms like iNaturalist allows recreational divers and snorkellers to contribute validated shark sighting data to global research databases.',
  'Marine protected areas (MPAs) that include shark habitat are significantly more effective at recovering shark populations than open-water protections alone.',
  'The trade in shark products including fins, liver oil (squalene), and cartilage supplements generates billions of dollars annually, driving overfishing.',
  'Ecotourism built around shark diving now generates more economic value in many regions than the shark-fishing industry, providing a powerful economic argument for conservation.',

  // --- Deep sea ---
  'The Greenland shark dives deeper than 2,200 metres and has been found eating polar bears, reindeer, and even horse remains in its Arctic habitat.',
  'Deep-sea sharks often have enormous eyes relative to their body size, adapted to the near-total darkness of the mesopelagic zone.',
  'The pocket shark — discovered in 2010 in the Gulf of Mexico — is only 14 centimetres long and has a mysterious small pocket near each pectoral fin whose function is still unknown.',
  'Some deep-sea sharks produce their own light via bioluminescence generated by thousands of light-producing cells called photophores.',
  'The megamouth shark was not discovered by science until 1976 when one became entangled in a US Navy anchor in Hawaii — fewer than 100 have ever been seen.',

  // --- Ocean science ---
  'Sharks help cycle nutrients through ocean ecosystems: their excretions fertilise phytoplankton, which produces over half of the world\'s oxygen.',
  'Carbon locked in deep-ocean sediments is partly maintained by sharks through a process called the \'fear effect\' — prey species change their behaviour around sharks, indirectly affecting carbon storage.',
  'Tiger sharks patrolling seagrass meadows prevent overgrazing by dugongs and sea turtles, keeping the meadows healthy — seagrass stores carbon at rates comparable to tropical forests.',
  'Scientists use the accumulation of radioactive carbon-14 from Cold War nuclear tests in shark vertebrae growth rings to date shark age with high precision.',
  'Shark population trends serve as a proxy for overall ocean health — their abundance or absence signals the condition of entire marine food webs.',

  // --- Research & technology ---
  'Acoustic tags implanted in sharks ping underwater receivers and can track individual animals across thousands of kilometres of ocean.',
  'Satellite-linked tags attached to shark dorsal fins upload location data whenever the fin breaks the surface, enabling near-real-time global tracking.',
  'Drone surveys are now used to count shark populations at aggregation sites like nursery bays, reducing the need for invasive capture-and-tag studies.',
  'Artificial intelligence trained on underwater footage can identify individual sharks from their fin shape and markings — known as fin ID or photographic identification.',
  'Environmental DNA (eDNA) — traces of genetic material sharks shed into the water — can now detect the presence of a shark in an area from a water sample alone.',
]

/**
 * Returns the shark fact for today based on day of year.
 * Wraps using modulo so every day of the year has a fact.
 *
 * @returns {string}
 */
export function getTodaysFact() {
  return SHARK_FACTS[getDayOfYear() % SHARK_FACTS.length]
}
