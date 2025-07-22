import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Sun, CloudRain, Snowflake, Wind, Thermometer, Droplets, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  feelsLike: number;
  visibility: number;
}

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const { toast } = useToast();

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
      
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }
      
      // Get user's location with better error handling
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve, 
          (error) => {
            switch(error.code) {
              case error.PERMISSION_DENIED:
                setLocationPermission('denied');
                reject(new Error('Location access denied by user'));
                break;
              case error.POSITION_UNAVAILABLE:
                reject(new Error('Location information is unavailable'));
                break;
              case error.TIMEOUT:
                reject(new Error('Location request timeout'));
                break;
              default:
                reject(new Error('An unknown error occurred while retrieving location'));
                break;
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // Cache location for 5 minutes
          }
        );
      });
      
      const { latitude, longitude } = position.coords;
      setLocationPermission('granted');
      
      console.log('Fetching weather for coordinates:', latitude, longitude);
      
      // Call our edge function to get weather data
      const { data, error: weatherError } = await supabase.functions.invoke('get-weather', {
        body: { latitude, longitude }
      });
      
      if (weatherError) {
        throw new Error(weatherError.message || 'Failed to fetch weather data');
      }
      
      if (!data) {
        throw new Error('No weather data received');
      }
      
      setWeather(data);
      setLastUpdated(new Date());
      
      toast({
        title: "Weather Updated",
        description: `Weather data updated for ${data.location}`,
      });
      
    } catch (err: any) {
      const errorMessage = err.message || 'Unable to fetch weather data';
      setError(errorMessage);
      console.error('Weather fetch error:', err);
      
      toast({
        title: "Weather Error",
        description: errorMessage,
        variant: "destructive",
      });
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
          <div className="text-center space-y-3">
            <div className="text-muted-foreground">{error}</div>
            {locationPermission === 'denied' && (
              <div className="text-xs text-muted-foreground">
                Please enable location access and refresh the page to see local weather.
              </div>
            )}
            <Button onClick={fetchWeather} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
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
          <Button 
            onClick={fetchWeather} 
            variant="ghost" 
            size="sm"
            disabled={loading}
            className="ml-auto h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {weather && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {getWeatherIcon(weather.icon)}
              </div>
              <div className="text-3xl font-bold">{weather.temperature}°F</div>
              <div className="text-muted-foreground capitalize">{weather.description}</div>
              <div className="text-sm text-muted-foreground">{weather.location}</div>
              <div className="text-xs text-muted-foreground">Feels like {weather.feelsLike}°F</div>
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
                  <div className="text-sm font-medium">{weather.windSpeed} mph</div>
                  <div className="text-xs text-muted-foreground">Wind</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{weather.visibility} km visibility</span>
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