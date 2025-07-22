import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Sun, CloudRain, Snowflake, Wind, Thermometer, Droplets } from 'lucide-react';

interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const getWeatherIcon = (iconCode: string) => {
    if (iconCode.includes('01')) return <Sun className="h-8 w-8 text-yellow-500" />;
    if (iconCode.includes('02') || iconCode.includes('03') || iconCode.includes('04')) return <Cloud className="h-8 w-8 text-gray-500" />;
    if (iconCode.includes('09') || iconCode.includes('10')) return <CloudRain className="h-8 w-8 text-blue-500" />;
    if (iconCode.includes('13')) return <Snowflake className="h-8 w-8 text-blue-300" />;
    return <Cloud className="h-8 w-8 text-gray-500" />;
  };

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      const { latitude, longitude } = position.coords;
      
      // For demo purposes, we'll use a mock weather API response
      // In production, you would need to add your OpenWeatherMap API key
      const mockWeatherData: WeatherData = {
        location: 'Current Location',
        temperature: Math.round(Math.random() * 20 + 10), // Random temp between 10-30°C
        description: ['Sunny', 'Cloudy', 'Partly Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
        humidity: Math.round(Math.random() * 40 + 40), // Random humidity 40-80%
        windSpeed: Math.round(Math.random() * 10 + 5), // Random wind 5-15 km/h
        icon: ['01d', '02d', '03d', '10d'][Math.floor(Math.random() * 4)]
      };
      
      setWeather(mockWeatherData);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Unable to fetch weather data');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    
    // Update every 15 minutes (900,000 ms)
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !weather) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading weather...</div>
        </CardContent>
      </Card>
    );
  }

  if (error && !weather) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <Thermometer className="h-5 w-5" />
          Current Weather
        </CardTitle>
      </CardHeader>
      <CardContent>
        {weather && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {getWeatherIcon(weather.icon)}
              </div>
              <div className="text-3xl font-bold">{weather.temperature}°C</div>
              <div className="text-muted-foreground capitalize">{weather.description}</div>
              <div className="text-sm text-muted-foreground">{weather.location}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-sm font-medium">{weather.humidity}%</div>
                  <div className="text-xs text-muted-foreground">Humidity</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">{weather.windSpeed} km/h</div>
                  <div className="text-xs text-muted-foreground">Wind</div>
                </div>
              </div>
            </div>
            
            {lastUpdated && (
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;