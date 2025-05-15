interface ClientsReports {
  clientsStatusPerSpace: ClientsStatusPerSpace;
  clientsTotalsPerSpace: ClientsTotalsTotalsPerSpace;
  clientsTotalsForRestaurant: ClientsTotalsForRestaurant;
}

interface ClientsStatusPerSpace {
  [spaceId: string]: {
    total: number;
    unique: number;
    recurrent: number;
  };
}

interface ClientsTotalsTotalsPerSpace {
  [spaceId: string]: {
    total: number;
    unique: number;
    recurrent: number;
  };
}

interface ClientsTotalsForRestaurant {
  [date: string]: { total: number; unique: number; recurrent: number };
}
