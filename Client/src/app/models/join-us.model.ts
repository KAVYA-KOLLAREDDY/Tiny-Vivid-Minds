export interface JoinUs {
  id?: number;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  experience: string;
  preferredSubject: string;
  availability: string;
  message?: string;
  resume?: string;
  createdAt?: Date;
  status?: 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED';
}
