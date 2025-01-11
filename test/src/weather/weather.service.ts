import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WeatherService {
  private readonly baseUrl: string = 'https://api.open-meteo.com/v1';

  async getCurrentWeather(city: string) {
    try {
      // First, get coordinates for the city using geocoding API
      const geoResponse = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`,
      );

      if (!geoResponse.data.results?.length) {
        throw new HttpException('City not found', HttpStatus.NOT_FOUND);
      }

      const { latitude, longitude } = geoResponse.data.results[0];

      // Get weather data using coordinates
      const response = await axios.get(
        `${this.baseUrl}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`,
      );

      return {
        city: city,
        temperature: response.data.current.temperature_2m,
        humidity: response.data.current.relative_humidity_2m,
        windSpeed: response.data.current.wind_speed_10m,
        description: this.getWeatherDescription(response.data.current.weather_code),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to fetch weather data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getForecast(city: string) {
    try {
      // First, get coordinates for the city using geocoding API
      const geoResponse = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`,
      );

      if (!geoResponse.data.results?.length) {
        throw new HttpException('City not found', HttpStatus.NOT_FOUND);
      }

      const { latitude, longitude } = geoResponse.data.results[0];

      // Get forecast data using coordinates
      const response = await axios.get(
        `${this.baseUrl}/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&forecast_days=5`,
      );

      return response.data.hourly.time.map((time, index) => ({
        datetime: time,
        temperature: response.data.hourly.temperature_2m[index],
        humidity: response.data.hourly.relative_humidity_2m[index],
        windSpeed: response.data.hourly.wind_speed_10m[index],
        description: this.getWeatherDescription(response.data.hourly.weather_code[index]),
      }));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to fetch forecast data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getWeatherDescription(code: number): string {
    const weatherCodes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      95: 'Thunderstorm',
    };
    return weatherCodes[code] || 'Unknown';
  }
} 