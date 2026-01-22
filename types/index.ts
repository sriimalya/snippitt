export type ActiveTab = 'home' | 'explore' | 'library' | 'saved';

export interface Collection {
  id: string;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  visibility: "PUBLIC" | "PRIVATE" | "FOLLOWERS";
  isDraft: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  
  user: {
    id: string;
    username: string;
    avatar?: string | null;
  };

  // Stats
  _count?: {
    posts: number;
    // followers: number; (If you add collection following later)
  };

  // Frontend helper
  linkTo?: string; 
}