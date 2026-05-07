// targetSize:
//   - statues: target HEIGHT in meters (1.6 ≈ human-scaled)
//   - paintings: target max(width, height) in meters
// fineScale: optional multiplier applied after AutoFit (default 1)
// pedestalHeight: only used for statues
// category: groups exhibits into rooms in the gallery — 'classical' | 'modern' | 'paintings'
export const modelsData = [
    {
        id: "starry-night",
        title: "The Starry Night",
        artist: "Vincent van Gogh",
        year: "1889",
        type: "painting",
        category: "paintings",
        description:
            "Painted from memory in June 1889 from his asylum room at Saint-Rémy-de-Provence, the swirling night sky is one of the most recognised images in Western art. The cypress in the foreground links earth and sky with a single dark, flame-like form; the village beneath is invented. Van Gogh wrote to his brother Theo that the work was a 'study of night.'",
        medium: "Oil on canvas",
        dimensions: "73.7 × 92.1 cm",
        location: "Museum of Modern Art, New York",
        file: "TheStarryNight_painting",
        sourceUrl: "https://sketchfab.com/3d-models/psx-painting-eb869f2272334150977ca9d9b89fc986",
        targetSize: 2.4,
    },
    {
        id: "angel",
        title: "Marble Angel",
        artist: "Sebastian Sosnowski (study)",
        year: "19th C.",
        type: "statue",
        category: "classical",
        description:
            "A neoclassical funerary angel modelled on the cemetery sculpture tradition of late-19th-century Europe. The piece's tightly carved feathers and softly draped garments demonstrate the period's mastery of contrasting marble textures — polished skin against heavily worked stone.",
        medium: "Marble",
        dimensions: "≈1.6 m",
        location: "Private study",
        file: "Angel_old_marble_version",
        sourceUrl: "https://sketchfab.com/3d-models/angel-old-marble-version-2c879fc654b44f5e8d12527948535b51",
        targetSize: 1.7,
        pedestalHeight: 1.0,
    },
    {
        id: "death-crowning-innocence",
        title: "Death Crowning Innocence",
        artist: "George Frederic Watts",
        year: "1886-87",
        type: "painting",
        category: "paintings",
        description:
            "Watts called this an 'allegory of consolation,' painted soon after the death of a friend's child. A winged figure of Death — neither ghoul nor saviour — gently lays a wreath on a sleeping infant. Watts considered such symbolic works his most important contribution, more than the portraits that made him famous.",
        medium: "Oil on canvas",
        dimensions: "157 × 67 cm",
        location: "Watts Gallery, Compton",
        file: "Death_crowning_innocence_1896_Painting",
        sourceUrl: "https://sketchfab.com/3d-models/death-crowning-innocence-1896-ebcbbe30d65a43fa96187ade879d43cd",
        targetSize: 2.6,
    },
    {
        id: "laocoon",
        title: "Laocoön and His Sons",
        artist: "Agesander, Athenodoros & Polydorus of Rhodes",
        year: "c. 40-30 BC",
        type: "statue",
        category: "classical",
        description:
            "Excavated in a Roman vineyard in 1506 and immediately acquired by Pope Julius II, this Hellenistic group depicts the Trojan priest Laocoön and his sons strangled by sea serpents — punishment from the gods for warning Troy about the wooden horse. Its anguished poses redirected Renaissance sculpture (Michelangelo arrived hours after its discovery).",
        medium: "Marble",
        dimensions: "208 × 163 × 112 cm",
        location: "Vatican Museums, Rome",
        file: "Laocoon_and_his_sons",
        sourceUrl: "https://sketchfab.com/3d-models/laocoon-and-his-sons-649111a9a7b74ddab3937292be5545fc",
        targetSize: 1.9,
        pedestalHeight: 1.0,
    },
    {
        id: "louis-xiv",
        title: "Louis XIV",
        artist: "After Antoine Coysevox",
        year: "Late 17th C.",
        type: "statue",
        category: "classical",
        description:
            "A Baroque portrait bust of the Sun King at the height of his power, identifiable by the cascading wig (a fashion he popularised) and the cuirass of a victorious general. The bust style — derived from Bernini's portrait of the king — became the official template for royal imagery across Europe.",
        medium: "Marble",
        dimensions: "≈1.0 m bust",
        location: "Musée du Louvre, Paris",
        file: "Louis_xiv_de_france_louvre_paris",
        sourceUrl: "https://sketchfab.com/3d-models/louis-xiv-de-france-louvre-paris-a0cc0e7eee384c99838dff2857b8158c",
        targetSize: 1.4,
        pedestalHeight: 1.1,
    },
    {
        id: "thinker",
        title: "The Thinker",
        artist: "Auguste Rodin",
        year: "Conceived 1880, cast 1904",
        type: "statue",
        category: "modern",
        description:
            "Originally conceived as 'The Poet,' a small figure sitting above the Gates of Hell representing Dante surveying the damned. Rodin later enlarged him to monumental scale; the figure became less Dante and more an emblem of all human introspection — every muscle of the body engaged in the act of thought.",
        medium: "Bronze",
        dimensions: "186 × 98 × 142 cm (large version)",
        location: "Musée Rodin, Paris (and many casts)",
        file: "The_thinker_by_auguste_rodin",
        sourceUrl: "https://sketchfab.com/3d-models/the-thinker-by-auguste-rodin-08a1e693c9674a3292dec2298b09e0ae",
        targetSize: 1.8,
        pedestalHeight: 1.0,
    },
];

export const CATEGORIES = [
    { id: 'classical', label: 'Classical Sculpture', accent: '#cfc8bd' },
    { id: 'paintings', label: 'Paintings', accent: '#a17a32' },
    { id: 'modern', label: 'Modern', accent: '#7a9bbf' },
];
