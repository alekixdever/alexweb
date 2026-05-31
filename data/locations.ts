export interface Location {
  id: string;
  name: string;
  nameJa: string;
  region: string;
}

export const locations: Location[] = [
  {
    id: "kyoto-station",
    name: "Kyoto Station",
    nameJa: "京都駅",
    region: "Kyoto 京都",
  },
  {
    id: "osaka-umeda",
    name: "Osaka Umeda",
    nameJa: "大阪梅田",
    region: "Osaka 大阪",
  },
  {
    id: "akihabara",
    name: "Akihabara",
    nameJa: "秋葉原",
    region: "Tokyo 東京",
  },
  { id: "shibuya", name: "Shibuya", nameJa: "渋谷", region: "Tokyo 東京" },
  { id: "namba", name: "Namba", nameJa: "難波", region: "Osaka 大阪" },
];
