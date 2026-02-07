import { Member } from "./types";

export const MEMBERS: Member[] = [
  { id: "shohei", name: "翔平", emoji: "🩵", color: "#60B5D1" },
  { id: "kayoko", name: "かよこ", emoji: "💛", color: "#F5C842" },
  { id: "nanako", name: "ななこ", emoji: "💗", color: "#F06292" },
  { id: "chifumi", name: "ちふみ", emoji: "🩷", color: "#F8A4C8" },
  { id: "orito", name: "織人", emoji: "👦🏻", color: "#8BC34A" },
];

export const EVERYONE_MEMBER: Member = {
  id: "everyone",
  name: "全員",
  emoji: "🌈",
  color: "#1E88E5",
};

export function getMemberById(id: string): Member | undefined {
  if (id === "everyone") return EVERYONE_MEMBER;
  return MEMBERS.find((m) => m.id === id);
}

export function getMemberColor(id: string): string {
  const member = getMemberById(id);
  return member?.color ?? "#999999";
}
