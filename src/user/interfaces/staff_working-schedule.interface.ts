import { StaffStatus } from '../enums/staff.status.enum';

export interface StaffSchedule {
  date: Date;
  startTime: string;
  endTime: string;
  floor: string;
  status: StaffStatus;
}
