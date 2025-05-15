interface ProductsReports {
  getProductsDataForRestaurant: ProductsDataForRestaurant;
  getProductsForRestaurant: ProductsForRestaurant;
}

interface ProductsForRestaurant {
  [date: string]: {
    total: number;
    available: number;
  };
}

interface ProductsDataForRestaurant {
  [id: string]: {
    title: string;
    isAvailable: boolean;
  };
}
