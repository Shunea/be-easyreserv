interface RestaurantRating {
  restaurantReviewsRating: RestaurantReviewsRating;
}

interface RestaurantReviewsRating {
  [date: string]: {
    totalRating: number;
    foodRating: number;
    serviceRating: number;
    priceRating: number;
    ambienceRating: number;
  };
}
