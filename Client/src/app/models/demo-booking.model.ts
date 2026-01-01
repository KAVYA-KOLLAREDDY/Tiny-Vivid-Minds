export interface DemoBooking {
  id?: number;
  parentName: string;
  email: string;
  phone: string;
  childName: string;
  childAge: number;
  preferredCourse: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  createdAt?: Date;
  status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}
