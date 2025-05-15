import * as dotenv from 'dotenv';
import axios from 'axios';
import { ERROR_MESSAGES } from '@src/constants';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LocationParameters } from './locationInterface';

dotenv.config();

@Injectable()
export class GetCoordinates {
  private readonly url = process.env.GOOGLE_API_URL;

  async getAddressByCoordinates(lat: number, lng: number) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_API_KEY}`,
      );

      const address = response.data.results[0];

      if (address) {
        let city = '';

        for (const component of address.address_components) {
          if (component.types.includes('locality')) {
            city = component.long_name;
            break;
          }
        }

        const locationParams: LocationParameters = {
          address: address.formatted_address || '',
          city: city || '',
        };
        return locationParams;
      }
    } catch (err) {
      throw new HttpException(
        `${ERROR_MESSAGES.addressNotFound}: ${err.message}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async getAutoCompleteHints(address: string) {
    const response = await axios.get(this.url, {
      params: {
        input: address,
        key: process.env.GOOGLE_API_KEY,
      },
    });

    const descriptions = response.data.predictions.map((prediction) => {
      const address = prediction.description;
      const city = prediction.terms[2].value;

      return {
        address,
        city,
      };
    });

    return descriptions;
  }
}
