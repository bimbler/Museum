/**
 * Museum collection data
 * Contains all objects available in the museum
 */

export const collection = [
  {
    id: 'buddha',
    title: 'Buddha Statue',
    period: '12th Century',
    description: 'An exquisite meditation Buddha statue from the Angkor period, crafted from sandstone. This serene figure represents the moment of enlightenment, with intricate hand gestures (mudras) symbolizing teaching and meditation. The statue showcases the artistic mastery of Khmer sculptors and their deep understanding of Buddhist iconography.',
    longDescription: `This remarkable Buddha statue dates back to the 12th century during the height of the Khmer Empire. The piece demonstrates exceptional craftsmanship with its smooth, flowing robes and peaceful countenance.

The statue's mudra (hand gesture) indicates the Dharmachakra mudra, representing the turning of the wheel of dharma - the Buddha's first teaching after achieving enlightenment. The closed eyes and serene expression invite contemplation and inner peace.

Discovered in the ruins of an ancient temple in Cambodia, this statue has survived centuries and serves as a testament to the enduring spiritual and artistic legacy of Southeast Asian Buddhism.`,
    thumbnail: './assets/thumbnails/buddha.jpg',
    hasModel: true,
    hasAR: true,
    modelPath: './assets/buddha.glb',
    targetIndex: 0,
    material: 'Sandstone',
    origin: 'Cambodia',
    dimensions: '45cm × 30cm × 25cm'
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
    dimensions: '38cm × 18cm × 18cm'
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
    dimensions: '52cm × 35cm × 28cm'
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
    dimensions: '22cm × 15cm × 12cm'
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
