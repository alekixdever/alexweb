export interface User {
  id: string;
  name: string;
  avatar: string;
  role: "guest" | "member";
}

export const mockUser: User = {
  id: "user-001",
  name: "Alex Chen",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  role: "member",
};

export const contactList: User[] = [
  {
    id: "user-002",
    name: "Yuki Tanaka",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki",
    role: "member",
  },
  {
    id: "user-003",
    name: "Mia Lin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
    role: "member",
  },
  {
    id: "user-004",
    name: "Kenji Sato",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kenji",
    role: "member",
  },
];
