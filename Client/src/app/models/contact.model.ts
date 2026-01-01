export interface Contact {
  id?: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt?: Date;
  status?: 'NEW' | 'READ' | 'REPLIED';
}
