export interface Feedback {
  id?: number;
  name: string;
  email: string;
  rating: number;
  message: string;
  childName?: string;
  childAge?: number;
  course?: string;
  createdAt?: Date;
  isApproved?: boolean;
}
