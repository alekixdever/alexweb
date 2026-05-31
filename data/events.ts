export interface Event {
  id: string;
  title: string;
  titleJa: string;
  date: Date;
  locationId: string;
  description: string;
  descriptionJa: string;
  tags: string[];
  tagsJa: string[];
  participantsCount: number;
  image: string;
}

const today = new Date();
const tomorrow = new Date(Date.now() + 86400000);
const dayAfter = new Date(Date.now() + 86400000 * 2);

export const events: Event[] = [
  {
    id: "evt-001",
    title: "Kyoto Night Photography Walk",
    titleJa: "京都夜間写真散歩",
    date: today,
    locationId: "kyoto-station",
    description:
      "Explore light and shadows around Kyoto Station after dark. Perfect for photography enthusiasts and beginners alike. Walk freely and exchange shooting tips.",
    descriptionJa:
      "夜の京都駅周辺で光と影を探索します。写真愛好家から初心者まで大歓迎。自由に歩きながら撮影テクニックを共有しましょう。",
    tags: ["Photography", "Night", "Outdoor"],
    tagsJa: ["写真", "夜間", "屋外"],
    participantsCount: 12,
    image:
      "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=600&q=80",
  },
  {
    id: "evt-002",
    title: "Umeda Coffee Tasting Tour",
    titleJa: "梅田コーヒーテイスティングツアー",
    date: today,
    locationId: "osaka-umeda",
    description:
      "Visit three specialty coffee shops in Umeda, spending around 40 minutes at each. All locations are within walking distance.",
    descriptionJa:
      "梅田のスペシャルティコーヒーショップ3軒を巡ります。各店約40分、すべて徒歩圏内です。",
    tags: ["Coffee", "Food", "Indoor"],
    tagsJa: ["コーヒー", "グルメ", "屋内"],
    participantsCount: 8,
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
  },
  {
    id: "evt-003",
    title: "Akihabara Electronics Treasure Hunt",
    titleJa: "秋葉原電子部品お宝探し",
    date: today,
    locationId: "akihabara",
    description:
      "A guided tour through Akihabara's oldest electronics component shops. Great for makers and DIY enthusiasts. Experienced members will lead the way.",
    descriptionJa:
      "秋葉原の老舗電子部品店をめぐるガイドツアー。メーカーやDIY愛好家に最適。経験者がリードします。",
    tags: ["Tech", "DIY", "Shopping"],
    tagsJa: ["テック", "DIY", "ショッピング"],
    participantsCount: 6,
    image:
      "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80",
  },
  {
    id: "evt-004",
    title: "Shibuya Street Art Walk",
    titleJa: "渋谷ストリートアートウォーク",
    date: tomorrow,
    locationId: "shibuya",
    description:
      "Discover hidden street art across Shibuya and hear the stories behind local artists and their works.",
    descriptionJa:
      "渋谷に隠れたストリートアートを発見し、地元アーティストの作品にまつわるストーリーを聞きます。",
    tags: ["Art", "Culture", "Outdoor"],
    tagsJa: ["アート", "文化", "屋外"],
    participantsCount: 15,
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
  },
  {
    id: "evt-005",
    title: "Namba Late Night Ramen Crawl",
    titleJa: "難波深夜ラーメン巡り",
    date: tomorrow,
    locationId: "namba",
    description:
      "Midnight departure to visit three late-night ramen spots in Namba. Limited to 10 people — first come, first served.",
    descriptionJa:
      "深夜出発で難波の夜営業ラーメン店3軒を巡ります。定員10名、先着順です。",
    tags: ["Food", "Night", "Ramen"],
    tagsJa: ["グルメ", "夜間", "ラーメン"],
    participantsCount: 7,
    image:
      "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80",
  },
  {
    id: "evt-006",
    title: "Kyoto Temple Morning Zazen",
    titleJa: "京都寺院 朝の座禅体験",
    date: dayAfter,
    locationId: "kyoto-station",
    description:
      "A 30-minute seated meditation session at an ancient Kyoto temple, led by a resident monk. Starts at 6:00 AM. Only 8 spots available.",
    descriptionJa:
      "古刹にて住職指導のもと30分間の座禅を体験します。朝6時開始、定員8名のみ。",
    tags: ["Zen", "Culture", "Morning"],
    tagsJa: ["禅", "文化", "朝活"],
    participantsCount: 4,
    image:
      "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80",
  },
];
