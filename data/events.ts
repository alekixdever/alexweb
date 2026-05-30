export interface Event {
  id: string;
  title: string;
  date: Date;
  locationId: string;
  description: string;
  tags: string[];
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
    date: today,
    locationId: "kyoto-station",
    description:
      "Explore the light and shadows around Kyoto Station after dark. Perfect for photography enthusiasts and street photo beginners. Walk freely and share shooting tips.",
    tags: ["Photography", "Night", "Outdoor"],
    participantsCount: 12,
    image:
      "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=600&q=80",
  },
  {
    id: "evt-002",
    title: "Umeda Coffee Tasting Tour / 梅田コーヒーツアー",
    date: today,
    locationId: "osaka-umeda",
    description:
      "Visit three specialty coffee shops in Umeda, spending around 40 minutes at each. All locations are within walking distance of each other.",
    tags: ["Coffee", "Food", "Indoor"],
    participantsCount: 8,
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
  },
  {
    id: "evt-003",
    title: "Akihabara Electronics Treasure Hunt / 秋葉原電子部品巡り",
    date: today,
    locationId: "akihabara",
    description:
      "A guided tour through Akihabara's oldest electronics component shops. Great for makers and DIY enthusiasts. Experienced members will lead the way.",
    tags: ["Tech", "DIY", "Shopping"],
    participantsCount: 6,
    image:
      "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80",
  },
  {
    id: "evt-004",
    title: "Shibuya Street Art Walk / 渋谷ストリートアートツアー",
    date: tomorrow,
    locationId: "shibuya",
    description:
      "Discover hidden street art across Shibuya and hear the stories behind local artists and their works.",
    tags: ["Art", "Culture", "Outdoor"],
    participantsCount: 15,
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
  },
  {
    id: "evt-005",
    title: "Namba Late Night Ramen Crawl / 難波深夜ラーメン巡り",
    date: tomorrow,
    locationId: "namba",
    description:
      "Midnight departure to visit three late-night ramen spots in Namba. Limited to 10 people — first come, first served.",
    tags: ["Food", "Night", "Ramen"],
    participantsCount: 7,
    image:
      "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80",
  },
  {
    id: "evt-006",
    title: "Kyoto Temple Morning Zazen / 京都寺院朝の座禅",
    date: dayAfter,
    locationId: "kyoto-station",
    description:
      "A 30-minute seated meditation session at an ancient Kyoto temple, led by a resident monk. Starts at 6:00 AM. Only 8 spots available.",
    tags: ["Zen", "Culture", "Morning"],
    participantsCount: 4,
    image:
      "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80",
  },
];
