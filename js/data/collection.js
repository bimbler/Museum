/**
 * Museum collection data
 * Contains all objects available in the museum
 */

export const collection = [
  {
    id: 'buddha',
    title: 'Buddha Statue',
    period: '12th Century',
    description: 'A monumental image of Vairocana—often understood as the "Universal Buddha"—shown in the uttarabodhimudra, a gesture associated with ultimate enlightenment. Gilded bronze with pigments, Ming dynasty China (16th century). Crow Collection of Asian Art (Accession 1976.3).',
    longDescription: `This sculpture represents Vairocana, a central figure in Mahāyāna and esoteric Buddhist traditions, embodying universal Buddhahood and the cosmic nature of enlightenment. The uttarabodhimudra ("gesture of supreme awakening")—with the index fingers raised and joined—signals the attainment of ultimate wisdom and is frequently associated with Vairocana in later East Asian Buddhist art.

Cast in bronze and richly gilded, with traces of pigments that once enlivened its surface, the work reflects Ming dynasty patronage of Buddhism and the period's taste for luminous, gold-toned devotional images. Such objects were intended to project spiritual radiance and presence, whether used in temple settings or private worship.

Facts:
- Title: Universal Buddha in the Gesture of Ultimate Enlightenment (Vairocana in Uttarabodhimudra)
- Culture/Country: China
- Period: Ming dynasty (1368–1644), 16th century
- Medium: Bronze, gilded, and pigments
- Collection Title: Crow Collection of Asian Art
- Accession Number: 1976.3`,
    thumbnail: './assets/thumbnails/buddha.jpg',
    hasModel: true,
    hasAR: true,
    modelPath: './assets/buddha.glb',
    targetIndex: 0,
    arTargetHeightM: 1.52,
    material: 'Sandstone',
    origin: 'Cambodia',
    dimensions: '45cm × 30cm × 25cm',
    gallery: 'g2',
    annotations: [
      {
        id: 1,
        position: { x: 0.0, y: 0.9, z: 0.15 },
        title: 'Uttarabodhimudra',
        body: 'The gesture of supreme awakening — index fingers raised and joined — signals the attainment of ultimate wisdom and is frequently associated with Vairocana in East Asian Buddhist art.'
      },
      {
        id: 2,
        position: { x: 0.3, y: 0.4, z: 0.2 },
        title: 'Gilded Surface',
        body: 'Traces of gold leaf and pigments survive on the bronze surface, reflecting the Ming dynasty taste for luminous, radiant devotional images intended to project spiritual presence.'
      },
      {
        id: 3,
        position: { x: -0.2, y: -0.1, z: 0.25 },
        title: 'Bronze Casting',
        body: 'Cast in bronze using the lost-wax method, this sculpture demonstrates the technical mastery of Ming-era foundries. The metal was then gilded and painted with mineral pigments.'
      }
    ]
  },
  {
    id: 'gandharan',
    title: 'Gandharan Head (Fragment)',
    period: 'Gandhara (1st–3rd Century CE)',
    description: 'A bodhisattva head fragment carved in gray schist from Gandhara, a crossroads region of Northwest India (present-day Pakistan) celebrated for Greco-Buddhist art. 3rd century. Crow Collection of Asian Art.',
    longDescription: `Carved from gray schist, this head comes from Gandhara—an important cultural and artistic center where South Asian Buddhist imagery blended with Hellenistic and West Asian visual traditions. Gandharan sculptors favored naturalistic facial modeling, gently downcast eyes, and carefully articulated hair, creating figures that feel both idealized and vividly present.

As a bodhisattva (an enlightened being who postpones final nirvāṇa to aid others), the figure would originally have formed part of a larger devotional sculpture. Although the statue is now fragmentary, the surviving head preserves the expressive calm and technical refinement that made Gandharan workshops influential across the Buddhist world.

Facts:
- Title: Bodhisattva
- Culture/Country: Northwest India, Gandhara Region
- Period: 3rd century
- Medium: Gray schist
- Dimensions: 19 x 17 x 13 1/2 in.
- Collection: Crow Collection of Asian Art`,
    thumbnail: './assets/thumbnails/gandharan.jpg',
    hasModel: true,
    hasAR: false,
    modelPath: './assets/gandharan.glb',
    arTargetHeightM: 0.48,
    material: 'Gray schist',
    origin: 'Northwest India, Gandhara Region',
    dimensions: '19 x 17 x 13 1/2 in.',
    gallery: 'g4',
    annotations: [
      {
        id: 1,
        position: { x: 0.0, y: 0.5, z: 0.2 },
        title: 'Hellenistic Features',
        body: 'The naturalistic facial modeling — gentle brow ridge, defined nose bridge, softly parted lips — reflects the Hellenistic sculptural tradition that reached Gandhara through Alexander the Great\'s campaigns.'
      },
      {
        id: 2,
        position: { x: 0.15, y: 0.7, z: 0.1 },
        title: 'Wavy Hair',
        body: 'The carefully articulated wavy hair, arranged in a topknot (ushnisha), blends Greek curling-hair conventions with the Buddhist symbol of spiritual wisdom crowning the head.'
      }
    ]
  },
  {
    id: 'vase',
    title: 'Ancient Vase',
    period: 'Ming Dynasty (1368-1644)',
    description: 'A stunning blue and white porcelain vase from the Ming Dynasty, featuring intricate dragon motifs and floral patterns. This piece exemplifies the pinnacle of Chinese ceramic artistry and was likely commissioned for the imperial court.',
    longDescription: `This magnificent porcelain vase represents the golden age of Chinese ceramic production during the Ming Dynasty. The cobalt blue decoration on pristine white porcelain became the signature style that would influence pottery worldwide.

The dragon motifs symbolize imperial power and good fortune, while the surrounding floral patterns represent the harmony between nature and imperial authority. Each brushstroke was carefully applied by master craftsmen before the piece was fired in kilns that reached temperatures over 1300°C.

Vases of this caliber were highly prized and often given as diplomatic gifts to foreign dignitaries, spreading Chinese artistic influence across Asia and beyond.`,
    thumbnail: './assets/thumbnails/vase.jpg',
    hasModel: false,
    hasAR: false,
    material: 'Porcelain',
    origin: 'China',
    dimensions: '38cm × 18cm × 18cm',
    gallery: 'g3'
  },
  {
    id: 'bust',
    title: 'Marble Bust',
    period: 'Roman Empire (2nd Century AD)',
    description: 'A classical Roman marble bust depicting a noble patrician. The detailed carving captures the subject\'s dignified expression and elaborate hairstyle, showcasing the technical mastery of Roman sculptors.',
    longDescription: `This marble portrait bust exemplifies the Roman tradition of realistic portraiture that emerged during the Republican period and flourished under the Empire. Unlike the idealized Greek sculptures, Roman busts aimed to capture the true likeness and character of their subjects.

The fine details - from the individual strands of hair to the subtle expression lines - demonstrate the sculptor's exceptional skill. The subject's toga and hairstyle suggest a person of high social standing, possibly a senator or wealthy merchant.

Discovered in the ruins of a villa near Pompeii, this bust provides invaluable insight into Roman society, fashion, and artistic conventions. The marble used likely came from the famous quarries of Carrara, prized for its pure white color and fine grain.`,
    thumbnail: './assets/thumbnails/bust.jpg',
    hasModel: false,
    hasAR: false,
    material: 'Carrara Marble',
    origin: 'Italy',
    dimensions: '52cm × 35cm × 28cm',
    gallery: 'g8'
  },
  {
    id: 'relic',
    title: 'Golden Relic',
    period: 'Byzantine Empire (6th Century)',
    description: 'An ornate golden reliquary adorned with precious gems and intricate filigree work. This sacred container was designed to house holy relics and represents the peak of Byzantine metalworking and religious artistry.',
    longDescription: `This extraordinary reliquary showcases the Byzantine Empire's mastery of goldsmithing and their devotion to preserving sacred objects. The piece combines religious significance with imperial opulence, featuring gold, garnets, sapphires, and pearls.

The intricate filigree patterns and cloisonné enamel work demonstrate techniques that were closely guarded secrets of Byzantine craftsmen. The central cross is set with gems arranged to catch and reflect light, creating a mystical radiance that would have awed medieval worshippers.

Such reliquaries were central to Byzantine religious practice and were often carried in processions or displayed on church altars. The object's craftsmanship reflects both theological concepts - the eternal nature of heaven represented through precious, incorruptible materials - and the political power of the church.`,
    thumbnail: './assets/thumbnails/relic.jpg',
    hasModel: false,
    hasAR: false,
    material: 'Gold, Precious Gems',
    origin: 'Constantinople (Istanbul)',
    dimensions: '22cm × 15cm × 12cm',
    gallery: 'g9'
  }
];

/**
 * Exhibition data for the homepage timeline
 */
export const exhibitions = [
  {
    title: 'Ink and Gold: Art of the Kano',
    dates: 'Sep 24, 2024 – Jul 15, 2029',
    location: 'UT Dallas',
    thumb: './assets/exhibitions/kano.jpg'
  },
  {
    title: 'Sacred Bronze: Devotional Sculpture of South Asia',
    dates: 'Jan 12, 2025 – Dec 20, 2026',
    location: 'Crow Museum',
    thumb: './assets/exhibitions/bronze.jpg'
  },
  {
    title: 'Jade and Silk: Material Culture of the Han Dynasty',
    dates: 'Mar 1, 2025 – Nov 30, 2026',
    location: 'UT Dallas',
    thumb: './assets/exhibitions/jade.jpg'
  },
  {
    title: 'Gandhara Crossroads: Where East Met West',
    dates: 'Jun 15, 2025 – May 30, 2027',
    location: 'Crow Museum',
    thumb: './assets/exhibitions/gandhara.jpg'
  }
];

/**
 * Get object by ID
 * @param {string} id - Object ID
 * @returns {object|null}
 */
export function getObjectById(id) {
  return collection.find(obj => obj.id === id) || null;
}

/**
 * Get all objects with AR capability
 * @returns {array}
 */
export function getARObjects() {
  return collection.filter(obj => obj.hasAR);
}

/**
 * Get count of AR-enabled objects
 * @returns {number}
 */
export function getARCount() {
  return collection.filter(obj => obj.hasAR).length;
}

/**
 * Get objects by gallery ID
 * @param {string} galleryId - Gallery ID (e.g. 'g2')
 * @returns {array}
 */
export function getObjectsByGallery(galleryId) {
  return collection.filter(obj => obj.gallery === galleryId);
}
