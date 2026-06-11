export interface Location {
  id: string;
  name: string;
  nameJa: string;
  region: string;
  color: string;
  colorBg: string;
}

export const locations: Location[] = [
  {
    id: "kyoto-station",
    name: "Kyoto Station",
    nameJa: "京都駅",
    region: "Kyoto 京都",
    color: "#a78bfa",
    colorBg: "rgba(167,139,250,0.12)",
  },
  {
    id: "osaka-umeda",
    name: "Osaka Umeda",
    nameJa: "大阪梅田",
    region: "Osaka 大阪",
    color: "#f472b6",
    colorBg: "rgba(244,114,182,0.12)",
  },
  {
    id: "akihabara",
    name: "Akihabara",
    nameJa: "秋葉原",
    region: "Tokyo 東京",
    color: "#34d399",
    colorBg: "rgba(52,211,153,0.12)",
  },
  {
    id: "shibuya",
    name: "Shibuya",
    nameJa: "渋谷",
    region: "Tokyo 東京",
    color: "#fbbf24",
    colorBg: "rgba(251,191,36,0.12)",
  },
  {
    id: "namba",
    name: "Namba",
    nameJa: "難波",
    region: "Osaka 大阪",
    color: "#f87171",
    colorBg: "rgba(248,113,113,0.12)",
  },
];
