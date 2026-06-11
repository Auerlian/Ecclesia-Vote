// Dev tool — run with `pnpm --filter @ecclesia/receipt gen:wordlists`.
//
// Produces the FROZEN wordlists used to derive receipt phrases (§5.1). Output is a committed
// source file (`src/wordlists/wordlists.ts`) — that committed file, not this script, is the
// frozen artifact. Re-running between elections is allowed; changing lists mid-election is
// forbidden (§5.1) and caught by the frozen-hash test.
//
// Curation rules: lowercase a–z only, 3–10 letters, no profanity, avoid near-homophones.
// Each list is deduped, sorted, and sliced to exactly 256 entries (one seed byte per slot).

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LIST_SIZE = 256;

const RAW = {
  ADJECTIVES: `
amber ashen azure beige blue bronze brown chestnut charcoal cobalt copper coral crimson cyan
ebony emerald fuchsia gold golden grey green hazel indigo ivory jade lavender lilac lime
magenta maroon mauve navy ochre olive orange peach pearl pink plum purple scarlet sepia silver
slate tan teal turquoise umber violet yellow russet saffron sage salmon sapphire ruby rose
blazing breezy briny bubbly chilly cosmic creamy dappled dewy dusky dusty earthy fiery flinty
fluffy foamy fragrant frosty frozen gilded glassy gleaming glossy glowing grainy grassy hardy
hidden hollow humble hushed icy jagged leafy lofty loamy lunar lush marble mellow midnight
mighty minty misty mossy murky nimble noble nutty opal pearly placid playful plush prickly
proud quiet radiant rapid roasted rosy royal rugged rustic rustling salty sandy savory secret
shadowy shady shimmering shiny silky sleek smoky smooth snowy snug soft solar sparkly spicy
spiral spotted starry steely stony stormy striped sturdy sugary sultry sunny swift tame tangy
tender thorny tidal twilight twinkling velvet velvety verdant vernal vivid warm watery waxen
whispering wild windy wintry wise wispy witty woody woolly woven zesty zippy agile ancient
arctic autumn bold brave bright busy calm cheery clever cosy daring eager fabled fancy festive
fleet glad happy jolly keen kind lively lucky merry nifty quick rural spry tall tiny vast wide
balmy candid cheerful cuddly dainty dapper devout downy elegant fond frugal gentle genuine
giddy graceful grand humid jaunty jovial jubilant limber lithe loyal modest peppy perky plucky
polite quaint quirky sincere sleepy snazzy spirited splendid sprightly steadfast sublime supple
tidy tranquil trusty upbeat vibrant vigilant winsome zealous zestful mellow lofty regal serene
`,
  NOUNS: `
river brook creek stream rivulet spring fountain cascade waterfall rapids ford delta estuary
lagoon bay cove inlet fjord sound strait channel harbour lake pond pool mere tarn loch sea
ocean tide wave surf foam current eddy whirlpool hill mount mountain peak summit ridge crag
cliff bluff scarp slope foothill highland moor heath fell dale vale valley glen gorge ravine
canyon gully chasm plain prairie steppe savanna meadow field pasture glade clearing grove
thicket copse wood forest woodland jungle desert dune oasis marsh swamp bog fen mire wetland
island isle islet atoll reef shoal sandbar cape headland peninsula cave cavern grotto hollow
den burrow stone rock boulder pebble gravel cobble flint granite marble basalt quartz crystal
sand clay loam soil earth snow ice frost sleet hail rain drizzle mist fog haze cloud thunder
lightning storm gale breeze wind gust zephyr squall sun moon star comet meteor nebula galaxy
aurora dawn dusk twilight noon midnight sky horizon oak ash elm birch beech pine cedar spruce
larch willow alder maple sycamore poplar aspen rowan hawthorn holly hornbeam walnut leaf
branch bough root bark twig blossom petal flower fern moss lichen vine ivy reed rush sedge
heather gorse bramble nettle clover acorn cone seed pollen sap ember flame spark trail path
track lane road bridge harbor tundra glacier iceberg geyser ripple meadowland brookside
hillside lakeshore seashore woodside dell knoll mound cairn ledge pinnacle plateau mesa butte
foothills wetlands marshland heathland moorland brae shore beach strand bayou narrows lowland
wold scree riverbed headwater watershed moraine crevasse snowfield icefield treeline ridgeline
coastline riverbank hedgerow grassland brink gulch wadi spinney holt weald downs links fenland
coomb
`,
  ANIMALS: `
otter beaver badger fox wolf bear lynx hare rabbit hedgehog squirrel mole stoat weasel marten
polecat ferret raccoon skunk possum vole shrew bat dormouse deer elk moose bison boar ibex
chamois mouflon reindeer caribou antelope gazelle impala kudu oryx eland gnu springbok lion
tiger leopard cheetah cougar puma jaguar panther ocelot serval caracal bobcat elephant rhino
hippo giraffe zebra okapi buffalo wildebeest warthog tapir gorilla chimp orangutan gibbon
baboon macaque lemur marmoset tamarin loris kangaroo wallaby koala wombat platypus echidna
quokka numbat bilby horse pony donkey mule camel llama alpaca vicuna guanaco yak dog dingo
jackal coyote seal walrus dugong manatee dolphin porpoise orca narwhal beluga whale humpback
shark ray skate marlin tuna salmon trout carp pike perch bass cod haddock herring mackerel
sardine anchovy eel barracuda grouper snapper halibut flounder sole turbot octopus squid
cuttlefish nautilus jellyfish crab lobster shrimp prawn krill barnacle clam oyster mussel
scallop cockle whelk limpet starfish urchin anemone seahorse eagle hawk falcon kestrel osprey
kite harrier buzzard vulture condor owl robin sparrow finch wren thrush blackbird starling
swallow swift martin crow raven rook jackdaw magpie jay dove pigeon duck mallard teal widgeon
goose swan heron egret stork crane ibis spoonbill flamingo gull tern puffin guillemot razorbill
gannet cormorant pelican albatross petrel woodpecker kingfisher hoopoe parrot macaw cockatoo
budgie lorikeet parakeet peacock pheasant partridge quail grouse ptarmigan penguin ostrich emu
rhea cassowary kiwi toucan hornbill frog toad newt salamander axolotl turtle tortoise terrapin
lizard gecko skink iguana chameleon monitor snake python boa cobra viper adder mamba crocodile
alligator caiman gharial bee wasp hornet ant beetle ladybird butterfly moth dragonfly mantis
cricket grasshopper cicada firefly spider scorpion snail slug worm
`,
};

function normalise(raw) {
  const seen = new Set();
  const out = [];
  for (const token of raw.split(/\s+/)) {
    const w = token.trim().toLowerCase().replace(/[^a-z]/g, "");
    if (w.length < 3 || w.length > 10) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  out.sort();
  return out;
}

const lists = {};
let short = false;
for (const [name, raw] of Object.entries(RAW)) {
  const words = normalise(raw);
  console.log(`${name}: ${words.length} unique (need ${LIST_SIZE})`);
  if (words.length < LIST_SIZE) {
    short = true;
    console.error(`  !! ${name} is short by ${LIST_SIZE - words.length}`);
  }
  lists[name] = words.slice(0, LIST_SIZE);
}
if (short) {
  console.error("\nAdd more words to the short pool(s) and re-run.");
  process.exit(1);
}

const canonical = JSON.stringify(lists);
const frozenHash = createHash("sha256").update(canonical).digest("hex");

const header = `// GENERATED by scripts/gen-wordlists.mjs — do not edit by hand.
// Frozen wordlists for receipt phrase derivation (§5.1). Each list is exactly ${LIST_SIZE}
// entries. The frozen hash below is recomputed by the test suite; a hand edit to any array
// without regenerating will fail that test (T-INV-9 / §5.1 "no mid-election change").
/* eslint-disable */
`;

const body =
  Object.entries(lists)
    .map(([name, words]) => {
      const lines = [];
      for (let i = 0; i < words.length; i += 8) {
        lines.push("  " + words.slice(i, i + 8).map((w) => `"${w}"`).join(", ") + ",");
      }
      return `export const ${name}: readonly string[] = [\n${lines.join("\n")}\n] as const;`;
    })
    .join("\n\n") +
  `\n\nexport const FROZEN_WORDLIST_SHA256 = "${frozenHash}";\n` +
  `export const LIST_SIZE = ${LIST_SIZE};\n`;

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "src", "wordlists", "wordlists.ts");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, header + "\n" + body);

console.log(`\nWrote ${outPath}`);
console.log(`FROZEN_WORDLIST_SHA256 = ${frozenHash}`);
