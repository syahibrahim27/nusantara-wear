export type SeedProduct = {
  name: string
  slug: string
  category: string
  collection: string
  price: number
  compareAtPrice?: number
  image: string
  description: string
  material: string
  modelSizing: string
  care: string
  tags: string[]
  colors: [string, string][]
  sizes: string[]
}

export const categories = [
  { name: "Atasan", slug: "atasan", description: "Kemeja, blus, dan potongan atas yang memberi ruang pada bahu dan napas.", image: "/images/products/01.jpg" },
  { name: "Bawahan", slug: "bawahan", description: "Celana dan rok dengan jatuh kain yang tenang untuk hari yang panjang.", image: "/images/products/03.jpg" },
  { name: "Outerwear", slug: "outerwear", description: "Lapisan luar yang menemani perpindahan ruang, dari studio ke jalan.", image: "/images/products/05.jpg" },
  { name: "Aksesori", slug: "aksesori", description: "Tenun tangan dan detail kecil yang menutup sebuah tampilan.", image: "/images/products/07.jpg" },
]

export const collections = [
  {
    name: "Ruang Teduh",
    slug: "ruang-teduh",
    description: "Terinspirasi dari ambang, selasar, dan jeda. Potongan yang tidak menuntut perhatian, namun tetap tinggal dalam ingatan.",
    heroImage: "/images/campaign-akar.png",
    isFeatured: true,
  },
  {
    name: "Garis Bumi",
    slug: "garis-bumi",
    description: "Palet tanah dan garis jahit yang sengaja dibiarkan terlihat, merayakan tangan yang mengerjakannya.",
    heroImage: "/images/products/04.jpg",
    isFeatured: false,
  },
  {
    name: "Jejak Kota",
    slug: "jejak-kota",
    description: "Siluet utilitarian untuk ritme urban tropis: ringan, mudah dilapis, dan tahan hari yang berpindah-pindah.",
    heroImage: "/images/products/06.jpg",
    isFeatured: false,
  },
]

export const tags = [
  { name: "Unisex", slug: "unisex" },
  { name: "Linen", slug: "linen" },
  { name: "Tenun", slug: "tenun" },
  { name: "Edisi Terbatas", slug: "edisi-terbatas" },
  { name: "Ringan", slug: "ringan" },
]

const ARANG: [string, string] = ["Arang", "#292925"]
const LUMUT: [string, string] = ["Lumut", "#394838"]
const TANAH: [string, string] = ["Tanah", "#B9573D"]
const GADING: [string, string] = ["Gading", "#E5DDCE"]

export const products: SeedProduct[] = [
  {
    name: "Sora Layered Shirt",
    slug: "sora-layered-shirt",
    category: "atasan",
    collection: "ruang-teduh",
    price: 789_000,
    compareAtPrice: 989_000,
    image: "/images/products/01.jpg",
    description:
      "Kemeja berlapis dengan panel punggung yang sedikit lebih panjang, memberi bayangan lembut saat Anda bergerak. Kerah dibiarkan rendah agar nyaman dipakai terbuka maupun dikancing penuh.",
    material: "Katun tenun 120 gsm dengan campuran tencel, kancing corozo",
    modelSizing: "Model 172 cm mengenakan ukuran M",
    care: "Cuci tangan dengan air dingin, jemur di tempat teduh, setrika suhu rendah dari sisi dalam.",
    tags: ["unisex", "ringan"],
    colors: [GADING, ARANG, LUMUT],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Aruna Wrap Outer",
    slug: "aruna-wrap-outer",
    category: "outerwear",
    collection: "ruang-teduh",
    price: 1_299_000,
    image: "/images/products/02.jpg",
    description:
      "Outer tanpa kancing yang diikat di pinggang. Potongan lurus menjatuhkan kain dengan tenang, cocok dipakai di atas kaus tipis maupun kemeja berkerah.",
    material: "Linen lokal 200 gsm, sabuk kain menyatu",
    modelSizing: "Model 176 cm mengenakan ukuran M",
    care: "Cuci mesin siklus lembut, hindari pemutih, gantung hingga kering.",
    tags: ["linen", "edisi-terbatas"],
    colors: [TANAH, ARANG],
    sizes: ["S", "M", "L"],
  },
  {
    name: "Laras Pleated Trouser",
    slug: "laras-pleated-trouser",
    category: "bawahan",
    collection: "garis-bumi",
    price: 949_000,
    image: "/images/products/03.jpg",
    description:
      "Celana lipit dengan pinggang tinggi dan kaki melebar perlahan. Lipitnya ditata agar tetap rapi setelah duduk berjam-jam.",
    material: "Katun dobby dengan sedikit serat daur ulang",
    modelSizing: "Model 168 cm mengenakan ukuran M, panjang 102 cm",
    care: "Cuci terpisah pada pencucian pertama, setrika lipit dari sisi dalam.",
    tags: ["unisex", "ringan"],
    colors: [ARANG, LUMUT, GADING, TANAH],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Kirana Panel Dress",
    slug: "kirana-panel-dress",
    category: "atasan",
    collection: "garis-bumi",
    price: 1_199_000,
    compareAtPrice: 1_399_000,
    image: "/images/products/04.jpg",
    description:
      "Dress panel dengan sambungan yang sengaja diperlihatkan. Garis jahitnya mengikuti lekuk tubuh tanpa menekan, memberi ruang untuk bernapas sepanjang hari.",
    material: "Linen katun dengan lapisan bahu tipis",
    modelSizing: "Model 170 cm mengenakan ukuran S",
    care: "Cuci tangan, jangan diperas, keringkan dengan digantung.",
    tags: ["linen", "edisi-terbatas"],
    colors: [TANAH, GADING],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    name: "Bumi Utility Vest",
    slug: "bumi-utility-vest",
    category: "outerwear",
    collection: "jejak-kota",
    price: 899_000,
    image: "/images/products/05.jpg",
    description:
      "Rompi dengan empat saku fungsional dan bukaan sisi. Dibuat cukup ringan untuk dipakai di dalam ruangan ber-AC maupun di jalan sore.",
    material: "Kanvas katun ringan 240 gsm",
    modelSizing: "Model 178 cm mengenakan ukuran L",
    care: "Cuci mesin air dingin, keringkan alami, setrika suhu sedang.",
    tags: ["unisex", "tenun"],
    colors: [LUMUT, ARANG, TANAH],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Rintik Easy Pants",
    slug: "rintik-easy-pants",
    category: "bawahan",
    collection: "jejak-kota",
    price: 829_000,
    image: "/images/products/06.jpg",
    description:
      "Celana bertali dengan potongan lurus dan bahan yang jatuh mengikuti langkah. Pinggang elastis di bagian belakang membuatnya nyaman untuk perjalanan panjang.",
    material: "Katun tenun ringan dengan tali kepang tangan",
    modelSizing: "Model 174 cm mengenakan ukuran M",
    care: "Cuci mesin siklus lembut, jemur terbalik.",
    tags: ["unisex", "ringan"],
    colors: [ARANG, GADING, LUMUT],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Nadi Woven Bag",
    slug: "nadi-woven-bag",
    category: "aksesori",
    collection: "ruang-teduh",
    price: 649_000,
    image: "/images/products/07.jpg",
    description:
      "Tas tenun tangan dengan struktur yang cukup kokoh untuk laptop 13 inci. Setiap unit memiliki variasi warna alami karena diwarnai dalam batch kecil.",
    material: "Tenun agel dengan lapisan katun dan tali kulit nabati",
    modelSizing: "Dimensi 34 × 28 × 10 cm",
    care: "Lap dengan kain lembap, hindari perendaman, simpan di tempat kering.",
    tags: ["tenun", "edisi-terbatas"],
    colors: [TANAH, GADING],
    sizes: ["One Size"],
  },
  {
    name: "Senja Collar Shirt",
    slug: "senja-collar-shirt",
    category: "atasan",
    collection: "garis-bumi",
    price: 749_000,
    image: "/images/products/08.jpg",
    description:
      "Kemeja berkerah lebar dengan bahu turun. Dijahit dengan jarak setikan yang lebih renggang agar kain tetap lentur setelah beberapa kali cuci.",
    material: "Katun organik 140 gsm",
    modelSizing: "Model 175 cm mengenakan ukuran M",
    care: "Cuci mesin air dingin, setrika suhu sedang.",
    tags: ["unisex", "ringan"],
    colors: [GADING, LUMUT, ARANG],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Bayu Long Coat",
    slug: "bayu-long-coat",
    category: "outerwear",
    collection: "jejak-kota",
    price: 1_499_000,
    image: "/images/products/02.jpg",
    description:
      "Mantel panjang selutut dengan potongan tegak. Meski panjang, bobotnya tetap ringan sehingga tetap masuk akal untuk iklim tropis.",
    material: "Campuran linen dan katun tenun rapat",
    modelSizing: "Model 180 cm mengenakan ukuran L",
    care: "Cuci kering disarankan, gantung pada hanger berbahu lebar.",
    tags: ["linen", "edisi-terbatas"],
    colors: [ARANG, TANAH],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Embun Column Skirt",
    slug: "embun-column-skirt",
    category: "bawahan",
    collection: "ruang-teduh",
    price: 799_000,
    image: "/images/products/04.jpg",
    description:
      "Rok kolom dengan belahan belakang untuk kebebasan melangkah. Jatuhnya lurus tanpa lapisan tambahan agar tetap sejuk.",
    material: "Katun tencel dengan finishing lembut",
    modelSizing: "Model 165 cm mengenakan ukuran S, panjang 86 cm",
    care: "Cuci tangan, keringkan dengan digantung, setrika suhu rendah.",
    tags: ["ringan"],
    colors: [ARANG, LUMUT, GADING],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    name: "Teras Boxy Top",
    slug: "teras-boxy-top",
    category: "atasan",
    collection: "jejak-kota",
    price: 699_000,
    image: "/images/products/06.jpg",
    description:
      "Atasan boxy dengan lengan pendek lebar. Potongannya berdiri sedikit menjauh dari tubuh sehingga udara tetap mengalir.",
    material: "Katun slub 160 gsm",
    modelSizing: "Model 169 cm mengenakan ukuran M",
    care: "Cuci mesin air dingin, hindari pengering mesin.",
    tags: ["unisex", "ringan"],
    colors: [GADING, TANAH, LUMUT, ARANG],
    sizes: ["S", "M", "L"],
  },
  {
    name: "Akar Woven Scarf",
    slug: "akar-woven-scarf",
    category: "aksesori",
    collection: "garis-bumi",
    price: 399_000,
    image: "/images/products/01.jpg",
    description:
      "Selendang tenun tangan dengan ujung rumbai yang disimpul satu per satu. Cukup tipis untuk dipakai di dalam ruangan, cukup hangat untuk perjalanan malam.",
    material: "Tenun katun pewarna alam indigo dan jolawe",
    modelSizing: "Dimensi 180 × 55 cm",
    care: "Cuci tangan terpisah, warna alami dapat berubah perlahan seiring waktu.",
    tags: ["tenun", "edisi-terbatas"],
    colors: [ARANG, TANAH],
    sizes: ["One Size"],
  },
  {
    name: "Pagi Relaxed Blazer",
    slug: "pagi-relaxed-blazer",
    category: "outerwear",
    collection: "ruang-teduh",
    price: 1_399_000,
    compareAtPrice: 1_599_000,
    image: "/images/products/03.jpg",
    description:
      "Blazer tanpa bantalan bahu dengan satu kancing. Dirancang untuk terlihat rapi tanpa membuat pemakainya merasa kaku.",
    material: "Linen katun dengan lapisan bahu tipis",
    modelSizing: "Model 177 cm mengenakan ukuran M",
    care: "Cuci kering, setrika suhu rendah dengan kain pelapis.",
    tags: ["linen", "unisex"],
    colors: [ARANG, GADING, LUMUT],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Sela Draped Top",
    slug: "sela-draped-top",
    category: "atasan",
    collection: "garis-bumi",
    price: 759_000,
    image: "/images/products/05.jpg",
    description:
      "Atasan dengan drape asimetris pada satu sisi. Lipatan dijahit tetap sehingga bentuknya konsisten setiap kali dipakai.",
    material: "Tencel dengan jatuh kain lembut",
    modelSizing: "Model 171 cm mengenakan ukuran S",
    care: "Cuci tangan, jangan dipelintir, gantung hingga kering.",
    tags: ["ringan", "edisi-terbatas"],
    colors: [TANAH, ARANG, GADING],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    name: "Dara Barrel Pants",
    slug: "dara-barrel-pants",
    category: "bawahan",
    collection: "jejak-kota",
    price: 879_000,
    image: "/images/products/07.jpg",
    description:
      "Celana barrel dengan volume di bagian paha dan menyempit di pergelangan. Siluetnya tegas tetapi tetap nyaman untuk bersepeda ke studio.",
    material: "Katun denim ringan 9 oz tanpa stretch",
    modelSizing: "Model 173 cm mengenakan ukuran M",
    care: "Cuci terbalik dengan air dingin, jemur di tempat teduh.",
    tags: ["unisex"],
    colors: [ARANG, LUMUT, GADING],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Langit Mini Pouch",
    slug: "langit-mini-pouch",
    category: "aksesori",
    collection: "ruang-teduh",
    price: 349_000,
    image: "/images/products/08.jpg",
    description:
      "Pouch kecil untuk ponsel, kartu, dan kunci. Tali dapat dilepas sehingga bisa dipakai sebagai dompet genggam.",
    material: "Kanvas katun dengan resleting logam dan tali anyam",
    modelSizing: "Dimensi 18 × 12 × 4 cm",
    care: "Lap dengan kain lembap, hindari mesin cuci.",
    tags: ["tenun", "ringan"],
    colors: [TANAH, ARANG, GADING],
    sizes: ["One Size"],
  },
]

export const journalPosts = [
  {
    slug: "membaca-kain-sebagai-arsip",
    title: "Membaca kain sebagai arsip",
    excerpt: "Setiap serat menyimpan keputusan: siapa yang menenun, dari mana warnanya datang, dan bagaimana ia menua.",
    coverImage: "/images/sculpture-tenun.png",
    content: `Material selalu berbicara sebelum ia menjadi pakaian. Ia menyimpan suhu tempat asalnya, ritme tangan yang membentuknya, dan pilihan-pilihan kecil yang sering tak terlihat dari luar.

Di studio, kami belajar mendengarkan. Bukan untuk mengulang masa lalu secara harfiah, tetapi untuk menemukan prinsip yang masih relevan hari ini: kesabaran, ketepatan, dan penghormatan pada sumber daya yang jumlahnya terbatas.

> Yang berakar tidak harus tinggal diam.

Karena itu setiap potongan dimulai dari ruang gerak. Kami menguji bagaimana kain berubah saat berjalan, duduk, dan menjalani hari penuh di kota yang lembap. Desain dianggap selesai bukan ketika gambarnya terlihat baik, melainkan ketika tubuh merasa punya tempat di dalamnya.`,
  },
  {
    slug: "ruang-antara-tubuh-dan-kota",
    title: "Ruang antara tubuh dan kota",
    excerpt: "Catatan tentang volume, udara, dan cara pakaian menemani ritme urban tropis.",
    coverImage: "/images/products/05.jpg",
    content: `Jakarta menuntut pakaian yang tahu diri. Terlalu ketat, ia menyiksa; terlalu longgar, ia merepotkan di kereta yang penuh. Volume yang tepat adalah percakapan antara tubuh dan ruang di sekitarnya.

Kami mengukur bukaan lengan, jarak antara kain dan punggung, serta panjang belahan pada rok kolom dengan cara yang sama: berjalan kaki dari studio ke stasiun terdekat pada pukul empat sore.

> Kenyamanan adalah keputusan desain, bukan kebetulan.

Hasilnya bukan siluet yang paling dramatis, melainkan yang paling sering Anda ambil dari lemari.`,
  },
  {
    slug: "di-balik-ruang-teduh",
    title: "Di balik Ruang Teduh",
    excerpt: "Proses lahirnya koleksi yang dimulai dari bayang-bayang arsitektur dan palet tanah.",
    coverImage: "/images/campaign-akar.png",
    content: `Ruang Teduh berawal dari catatan perjalanan: selasar rumah tua, ambang pintu yang menyaring cahaya, dan lantai teraso yang tetap dingin di siang hari.

Palet koleksi ini diambil dari sana. Arang untuk bayangan, Gading untuk dinding yang memantulkan cahaya, Tanah untuk bata yang menua, dan Lumut untuk tanaman yang menempel di temboknya.

Kami memproduksinya dalam batch kecil bersama tiga mitra perajin. Setiap batch diperiksa dua kali: sekali untuk jahitan, sekali untuk rasa saat dipakai.

> Sebuah koleksi selesai ketika ia bisa dipakai pada hari biasa.`,
  },
  {
    slug: "merawat-yang-ingin-dipakai-lama",
    title: "Merawat yang ingin dipakai lama",
    excerpt: "Panduan sederhana untuk memperpanjang usia linen, katun, dan tenun favorit Anda.",
    coverImage: "/images/products/03.jpg",
    content: `Umur pakaian lebih banyak ditentukan oleh cara merawat daripada cara membuatnya. Tiga kebiasaan kecil biasanya cukup.

Pertama, cuci lebih jarang. Angin-anginkan linen setelah dipakai; sering kali itu sudah memulihkan bentuknya. Kedua, gunakan air dingin dan deterjen netral agar serat tidak rapuh. Ketiga, keringkan di tempat teduh karena sinar matahari langsung memudarkan pewarna alam jauh lebih cepat daripada mesin cuci.

> Merawat adalah bentuk paling sederhana dari keberlanjutan.

Jika ada jahitan yang terlepas, kirimkan kembali ke studio. Kami memperbaiki potongan Nusantara Wear tanpa biaya selama dua tahun pertama.`,
  },
]

export const reviews = [
  { title: "Materialnya terasa jujur", body: "Linennya adem dipakai seharian di Jakarta dan tidak kusut berlebihan setelah duduk lama di kantor.", rating: 5 },
  { title: "Potongan yang hidup", body: "Jatuh kainnya bagus tanpa terlihat kebesaran. Saya biasa ukuran M dan ini pas sesuai panduan ukuran.", rating: 5 },
  { title: "Detail jahitan rapi", body: "Setikan bagian dalam ikut dirapikan, jadi terasa sepadan dengan harganya.", rating: 5 },
  { title: "Warnanya persis foto", body: "Warna Tanah lebih hangat dari dugaan saya, dan itu justru lebih enak dipadankan.", rating: 4 },
  { title: "Nyaman untuk perjalanan", body: "Dipakai naik kereta dua jam tetap nyaman dan tidak perlu disetrika ulang di tujuan.", rating: 5 },
  { title: "Ukurannya konsisten", body: "Ini pembelian kedua saya dan ukurannya sama persis dengan yang pertama.", rating: 5 },
  { title: "Ringan tapi tidak menerawang", body: "Bahannya tipis dan sejuk, tetapi tetap aman dipakai tanpa lapisan tambahan.", rating: 4 },
  { title: "Pengiriman rapi", body: "Dibungkus kain, bukan plastik. Detail kecil yang membuat saya kembali belanja di sini.", rating: 5 },
  { title: "Cocok untuk kerja dan akhir pekan", body: "Saya pakai ke kantor dengan sepatu formal, lalu ke kafe dengan sneaker. Keduanya masuk.", rating: 5 },
  { title: "Semakin bagus setelah dicuci", body: "Setelah cuci pertama teksturnya jadi lebih lembut tanpa kehilangan bentuk.", rating: 5 },
  { title: "Sedikit longgar di pinggang", body: "Saya perlu menyesuaikan sedikit di pinggang, tetapi selebihnya jatuhnya bagus.", rating: 4 },
  { title: "Aksesori yang tahan lama", body: "Sudah tiga bulan dipakai hampir tiap hari dan anyamannya masih rapat.", rating: 5 },
]
