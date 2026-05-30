export interface Location {
  id: string;
  name: string;
  region: string;
}

export const locations: Location[] = [
  { id: "kyoto-station", name: "Kyoto Station", region: "Kyoto 京都" },
  { id: "osaka-umeda", name: "Osaka Umeda", region: "Osaka 大阪" },
  { id: "akihabara", name: "Akihabara", region: "Tokyo 東京" },
  { id: "shibuya", name: "Shibuya", region: "Tokyo 東京" },
  { id: "namba", name: "Namba", region: "Osaka 大阪" },
];
