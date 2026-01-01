export interface BlogPost {
  id?: number;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  publishedDate: Date;
  category: string;
  tags: string[];
  imageUrl?: string;
  isPublished: boolean;
}
