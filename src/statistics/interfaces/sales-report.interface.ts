interface SalesReport {
  salesForTimePerSpace: SalesForTimePerSpace;
  salesTotalsPerSpace: SalesTotalsPerSpace;
  salesTotalsForRestaurant: SalesTotalsForRestaurant;
}

interface SalesForTimePerSpace {
  [spaceId: string]: {
    total: number;
  };
}

interface SalesTotalsPerSpace {
  [spaceId: string]: {
    total: number;
  };
}

interface SalesTotalsForRestaurant {
  [date: string]: {
    total: number;
  };
}
