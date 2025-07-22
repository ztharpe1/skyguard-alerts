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
        
        const currentWeather: WeatherData = {
          temperature: Math.round(weatherData.main.temp),
          humidity: weatherData.main.humidity,
          windSpeed: Math.round(weatherData.wind?.speed * 2.237), // Convert m/s to mph
          conditions: weatherData.weather[0].description,
          location: location.name,
          coordinates: location
        };

        console.log(`Weather data for ${location.name}:`, currentWeather);

        // Check each weather alert against current conditions
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
            console.log(`Weather alert triggered for ${location.name}: ${alert.alert_title}`);

            // Check if we've already sent this alert recently (within last hour)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const { data: recentLogs } = await supabaseClient
              .from('weather_alert_logs')
              .select('id')
              .eq('weather_alert_id', alert.id)
              .gte('created_at', oneHourAgo.toISOString())
              .limit(1);

            if (recentLogs && recentLogs.length > 0) {
              console.log(`Alert already sent recently for ${alert.alert_title}`);
              continue;
            }

            // Create and send the alert
            const alertMessage = `${alert.alert_message}\n\nCurrent conditions in ${location.name}:\nTemperature: ${currentWeather.temperature}°F\nWind: ${currentWeather.windSpeed} mph\nHumidity: ${currentWeather.humidity}%`;

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
              console.error('Error creating weather alert:', alertCreateError);
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
              weather: currentWeather
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