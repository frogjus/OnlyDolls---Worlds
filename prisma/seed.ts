import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding OnlyDolls demo data...')

  // 1. Create demo user
  const passwordHash = await hash('demo1234', 10)
  const user = await prisma.user.upsert({
    where: { email: 'demo@onlydolls.world' },
    update: {},
    create: {
      email: 'demo@onlydolls.world',
      name: 'Demo Writer',
      passwordHash,
    },
  })
  console.log(`  User: ${user.email}`)

  // 2. Create story world
  const world = await prisma.storyWorld.create({
    data: {
      name: 'The Shattered Crown',
      description:
        'A sprawling epic fantasy following five bloodlines vying for control of a fractured empire after the assassination of the immortal Emperor. As ancient magic resurfaces and long-buried secrets are unearthed, alliances shift and loyalties are tested.',
      genre: 'Epic Fantasy',
      logline:
        'When an immortal emperor is assassinated, five noble houses must navigate treachery, forbidden magic, and ancient prophecies to claim a throne that may destroy whoever sits upon it.',
      settings: {
        mediaType: 'NOVEL',
        targetWordCount: 120000,
        structureFramework: 'three-act',
      },
      ownerId: user.id,
    },
  })
  console.log(`  World: ${world.name}`)

  // 3. Characters (8 major, interconnected)
  const characters = await Promise.all([
    prisma.character.create({
      data: {
        name: 'Kael Ashford',
        aliases: ['The Bastard Prince', 'Ash'],
        description: 'Illegitimate son of the slain Emperor, raised in exile. Reluctant claimant to the throne who discovers he inherited his father\'s forbidden magic.',
        backstory: 'Born from a secret union between Emperor Aldric and a commoner healer, Kael was hidden in the northern provinces. He grew up believing he was an orphan until a dying messenger revealed his lineage.',
        physicalDesc: 'Tall, lean, with the distinctive silver-streaked dark hair of the Ashford line. A jagged scar runs from his left temple to jaw — a reminder of his first assassination attempt.',
        psychProfile: 'Deeply conflicted between duty and desire for a simple life. Shows compassion that others mistake for weakness. Prone to self-sacrifice.',
        archetype: 'Reluctant Hero',
        goals: JSON.stringify(['Survive', 'Discover the truth about his father\'s death', 'Unite the fractured realm']),
        traits: JSON.stringify(['Compassionate', 'Strategic', 'Self-doubting', 'Loyal']),
        storyWorldId: world.id,
      },
    }),
    prisma.character.create({
      data: {
        name: 'Lysara Venn',
        aliases: ['The Iron Duchess', 'Lady Venn'],
        description: 'Head of House Venn, the most powerful military house. Brilliant strategist who publicly mourns the Emperor while secretly celebrating his death.',
        backstory: 'Watched her mother be executed on the Emperor\'s orders for a crime she didn\'t commit. Has spent 20 years building House Venn into an unstoppable military force, waiting for this moment.',
        physicalDesc: 'Striking woman in her late 40s with sharp features, steel-grey eyes, and close-cropped silver hair. Always wears her mother\'s iron signet ring.',
        psychProfile: 'Calculating and patient, but capable of genuine warmth toward those she trusts. Her vendetta against the crown masks a deep wound of maternal loss.',
        archetype: 'The Contender',
        goals: JSON.stringify(['Claim the throne', 'Avenge her mother', 'Prove House Venn\'s supremacy']),
        traits: JSON.stringify(['Strategic', 'Ruthless', 'Charismatic', 'Haunted']),
        storyWorldId: world.id,
      },
    }),
    prisma.character.create({
      data: {
        name: 'Theron Blackwood',
        aliases: ['The Whisper King'],
        description: 'Spymaster of the old regime who knows every secret in the empire. Plays all sides while pursuing his own mysterious agenda.',
        backstory: 'Once the Emperor\'s most trusted advisor, Theron built an intelligence network spanning the continent. He alone knows who truly ordered the assassination — because he orchestrated it.',
        physicalDesc: 'Unremarkable in appearance — average height, forgettable face. This is by design. Only his eyes betray intelligence: dark, watchful, always cataloging.',
        psychProfile: 'A true Machiavellian who has convinced himself his machinations serve the greater good. Deeply lonely but incapable of genuine connection.',
        archetype: 'The Puppet Master',
        goals: JSON.stringify(['Control the succession', 'Protect his network', 'Prevent the prophecy from being fulfilled']),
        traits: JSON.stringify(['Manipulative', 'Brilliant', 'Paranoid', 'Self-justifying']),
        storyWorldId: world.id,
      },
    }),
    prisma.character.create({
      data: {
        name: 'Mira Solenne',
        aliases: ['The Last Oracle'],
        description: 'Young priestess of the dying Old Faith who begins having visions of the empire\'s destruction — and the one person who can prevent it.',
        backstory: 'Raised in a crumbling temple, Mira was the least remarkable of the acolytes until the Emperor\'s death triggered her latent seer abilities. Now hunted by every faction.',
        physicalDesc: 'Small, dark-skinned, with golden eyes that glow faintly during visions. Ritual scars trace constellation patterns on her forearms.',
        psychProfile: 'Fiercely independent despite institutional upbringing. Terrified of her own power but compelled by duty. Quick-witted and surprisingly funny under pressure.',
        archetype: 'The Prophet',
        goals: JSON.stringify(['Understand her visions', 'Find the true heir', 'Restore the Old Faith']),
        traits: JSON.stringify(['Intuitive', 'Brave', 'Irreverent', 'Burdened']),
        storyWorldId: world.id,
      },
    }),
    prisma.character.create({
      data: {
        name: 'Dorian Ashford',
        aliases: ['The Golden Son'],
        description: 'The Emperor\'s legitimate heir, beloved by the people but secretly weak-willed and manipulated by those around him.',
        backstory: 'Raised in the palace with every advantage, Dorian was groomed for the throne but never taught to actually rule. His father kept real power from him, creating a puppet who doesn\'t know he\'s a puppet.',
        physicalDesc: 'Classically handsome with golden-brown skin and the full Ashford silver hair. Dresses impeccably. His smile never quite reaches his eyes.',
        psychProfile: 'Desperate to prove himself worthy but paralyzed by indecision. Genuinely kind, which makes him dangerous in different ways than his rivals.',
        archetype: 'The Shadow',
        goals: JSON.stringify(['Prove he deserves the throne', 'Step out of his father\'s shadow', 'Find genuine allies']),
        traits: JSON.stringify(['Charming', 'Insecure', 'Well-meaning', 'Naive']),
        storyWorldId: world.id,
      },
    }),
    prisma.character.create({
      data: {
        name: 'Asha Korrath',
        aliases: ['The Blade of the South'],
        description: 'Commander of the southern border garrison, a decorated war hero who sees the succession crisis as a chance to free the oppressed southern provinces.',
        backstory: 'Born into the colonized southern people, Asha rose through military ranks by being twice as good as her peers. The empire that oppresses her people also gave her purpose.',
        physicalDesc: 'Powerfully built, dark-complexioned, with intricate traditional tattoos covering her arms and shoulders. Missing her left ring finger — lost in the Battle of Red Gorge.',
        psychProfile: 'Torn between loyalty to an institution and love for her people. Fierce exterior protects a deep capacity for empathy. Makes decisions with her gut, not her head.',
        archetype: 'The Rebel',
        goals: JSON.stringify(['Liberate the southern provinces', 'Reform the empire', 'Protect her soldiers']),
        traits: JSON.stringify(['Fierce', 'Honorable', 'Conflicted', 'Inspiring']),
        storyWorldId: world.id,
      },
    }),
    prisma.character.create({
      data: {
        name: 'Aldric Ashford',
        aliases: ['The Immortal Emperor', 'The Eternal'],
        description: 'The assassinated Emperor who ruled for 300 years through forbidden magic. Even in death, his shadow dominates the story.',
        backstory: 'Discovered the secret of longevity through blood magic — a pact that required increasingly horrifying sacrifices. His assassination may have been the most merciful act anyone ever did for him.',
        physicalDesc: 'In portraits: ageless, regal, with silver hair and violet eyes that seemed to see through lies. In his final years (known only to Theron): gaunt, hollow, barely human.',
        psychProfile: 'Once idealistic, corrupted by centuries of power and the cost of immortality. Genuinely loved his realm but became the monster it needed protection from.',
        archetype: 'The Fallen King',
        goals: JSON.stringify(['Maintain order (deceased)', 'Protect the realm from what sleeps beneath the throne']),
        traits: JSON.stringify(['Visionary', 'Tyrannical', 'Tragic', 'Corrupted']),
        storyWorldId: world.id,
      },
    }),
    prisma.character.create({
      data: {
        name: 'Fennec',
        aliases: ['The Fox', 'Nobody'],
        description: 'A street thief from the capital\'s underworld who accidentally witnessed the assassination and now holds the most dangerous secret in the empire.',
        backstory: 'An orphan raised by the Thieves\' Guild, Fennec was breaking into the palace treasury the night the Emperor was killed. Saw the assassin\'s face. Has been running ever since.',
        physicalDesc: 'Wiry, quick, with sharp features and mismatched eyes (one brown, one green). Never stays still. Dressed in layers of stolen finery over street clothes.',
        psychProfile: 'Survival instinct overrides everything. Deeply distrustful but starved for genuine connection. Uses humor as armor. Smarter than anyone gives them credit for.',
        archetype: 'The Trickster',
        goals: JSON.stringify(['Survive', 'Sell the secret to the highest bidder', 'Find somewhere safe']),
        traits: JSON.stringify(['Resourceful', 'Cynical', 'Quick-witted', 'Lonely']),
        storyWorldId: world.id,
      },
    }),
  ])
  console.log(`  Characters: ${characters.length}`)

  // 4. Locations (8 locations with hierarchy)
  const throneCity = await prisma.location.create({
    data: {
      name: 'Solhaven',
      description: 'The imperial capital, built around the Shattered Crown — a massive natural crystal formation where the Emperor held court. Now a powder keg of rival factions.',
      type: 'city',
      properties: { population: '500,000', climate: 'Temperate', significance: 'Imperial Capital' },
      storyWorldId: world.id,
    },
  })

  const locations = await Promise.all([
    prisma.location.create({
      data: {
        name: 'The Crystal Throne Room',
        description: 'The heart of the Shattered Crown formation. The throne itself is carved from living crystal that resonates with ancient magic. Since the assassination, the crystals have been slowly turning black.',
        type: 'room',
        parentId: throneCity.id,
        storyWorldId: world.id,
      },
    }),
    prisma.location.create({
      data: {
        name: 'The Warrens',
        description: 'Solhaven\'s sprawling underground district — home to the Thieves\' Guild, black markets, and those who have fallen through the cracks of empire.',
        type: 'district',
        parentId: throneCity.id,
        storyWorldId: world.id,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Ironhold',
        description: 'Fortress-city of House Venn in the western mountains. Built into the cliffs themselves, it has never been conquered. Home to the largest standing army in the empire.',
        type: 'city',
        properties: { population: '120,000', climate: 'Cold/Mountain', significance: 'House Venn Seat' },
        storyWorldId: world.id,
      },
    }),
    prisma.location.create({
      data: {
        name: 'The Temple of Echoes',
        description: 'Last surviving temple of the Old Faith, hidden in a mountain valley. The walls are said to remember every prayer ever spoken within them.',
        type: 'temple',
        properties: { significance: 'Religious', condition: 'Crumbling' },
        storyWorldId: world.id,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Red Gorge',
        description: 'Site of the empire\'s bloodiest battle against the southern rebellion. Now a haunted wasteland where nothing grows and the dead are said to walk.',
        type: 'battlefield',
        properties: { significance: 'Historical', condition: 'Desolate' },
        storyWorldId: world.id,
      },
    }),
    prisma.location.create({
      data: {
        name: 'The Northern Reaches',
        description: 'Frozen frontier provinces where Kael was raised in exile. Harsh, beautiful, and home to people who care nothing for southern politics.',
        type: 'region',
        properties: { climate: 'Arctic', significance: 'Kael\'s homeland' },
        storyWorldId: world.id,
      },
    }),
    prisma.location.create({
      data: {
        name: 'The Sundered Coast',
        description: 'Southern coastal region, home to Asha\'s people. Rich in resources but historically exploited by the empire. Beautiful coral cities built into sea cliffs.',
        type: 'region',
        properties: { climate: 'Tropical', significance: 'Southern homeland' },
        storyWorldId: world.id,
      },
    }),
  ])
  console.log(`  Locations: ${locations.length + 1}`)

  // 5. Acts & Sequences (3-act structure)
  const acts = await Promise.all([
    prisma.act.create({
      data: { name: 'Act I: The Shattering', description: 'The Emperor falls. Five factions scramble for power as ancient forces stir.', position: 1, storyWorldId: world.id },
    }),
    prisma.act.create({
      data: { name: 'Act II: The Reckoning', description: 'Alliances form and break. The true cost of the throne is revealed.', position: 2, storyWorldId: world.id },
    }),
    prisma.act.create({
      data: { name: 'Act III: The Crown Reforged', description: 'The final confrontation. Not all who deserve the throne survive to claim it.', position: 3, storyWorldId: world.id },
    }),
  ])

  const sequences = await Promise.all([
    prisma.sequence.create({ data: { name: 'The Assassination', position: 1, actId: acts[0].id, storyWorldId: world.id } }),
    prisma.sequence.create({ data: { name: 'The Gathering Storm', position: 2, actId: acts[0].id, storyWorldId: world.id } }),
    prisma.sequence.create({ data: { name: 'The War of Whispers', position: 3, actId: acts[1].id, storyWorldId: world.id } }),
    prisma.sequence.create({ data: { name: 'The Prophecy Revealed', position: 4, actId: acts[1].id, storyWorldId: world.id } }),
    prisma.sequence.create({ data: { name: 'The Final March', position: 5, actId: acts[2].id, storyWorldId: world.id } }),
  ])
  console.log(`  Acts: ${acts.length}, Sequences: ${sequences.length}`)

  // 6. Beats (12 beats across the story)
  const beats = await Promise.all([
    prisma.beat.create({ data: { name: 'Opening Image', description: 'The eternal Emperor on his throne, immortal and unchanging — the illusion of stability.', position: 1, status: 'done', starRating: 4, color: '#4f46e5', storyWorldId: world.id, sequenceId: sequences[0].id } }),
    prisma.beat.create({ data: { name: 'The Assassination', description: 'Emperor Aldric is found dead in the Crystal Throne Room. The crystals begin to darken. Fennec witnesses the killer\'s face from the shadows.', position: 2, status: 'done', starRating: 5, color: '#dc2626', storyWorldId: world.id, sequenceId: sequences[0].id, characterId: characters[7].id } }),
    prisma.beat.create({ data: { name: 'Theme Stated', description: 'Theron addresses the council: "Power is not inherited. It is taken." But Mira\'s first vision contradicts him: the crown chooses its bearer.', position: 3, status: 'done', starRating: 4, color: '#7c3aed', storyWorldId: world.id, sequenceId: sequences[0].id } }),
    prisma.beat.create({ data: { name: 'Kael\'s Call to Adventure', description: 'A dying messenger reaches the Northern Reaches: Kael learns he is the Emperor\'s bastard son. He must choose between his quiet life and a claim that will paint a target on his back.', position: 4, status: 'in_progress', starRating: 5, color: '#2563eb', storyWorldId: world.id, sequenceId: sequences[1].id, characterId: characters[0].id } }),
    prisma.beat.create({ data: { name: 'Lysara Mobilizes', description: 'House Venn\'s armies begin their march toward Solhaven. Lysara reveals to her inner circle that she\'s been preparing for this day for 20 years.', position: 5, status: 'in_progress', starRating: 4, color: '#9333ea', storyWorldId: world.id, sequenceId: sequences[1].id, characterId: characters[1].id } }),
    prisma.beat.create({ data: { name: 'Dorian\'s Coronation Attempt', description: 'Dorian attempts a hasty coronation but the Crystal Throne rejects him — it shatters when he sits upon it. Public humiliation shakes his support.', position: 6, status: 'todo', starRating: 5, color: '#f59e0b', storyWorldId: world.id, sequenceId: sequences[2].id, characterId: characters[4].id } }),
    prisma.beat.create({ data: { name: 'The Alliance of Necessity', description: 'Kael and Asha form an unlikely alliance — his claim to the throne and her military force. But their goals are incompatible.', position: 7, status: 'todo', starRating: 4, color: '#10b981', storyWorldId: world.id, sequenceId: sequences[2].id, characterId: characters[0].id } }),
    prisma.beat.create({ data: { name: 'Mira\'s Vision of Doom', description: 'Mira sees the true threat: the Emperor\'s blood magic wasn\'t just for immortality — it was keeping something imprisoned beneath the throne. With his death, the seal is weakening.', position: 8, status: 'todo', starRating: 5, color: '#ef4444', storyWorldId: world.id, sequenceId: sequences[3].id, characterId: characters[3].id } }),
    prisma.beat.create({ data: { name: 'Theron\'s Betrayal Revealed', description: 'Fennec sells the assassination secret to Lysara. She reveals it publicly: Theron orchestrated the Emperor\'s death. His network begins to crumble.', position: 9, status: 'todo', starRating: 5, color: '#dc2626', storyWorldId: world.id, sequenceId: sequences[3].id, characterId: characters[2].id } }),
    prisma.beat.create({ data: { name: 'The Dark Beneath', description: 'The imprisoned entity breaches the weakened seal. Ancient horrors begin emerging from beneath Solhaven. The succession crisis becomes irrelevant as survival becomes the priority.', position: 10, status: 'todo', starRating: 5, color: '#1f2937', storyWorldId: world.id, sequenceId: sequences[4].id } }),
    prisma.beat.create({ data: { name: 'The Sacrifice', description: 'To reseal the entity, someone must take the Emperor\'s place — become the new immortal prisoner on the throne. Kael volunteers, but Dorian steps forward instead, finally finding his purpose.', position: 11, status: 'todo', starRating: 5, color: '#7c3aed', storyWorldId: world.id, sequenceId: sequences[4].id, characterId: characters[4].id } }),
    prisma.beat.create({ data: { name: 'Final Image', description: 'A new council rules in place of a single emperor. Kael walks away from the throne. The crystals are no longer dark — they glow with Dorian\'s sacrifice. Power is not taken. It is given.', position: 12, status: 'todo', starRating: 4, color: '#4f46e5', storyWorldId: world.id, sequenceId: sequences[4].id } }),
  ])
  console.log(`  Beats: ${beats.length}`)

  // 7. Events
  const events = await Promise.all([
    prisma.event.create({ data: { name: 'The Emperor\'s Assassination', description: 'Emperor Aldric is found dead in the Crystal Throne Room, killed by a blade coated in nullifying poison that negated his immortality magic.', fabulaPosition: 1, isKeyEvent: true, storyWorldId: world.id, locationId: locations[0].id } }),
    prisma.event.create({ data: { name: 'The Crystal Darkening', description: 'The Shattered Crown crystals begin turning from radiant white to obsidian black, spreading outward from the throne.', fabulaPosition: 2, storyWorldId: world.id, locationId: locations[0].id } }),
    prisma.event.create({ data: { name: 'Kael Learns His Heritage', description: 'A dying imperial messenger reaches Kael in the Northern Reaches, delivering proof of his parentage and a summons to claim the throne.', fabulaPosition: 3, isKeyEvent: true, storyWorldId: world.id, locationId: locations[5].id } }),
    prisma.event.create({ data: { name: 'Lysara\'s March Begins', description: 'House Venn mobilizes 40,000 soldiers from Ironhold, beginning the march toward Solhaven.', fabulaPosition: 4, isKeyEvent: true, storyWorldId: world.id, locationId: locations[2].id } }),
    prisma.event.create({ data: { name: 'The Failed Coronation', description: 'The Crystal Throne shatters when Dorian attempts to sit upon it, rejecting his claim in front of the assembled court.', fabulaPosition: 5, isKeyEvent: true, storyWorldId: world.id, locationId: locations[0].id } }),
    prisma.event.create({ data: { name: 'Mira\'s First Vision', description: 'Mira collapses during prayer and sees the entity imprisoned beneath the throne — and the weakening seal that holds it.', fabulaPosition: 6, isKeyEvent: true, storyWorldId: world.id, locationId: locations[3].id } }),
    prisma.event.create({ data: { name: 'The Kael-Asha Alliance', description: 'Kael and Asha meet at Red Gorge and form their pact: he will claim the throne, she will have southern independence.', fabulaPosition: 7, isKeyEvent: true, storyWorldId: world.id, locationId: locations[4].id } }),
    prisma.event.create({ data: { name: 'The Breach', description: 'The seal shatters. The entity beneath Solhaven breaks free, unleashing ancient horrors upon the city.', fabulaPosition: 8, isKeyEvent: true, storyWorldId: world.id, locationId: throneCity.id } }),
  ])
  console.log(`  Events: ${events.length}`)

  // 8. Themes
  const themes = await Promise.all([
    prisma.theme.create({ data: { name: 'Power and Sacrifice', description: 'True power requires sacrifice. Every character must give up something essential to achieve their goals.', thesis: 'Power without sacrifice is tyranny; sacrifice without choice is oppression.', storyWorldId: world.id } }),
    prisma.theme.create({ data: { name: 'Legacy vs. Identity', description: 'Are we defined by our bloodlines and inheritance, or by the choices we make?', thesis: 'Heritage opens doors, but character determines which ones you walk through.', storyWorldId: world.id } }),
    prisma.theme.create({ data: { name: 'The Cost of Immortality', description: 'What are you willing to sacrifice for permanence? Is it worth it?', thesis: 'Immortality is not a gift — it is a cage. Growth requires the possibility of ending.', storyWorldId: world.id } }),
    prisma.theme.create({ data: { name: 'Justice vs. Vengeance', description: 'The line between righteous justice and destructive vengeance. Lysara embodies this tension.', thesis: 'Justice builds; vengeance only destroys — but the distinction is often clear only in hindsight.', storyWorldId: world.id } }),
  ])
  console.log(`  Themes: ${themes.length}`)

  // 9. Factions
  const factions = await Promise.all([
    prisma.faction.create({ data: { name: 'House Ashford', description: 'The imperial bloodline. With the Emperor dead, two claimants remain: the legitimate Dorian and the bastard Kael.', type: 'noble_house', metadata: { hierarchy: 'monarchy', powerLevel: 5 }, storyWorldId: world.id } }),
    prisma.faction.create({ data: { name: 'House Venn', description: 'The military powerhouse of the west. Led by Lysara, they command the empire\'s largest standing army.', type: 'noble_house', metadata: { hierarchy: 'military', powerLevel: 4 }, storyWorldId: world.id } }),
    prisma.faction.create({ data: { name: 'The Shadow Court', description: 'Theron\'s intelligence network, operating through whispers, bribes, and blackmail across the entire empire.', type: 'organization', metadata: { hierarchy: 'network', powerLevel: 3 }, storyWorldId: world.id } }),
    prisma.faction.create({ data: { name: 'The Old Faith', description: 'The dying religion that once guided the empire. Mira\'s visions may be their resurgence — or their final chapter.', type: 'religious', metadata: { hierarchy: 'temple', powerLevel: 2 }, storyWorldId: world.id } }),
    prisma.faction.create({ data: { name: 'The Southern Coalition', description: 'Alliance of southern provinces seeking independence, led militarily by Asha Korrath.', type: 'political', metadata: { hierarchy: 'coalition', powerLevel: 3 }, storyWorldId: world.id } }),
    prisma.faction.create({ data: { name: 'The Thieves\' Guild', description: 'Solhaven\'s underground power structure. Fennec is a member — but loyalty is flexible when survival is at stake.', type: 'criminal', metadata: { hierarchy: 'guild', powerLevel: 2 }, storyWorldId: world.id } }),
  ])
  console.log(`  Factions: ${factions.length}`)

  // 10. Relationships
  await Promise.all([
    prisma.relationship.create({ data: { type: 'half-siblings', subtype: 'Half-Brothers', description: 'Kael is the bastard son; Dorian the legitimate heir. Neither knew the other existed until the Emperor\'s death.', intensity: 1.0, storyWorldId: world.id, character1Id: characters[0].id, character2Id: characters[4].id } }),
    prisma.relationship.create({ data: { type: 'adversary', subtype: 'Rival Claimants', description: 'Lysara sees both Ashford sons as obstacles. But she respects Kael more than Dorian.', intensity: 0.8, storyWorldId: world.id, character1Id: characters[1].id, character2Id: characters[0].id } }),
    prisma.relationship.create({ data: { type: 'manipulation', subtype: 'Puppet Master', description: 'Theron has been subtly controlling Dorian for years, shaping him into a figurehead.', intensity: 1.0, bidirectional: false, storyWorldId: world.id, character1Id: characters[2].id, character2Id: characters[4].id } }),
    prisma.relationship.create({ data: { type: 'alliance', subtype: 'Reluctant Alliance', description: 'Kael needs military support; Asha needs political legitimacy. Their alliance is strategic but grows into genuine respect.', intensity: 0.8, storyWorldId: world.id, character1Id: characters[0].id, character2Id: characters[5].id } }),
    prisma.relationship.create({ data: { type: 'protector', subtype: 'Guardian and Ward', description: 'Mira\'s visions identify Kael as critical to saving the realm. She becomes his reluctant guide.', intensity: 0.6, bidirectional: false, storyWorldId: world.id, character1Id: characters[3].id, character2Id: characters[0].id } }),
    prisma.relationship.create({ data: { type: 'hunter-hunted', subtype: 'Dangerous Secret', description: 'Fennec saw the assassin. Theron needs Fennec silenced. The cat-and-mouse game drives Act II.', intensity: 1.0, bidirectional: false, storyWorldId: world.id, character1Id: characters[2].id, character2Id: characters[7].id } }),
    prisma.relationship.create({ data: { type: 'father-son', subtype: 'Shadow of the Father', description: 'Aldric\'s legacy haunts both his sons differently. Dorian idolizes him; Kael hates what he represents.', intensity: 1.0, storyWorldId: world.id, character1Id: characters[6].id, character2Id: characters[0].id } }),
    prisma.relationship.create({ data: { type: 'vendetta', subtype: 'Generational Vendetta', description: 'Lysara\'s mother was executed by Aldric. This wound drives everything Lysara does.', intensity: 1.0, bidirectional: false, storyWorldId: world.id, character1Id: characters[1].id, character2Id: characters[6].id } }),
  ])
  console.log('  Relationships: 8')

  // 11. Arcs
  await Promise.all([
    prisma.arc.create({
      data: {
        name: 'Kael: From Exile to King',
        type: 'character',
        description: 'Kael transforms from reluctant exile to worthy ruler — not by claiming power, but by choosing to walk away from it.',
        storyWorldId: world.id,
        characterId: characters[0].id,
        phases: {
          create: [
            { name: 'The Outsider', description: 'Kael lives in ignorance of his heritage', state: 'setup', position: 1 },
            { name: 'The Reluctant Heir', description: 'Learns his identity, resists the call', state: 'rising', position: 2 },
            { name: 'The Would-Be King', description: 'Accepts the fight, builds alliances', state: 'rising', position: 3 },
            { name: 'The Sacrifice Offered', description: 'Willing to give his life for the realm', state: 'climax', position: 4 },
            { name: 'The King Who Walked Away', description: 'Chooses freedom over the throne', state: 'resolution', position: 5 },
          ],
        },
      },
    }),
    prisma.arc.create({
      data: {
        name: 'Lysara: Vengeance to Justice',
        type: 'character',
        description: 'Lysara must choose between the vengeance that has driven her for 20 years and the justice that could actually heal the realm.',
        storyWorldId: world.id,
        characterId: characters[1].id,
        phases: {
          create: [
            { name: 'The Iron Mask', description: 'Public mourning, private celebration', state: 'setup', position: 1 },
            { name: 'The March', description: 'Military campaign toward the throne', state: 'rising', position: 2 },
            { name: 'The Mirror', description: 'Confronted with who she has become', state: 'climax', position: 3 },
            { name: 'The Choice', description: 'Vengeance or justice — she chooses justice', state: 'resolution', position: 4 },
          ],
        },
      },
    }),
    prisma.arc.create({
      data: {
        name: 'The Succession Crisis',
        type: 'plot',
        description: 'The main plot arc: who will rule the empire after the immortal Emperor\'s death?',
        storyWorldId: world.id,
        phases: {
          create: [
            { name: 'The Void', description: 'Emperor dead, no clear successor', state: 'setup', position: 1 },
            { name: 'The Scramble', description: 'Five factions vie for control', state: 'rising', position: 2 },
            { name: 'The True Threat', description: 'The real danger isn\'t who rules — it\'s what was imprisoned', state: 'climax', position: 3 },
            { name: 'New Order', description: 'Council replaces monarchy', state: 'resolution', position: 4 },
          ],
        },
      },
    }),
  ])
  console.log('  Arcs: 3')

  // 12. Story Objects (Chekhov's guns)
  await Promise.all([
    prisma.storyObject.create({ data: { name: 'The Crystal Throne', description: 'Carved from living crystal, it resonates with the blood magic that sustained the Emperor. When Dorian tries to sit on it, it shatters. It\'s not a throne — it\'s a seal.', significance: 'The throne is actually a magical prison cap, not a seat of power', storyWorldId: world.id } }),
    prisma.storyObject.create({ data: { name: 'The Nullifying Blade', description: 'The weapon that killed the immortal Emperor. Forged from a metal that negates magic. Only three exist — and Theron commissioned all of them.', significance: 'Links Theron to the assassination', storyWorldId: world.id } }),
    prisma.storyObject.create({ data: { name: 'The Iron Signet Ring', description: 'Lysara\'s mother\'s ring, worn as a reminder of her execution. Contains a hidden compartment with a message: "Forgive the crown. Save the realm."', significance: 'Contains the key to Lysara\'s arc — her mother chose forgiveness', storyWorldId: world.id } }),
    prisma.storyObject.create({ data: { name: 'The Emperor\'s Journal', description: 'Hidden in the restricted archives, it details Aldric\'s descent into blood magic and the true purpose of the throne — keeping the ancient entity sealed.', significance: 'Reveals the true stakes of the succession crisis', storyWorldId: world.id } }),
  ])
  console.log('  Objects: 4')

  // 13. Scenes (6 key scenes)
  await Promise.all([
    prisma.scene.create({ data: { name: 'Cold Open: The Eternal Court', summary: 'Emperor Aldric holds court as he has for 300 years. Everything seems eternal, unchanging. But Fennec is in the walls, and Theron is watching from the shadows.', sjuzhetPosition: 1, purpose: 'exposition', tone: 'ominous', polarity: 'neutral', storyWorldId: world.id, eventId: events[0].id, locationId: locations[0].id, beatId: beats[0].id, actId: acts[0].id } }),
    prisma.scene.create({ data: { name: 'Blood on Crystal', summary: 'The assassination. We see it through Fennec\'s eyes — terrified, hiding in the air ducts above the throne room. The killer is someone the audience hasn\'t met yet.', sjuzhetPosition: 2, purpose: 'inciting_incident', tone: 'shocking', polarity: '-', storyWorldId: world.id, eventId: events[0].id, locationId: locations[0].id, beatId: beats[1].id, actId: acts[0].id } }),
    prisma.scene.create({ data: { name: 'The Northern Messenger', summary: 'Kael is chopping wood when a dying man on horseback crashes through the treeline. The messenger delivers proof of Kael\'s parentage and dies.', sjuzhetPosition: 4, purpose: 'call_to_adventure', tone: 'urgent', polarity: '+', storyWorldId: world.id, eventId: events[2].id, locationId: locations[5].id, beatId: beats[3].id, actId: acts[0].id } }),
    prisma.scene.create({ data: { name: 'The Iron Duchess Speaks', summary: 'Lysara addresses her generals in Ironhold\'s war room. Her speech reveals 20 years of planning. The audience learns her mother\'s story for the first time.', sjuzhetPosition: 5, purpose: 'character_reveal', tone: 'intense', polarity: '+', storyWorldId: world.id, eventId: events[3].id, locationId: locations[2].id, beatId: beats[4].id, actId: acts[0].id } }),
    prisma.scene.create({ data: { name: 'The Shattered Coronation', summary: 'Dorian sits on the Crystal Throne before the assembled court. The throne explodes. Shards of crystal wound a dozen courtiers. Dorian is unharmed but devastated.', sjuzhetPosition: 6, purpose: 'midpoint_reversal', tone: 'dramatic', polarity: '-', storyWorldId: world.id, eventId: events[4].id, locationId: locations[0].id, beatId: beats[5].id, actId: acts[1].id } }),
    prisma.scene.create({ data: { name: 'Vision in the Temple', summary: 'Mira collapses during prayer. Her vision: a vast darkness beneath Solhaven, pressing against a cracking barrier of light. A voice: "The seal dies with the blood."', sjuzhetPosition: 7, purpose: 'revelation', tone: 'terrifying', polarity: '-', storyWorldId: world.id, eventId: events[5].id, locationId: locations[3].id, beatId: beats[7].id, actId: acts[1].id } }),
  ])
  console.log('  Scenes: 6')

  // 14. Manuscript
  await prisma.manuscript.create({
    data: {
      title: 'The Shattered Crown — Draft 1',
      format: 'prose',
      storyWorldId: world.id,
      authorId: user.id,
    },
  })
  console.log('  Manuscripts: 1')

  // 15. Treatment
  await prisma.treatment.create({
    data: {
      title: 'The Shattered Crown — Treatment',
      content: `# THE SHATTERED CROWN
## A Novel Treatment

### Act I: The Shattering

The story opens on Emperor Aldric's eternal court — a scene of frozen perfection that has played out identically for three centuries. But beneath the surface, forces are moving.

When Aldric is found dead in the Crystal Throne Room, killed by a blade that should not exist, the empire fractures overnight. The crystals that have glowed with power for 300 years begin turning black.

Five factions emerge: Dorian (the legitimate heir), Kael (the hidden bastard), Lysara (the vengeful military leader), Theron (the spymaster who knows too much), and Asha (the rebel commander). Each believes they should — or must — control what comes next.

Meanwhile, a street thief named Fennec saw the killer's face. And a young priestess named Mira begins having visions of something far worse than a succession crisis.

### Act II: The Reckoning

The war of whispers begins. Lysara marches her armies east. Kael forms an unlikely alliance with Asha. Dorian attempts a coronation — and the throne rejects him violently, shattering in front of the entire court.

Mira's visions reveal the terrible truth: the Emperor wasn't just immortal. His blood magic was sustaining a seal over an ancient entity imprisoned beneath Solhaven. With his death, the seal is failing.

Fennec sells the assassination secret to Lysara, exposing Theron as the architect of the Emperor's death. But Theron reveals his own terrible truth: he killed the Emperor because Aldric begged him to. Three hundred years of blood sacrifice had broken the Emperor's mind.

### Act III: The Crown Reforged

The imprisoned entity breaks free, and suddenly the succession crisis is irrelevant. Ancient horrors pour from beneath Solhaven. The five factions must unite or die.

The only way to reseal the entity is for someone to take the Emperor's place — to sit on the throne and become the new immortal prisoner. Kael volunteers. But Dorian, who has spent the entire story being dismissed as weak, steps forward instead. "You've all been fighting over who deserves this throne," he says. "I'm the only one willing to sit in it knowing what it costs."

Dorian's sacrifice reseals the entity. The crystals glow again — not with Aldric's dark magic, but with something purer. The surviving factions form a ruling council. Kael walks away from the capital, finally free. And Lysara removes her mother's ring to find a hidden message: "Forgive the crown. Save the realm."

The final image: a council table where a throne once stood. Five empty chairs, soon to be filled by choice, not blood.`,
      storyWorldId: world.id,
    },
  })
  console.log('  Treatments: 1')

  console.log('\nSeed complete! Login with demo@onlydolls.world / demo1234')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
