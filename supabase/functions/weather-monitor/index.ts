import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  conditions: string;
  location: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  alerts?: WeatherApiAlert[];
  forecast?: ForecastData[];
  airQuality?: AirQualityData;
}

interface WeatherApiAlert {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}

interface ForecastData {
  dt: number;
  temp: number;
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind_speed: number;
}

interface AirQualityData {
  aqi: number;
  components: {
    pm2_5: number;
    pm10: number;
    o3: number;
    no2: number;
  };
}

interface WeatherAlert {
  id: string;
  alert_type: string;
  condition_operator: string;
  threshold_value: number;
  location_filter: string | null;
  alert_title: string;
  alert_message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openWeatherApiKey = Deno.env.get('OPENWEATHERMAP_API_KEY');
    
    if (!openWeatherApiKey) {
      console.error('OpenWeatherMap API key not configured');
      return new Response(
        JSON.stringify({ error: 'Weather API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all active weather alerts
    const { data: weatherAlerts, error: alertsError } = await supabaseClient
      .from('weather_alerts')
      .select('*')
      .eq('is_active', true);

    if (alertsError) {
      console.error('Error fetching weather alerts:', alertsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch weather alerts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!weatherAlerts || weatherAlerts.length === 0) {
      console.log('No active weather alerts found');
      return new Response(
        JSON.stringify({ message: 'No active weather alerts to monitor' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all user locations (from profiles table)
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('user_id, phone_number');

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
    }

    const results = [];

    // For demo purposes, we'll use a few default locations
    // In production, you'd get user locations from their profiles
    const defaultLocations = [
      { name: 'New York', lat: 40.7128, lon: -74.0060 },
      { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
      { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
    ];

    for (const location of defaultLocations) {
      try {
        // Fetch current weather data
        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${openWeatherApiKey}&units=imperial`
        );

        if (!weatherResponse.ok) {
          console.error(`Weather API error for ${location.name}:`, await weatherResponse.text());
          continue;
        }

        const weatherData = await weatherResponse.json();
        
        // Fetch weather alerts for this location
        let weatherAlerts: WeatherApiAlert[] = [];
        try {
          const alertsResponse = await fetch(
            `https://api.openweathermap.org/data/3.0/onecall?lat=${location.lat}&lon=${location.lon}&appid=${openWeatherApiKey}&exclude=minutely,hourly,daily`
          );
          if (alertsResponse.ok) {
            const alertsData = await alertsResponse.json();
            weatherAlerts = alertsData.alerts || [];
          }
        } catch (alertError) {
          console.log(`No alerts API access for ${location.name}, continuing with basic monitoring`);
        }

        // Fetch air quality data
        let airQuality: AirQualityData | undefined;
        try {
          const airQualityResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${location.lat}&lon=${location.lon}&appid=${openWeatherApiKey}`
          );
          if (airQualityResponse.ok) {
            const airQualityData = await airQualityResponse.json();
            airQuality = {
              aqi: airQualityData.list[0].main.aqi,
              components: airQualityData.list[0].components
            };
          }
        } catch (airError) {
          console.log(`Air quality data not available for ${location.name}`);
        }

        // Fetch 5-day forecast
        let forecast: ForecastData[] = [];
        try {
          const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&appid=${openWeatherApiKey}&units=imperial`
          );
          if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json();
            forecast = forecastData.list.slice(0, 8).map((item: any) => ({
              dt: item.dt,
              temp: Math.round(item.main.temp),
              weather: item.weather,
              wind_speed: Math.round(item.wind?.speed || 0)
            }));
          }
        } catch (forecastError) {
          console.log(`Forecast data not available for ${location.name}`);
        }
        
        const currentWeather: WeatherData = {
          temperature: Math.round(weatherData.main.temp),
          humidity: weatherData.main.humidity,
          windSpeed: Math.round(weatherData.wind?.speed || 0),
          conditions: weatherData.weather[0].description,
          location: location.name,
          coordinates: location,
          alerts: weatherAlerts,
          forecast: forecast,
          airQuality: airQuality
        };

        console.log(`Weather data for ${location.name}:`, currentWeather);

        // Process official weather alerts from OpenWeatherMap API
        if (currentWeather.alerts && currentWeather.alerts.length > 0) {
          for (const apiAlert of currentWeather.alerts) {
            // Check if we've already sent this specific alert
            const alertKey = `${location.name}-${apiAlert.event}-${apiAlert.start}`;
            const { data: existingAlert } = await supabaseClient
              .from('weather_alert_logs')
              .select('id')
              .like('weather_data', `%"alertKey":"${alertKey}"%`)
              .gte('created_at', new Date(apiAlert.start * 1000).toISOString())
              .limit(1);

            if (existingAlert && existingAlert.length > 0) {
              console.log(`Official weather alert already processed: ${apiAlert.event}`);
              continue;
            }

            // Create alert for official weather warning
            const alertMessage = `⚠️ OFFICIAL WEATHER ALERT\n\nEvent: ${apiAlert.event}\nIssued by: ${apiAlert.sender_name}\n\nDescription: ${apiAlert.description}\n\nLocation: ${location.name}\nStart: ${new Date(apiAlert.start * 1000).toLocaleString()}\nEnd: ${new Date(apiAlert.end * 1000).toLocaleString()}`;

            const { data: newAlert, error: alertCreateError } = await supabaseClient
              .from('alerts')
              .insert({
                title: `🚨 Weather Warning: ${apiAlert.event}`,
                message: alertMessage,
                alert_type: 'weather',
                priority: 'critical',
                recipients: 'all',
                status: 'sent',
                sent_at: new Date().toISOString(),
                sent_by: null // System-generated alert
              })
              .select()
              .single();

            if (!alertCreateError) {
              // Get all users who should receive weather alerts
              const { data: users } = await supabaseClient
                .from('user_preferences')
                .select('user_id')
                .eq('weather_alerts', true);

              if (users && users.length > 0) {
                const recipients = users.map(user => ({
                  alert_id: newAlert.id,
                  user_id: user.user_id,
                  delivery_method: 'system',
                  delivery_status: 'delivered',
                  delivered_at: new Date().toISOString()
                }));

                await supabaseClient.from('alert_recipients').insert(recipients);
              }

              // Log the official weather alert
              await supabaseClient
                .from('weather_alert_logs')
                .insert({
                  weather_alert_id: null, // Official alert, not user-configured
                  alert_id: newAlert.id,
                  weather_data: { ...currentWeather, alertKey },
                  affected_users_count: users?.length || 0
                });

              results.push({
                location: location.name,
                alert: `Official: ${apiAlert.event}`,
                triggered: true,
                weather: currentWeather,
                type: 'official'
              });
            }
          }
        }

        // Process air quality alerts
        if (currentWeather.airQuality && currentWeather.airQuality.aqi > 3) {
          const aqiLevels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
          const aqiLevel = aqiLevels[currentWeather.airQuality.aqi - 1] || 'Unknown';
          
          if (currentWeather.airQuality.aqi >= 4) { // Poor or Very Poor
            // Check if we've sent air quality alert recently
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const { data: recentAirAlert } = await supabaseClient
              .from('weather_alert_logs')
              .select('id')
              .like('weather_data', `%"airQualityAlert":"${location.name}"%`)
              .gte('created_at', oneHourAgo.toISOString())
              .limit(1);

            if (!recentAirAlert || recentAirAlert.length === 0) {
              const airAlertMessage = `🌫️ AIR QUALITY ALERT\n\nAir Quality Index: ${currentWeather.airQuality.aqi} (${aqiLevel})\nLocation: ${location.name}\n\nPM2.5: ${currentWeather.airQuality.components.pm2_5?.toFixed(1) || 'N/A'} μg/m³\nPM10: ${currentWeather.airQuality.components.pm10?.toFixed(1) || 'N/A'} μg/m³\n\nRecommendation: ${currentWeather.airQuality.aqi >= 5 ? 'Avoid outdoor activities' : 'Limit prolonged outdoor exertion'}`;

              const { data: airAlert, error: airAlertError } = await supabaseClient
                .from('alerts')
                .insert({
                  title: `Air Quality Alert: ${aqiLevel}`,
                  message: airAlertMessage,
                  alert_type: 'weather',
                  priority: currentWeather.airQuality.aqi >= 5 ? 'critical' : 'high',
                  recipients: 'all',
                  status: 'sent',
                  sent_at: new Date().toISOString(),
                  sent_by: null
                })
                .select()
                .single();

              if (!airAlertError) {
                const { data: users } = await supabaseClient
                  .from('user_preferences')
                  .select('user_id')
                  .eq('weather_alerts', true);

                if (users && users.length > 0) {
                  const recipients = users.map(user => ({
                    alert_id: airAlert.id,
                    user_id: user.user_id,
                    delivery_method: 'system',
                    delivery_status: 'delivered',
                    delivered_at: new Date().toISOString()
                  }));

                  await supabaseClient.from('alert_recipients').insert(recipients);
                }

                await supabaseClient
                  .from('weather_alert_logs')
                  .insert({
                    weather_alert_id: null,
                    alert_id: airAlert.id,
                    weather_data: { ...currentWeather, airQualityAlert: location.name },
                    affected_users_count: users?.length || 0
                  });

                results.push({
                  location: location.name,
                  alert: `Air Quality: ${aqiLevel}`,
                  triggered: true,
                  weather: currentWeather,
                  type: 'air_quality'
                });
              }
            }
          }
        }

        // Check user-configured weather alert thresholds
        for (const alert of weatherAlerts as WeatherAlert[]) {
          let alertTriggered = false;
          let currentValue = 0;

          // Determine the current value to compare based on alert type
          switch (alert.alert_type) {
            case 'temperature':
              currentValue = currentWeather.temperature;
              break;
            case 'wind':
              currentValue = currentWeather.windSpeed;
              break;
            case 'humidity':
              currentValue = currentWeather.humidity;
              break;
            case 'air_quality':
              currentValue = currentWeather.airQuality?.aqi || 0;
              break;
            default:
              continue;
          }

          // Check if alert condition is met
          switch (alert.condition_operator) {
            case 'greater_than':
              alertTriggered = currentValue > alert.threshold_value;
              break;
            case 'less_than':
              alertTriggered = currentValue < alert.threshold_value;
              break;
            case 'equals':
              alertTriggered = Math.abs(currentValue - alert.threshold_value) < 1;
              break;
          }

          if (alertTriggered) {
            console.log(`Custom weather alert triggered for ${location.name}: ${alert.alert_title}`);

            // Check if we've already sent this alert recently (within last hour)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const { data: recentLogs } = await supabaseClient
              .from('weather_alert_logs')
              .select('id')
              .eq('weather_alert_id', alert.id)
              .gte('created_at', oneHourAgo.toISOString())
              .limit(1);

            if (recentLogs && recentLogs.length > 0) {
              console.log(`Custom alert already sent recently for ${alert.alert_title}`);
              continue;
            }

            // Create and send the alert
            const alertMessage = `${alert.alert_message}\n\nCurrent conditions in ${location.name}:\nTemperature: ${currentWeather.temperature}°F\nWind: ${currentWeather.windSpeed} mph\nHumidity: ${currentWeather.humidity}%${currentWeather.airQuality ? `\nAir Quality: ${currentWeather.airQuality.aqi}` : ''}`;

            const { data: newAlert, error: alertCreateError } = await supabaseClient
              .from('alerts')
              .insert({
                title: `Weather Alert: ${alert.alert_title}`,
                message: alertMessage,
                alert_type: 'weather',
                priority: 'high',
                recipients: 'all',
                status: 'sent',
                sent_at: new Date().toISOString(),
                sent_by: null // System-generated alert
              })
              .select()
              .single();

            if (alertCreateError) {
              console.error('Error creating custom weather alert:', alertCreateError);
              continue;
            }

            // Get all users who should receive weather alerts
            const { data: users, error: usersError } = await supabaseClient
              .from('user_preferences')
              .select('user_id')
              .eq('weather_alerts', true);

            if (usersError) {
              console.error('Error fetching users for weather alerts:', usersError);
              continue;
            }

            // Create alert recipients
            if (users && users.length > 0) {
              const recipients = users.map(user => ({
                alert_id: newAlert.id,
                user_id: user.user_id,
                delivery_method: 'system',
                delivery_status: 'delivered',
                delivered_at: new Date().toISOString()
              }));

              const { error: recipientsError } = await supabaseClient
                .from('alert_recipients')
                .insert(recipients);

              if (recipientsError) {
                console.error('Error creating alert recipients:', recipientsError);
              }
            }

            // Log the weather alert
            const { error: logError } = await supabaseClient
              .from('weather_alert_logs')
              .insert({
                weather_alert_id: alert.id,
                alert_id: newAlert.id,
                weather_data: currentWeather,
                affected_users_count: users?.length || 0
              });

            if (logError) {
              console.error('Error logging weather alert:', logError);
            }

            results.push({
              location: location.name,
              alert: alert.alert_title,
              triggered: true,
              weather: currentWeather,
              type: 'custom'
            });
          }
        }
      } catch (error) {
        console.error(`Error processing weather for ${location.name}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Weather monitoring completed',
        results: results,
        alertsChecked: weatherAlerts.length,
        locationsChecked: defaultLocations.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in weather monitor function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});