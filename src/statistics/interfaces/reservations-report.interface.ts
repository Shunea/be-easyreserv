interface ReservationsReports {
  getReservationsStatsPerSpace: ReservationsStatsPerSpace;
  getReservationsTotalsPerSpace: ReservationsStatsTotals;
  getReservationForRestaurant: ReservationsForRestaurant;
}

interface ReservationsStatsPerSpace {
  [spaceId: string]: {
    total: number;
    missed: number;
    canceled: number;
    closed: number;
  };
}

interface ReservationsStatsTotals {
  [spaceId: string]: {
    total: number;
    missed: number;
    canceled: number;
    closed: number;
  };
}

interface ReservationsForRestaurant {
  [date: string]: {
    total: number;
    missed: number;
    canceled: number;
    closed: number;
  };
}
