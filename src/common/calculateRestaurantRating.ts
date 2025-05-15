import { Review } from '@src/review/entities/review.entity';

function calculateRestaurantRating(reviews: Review[]): number {
  if (reviews.length === 0) {
    return 0;
  }

  const sumRatings = reviews.reduce(
    (acc, review) => {
      acc.foodSum += review.foodRating;
      acc.serviceSum += review.serviceRating;
      acc.priceSum += review.priceRating;
      acc.ambienceSum += review.ambienceRating;
      return acc;
    },
    { foodSum: 0, serviceSum: 0, priceSum: 0, ambienceSum: 0 },
  );

  const { foodSum, serviceSum, priceSum, ambienceSum } = sumRatings;
  const totalSum = foodSum + serviceSum + priceSum + ambienceSum;
  const rating = +(totalSum / (reviews.length * 4)).toFixed(2);

  return rating;
}

export default calculateRestaurantRating;
