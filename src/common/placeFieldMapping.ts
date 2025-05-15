import { PlaceType } from '@src/place/enums/place.type.enum';

export function getPlaceFieldMapping(placeType: PlaceType): string {
  const fieldMapping = {
    [PlaceType.RESTAURANT]: 'restaurantId',
    [PlaceType.BEAUTY_SALON]: 'beautySalonId',
    [PlaceType.CAR_WASH]: 'carWashId',
    [PlaceType.HOTEL]: 'hotelId',
  };

  return fieldMapping[placeType];
}
