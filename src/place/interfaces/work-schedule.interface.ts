export interface WorkSchedule {
  monday: WorkDay;
  tuesday: WorkDay;
  wednesday: WorkDay;
  thursday: WorkDay;
  friday: WorkDay;
  saturday: WorkDay;
  sunday: WorkDay;
}

export interface WorkDay {
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
}
