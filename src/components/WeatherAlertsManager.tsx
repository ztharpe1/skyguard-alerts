import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sanitizeInput, validateAlertTitle, validateAlertMessage } from '@/lib/security';
import { CloudRain, Thermometer, Wind, Droplets, Plus, Edit, Trash2, Play, Pause } from 'lucide-react';

interface WeatherAlert {
  id: string;
  alert_type: string;
  condition_operator: string;
  threshold_value: number;
  location_filter: string | null;
  is_active: boolean;
  alert_title: string;
  alert_message: string;
  created_at: string;
}

const WeatherAlertsManager = () => {
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<WeatherAlert | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    alert_type: 'temperature',
    condition_operator: 'greater_than',
    threshold_value: '',
    location_filter: '',
    alert_title: '',
    alert_message: '',
    is_active: true
  });

  const alertTypeIcons = {
    temperature: <Thermometer className="h-4 w-4" />,
    wind: <Wind className="h-4 w-4" />,
    humidity: <Droplets className="h-4 w-4" />,
    air_quality: <CloudRain className="h-4 w-4" />,
    storm: <CloudRain className="h-4 w-4" />
  };

  const fetchWeatherAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('weather_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWeatherAlerts(data || []);
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch weather alerts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherAlerts();
  }, []);

  const resetForm = () => {
    setFormData({
      alert_type: 'temperature',
      condition_operator: 'greater_than',
      threshold_value: '',
      location_filter: '',
      alert_title: '',
      alert_message: '',
      is_active: true
    });
    setEditingAlert(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate and sanitize inputs
    const titleValidation = validateAlertTitle(formData.alert_title);
    const messageValidation = validateAlertMessage(formData.alert_message);
    
    if (!titleValidation.isValid || !messageValidation.isValid || !formData.threshold_value) {
      toast({
        title: "Error",
        description: titleValidation.error || messageValidation.error || "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const alertData = {
        alert_type: formData.alert_type,
        condition_operator: formData.condition_operator,
        threshold_value: parseFloat(formData.threshold_value),
        location_filter: formData.location_filter ? sanitizeInput(formData.location_filter) : null,
        alert_title: titleValidation.sanitized,
        alert_message: messageValidation.sanitized,
        is_active: formData.is_active
      };

      if (editingAlert) {
        const { error } = await supabase
          .from('weather_alerts')
          .update(alertData)
          .eq('id', editingAlert.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Weather alert updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('weather_alerts')
          .insert([alertData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Weather alert created successfully"
        });
      }

      resetForm();
      setIsCreateDialogOpen(false);
      fetchWeatherAlerts();
    } catch (error) {
      console.error('Error saving weather alert:', error);
      toast({
        title: "Error",
        description: "Failed to save weather alert",
        variant: "destructive"
      });
    }
  };

  const toggleAlertStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('weather_alerts')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Weather alert ${!currentStatus ? 'activated' : 'deactivated'}`
      });
      
      fetchWeatherAlerts();
    } catch (error) {
      console.error('Error toggling alert status:', error);
      toast({
        title: "Error",
        description: "Failed to update alert status",
        variant: "destructive"
      });
    }
  };

  const deleteAlert = async (id: string) => {
    if (!confirm('Are you sure you want to delete this weather alert?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('weather_alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Weather alert deleted successfully"
      });
      
      fetchWeatherAlerts();
    } catch (error) {
      console.error('Error deleting weather alert:', error);
      toast({
        title: "Error",
        description: "Failed to delete weather alert",
        variant: "destructive"
      });
    }
  };

  const triggerWeatherCheck = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('weather-monitor');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Weather monitoring triggered successfully"
      });
    } catch (error) {
      console.error('Error triggering weather check:', error);
      toast({
        title: "Error",
        description: "Failed to trigger weather monitoring",
        variant: "destructive"
      });
    }
  };

  const editAlert = (alert: WeatherAlert) => {
    setEditingAlert(alert);
    setFormData({
      alert_type: alert.alert_type,
      condition_operator: alert.condition_operator,
      threshold_value: alert.threshold_value.toString(),
      location_filter: alert.location_filter || '',
      alert_title: alert.alert_title,
      alert_message: alert.alert_message,
      is_active: alert.is_active
    });
    setIsCreateDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center">Loading weather alerts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Weather Alerts</h2>
        <div className="flex gap-2">
          <Button onClick={triggerWeatherCheck} variant="outline">
            <Play className="h-4 w-4 mr-2" />
            Check Weather Now
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Weather Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingAlert ? 'Edit Weather Alert' : 'Create Weather Alert'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="alert_title">Alert Title *</Label>
                  <Input
                    id="alert_title"
                    value={formData.alert_title}
                    onChange={(e) => setFormData({ ...formData, alert_title: e.target.value })}
                    placeholder="e.g., High Temperature Warning"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="alert_type">Alert Type</Label>
                  <Select value={formData.alert_type} onValueChange={(value) => setFormData({ ...formData, alert_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temperature">Temperature</SelectItem>
                      <SelectItem value="wind">Wind Speed</SelectItem>
                      <SelectItem value="humidity">Humidity</SelectItem>
                      <SelectItem value="air_quality">Air Quality Index</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="condition_operator">Condition</Label>
                    <Select value={formData.condition_operator} onValueChange={(value) => setFormData({ ...formData, condition_operator: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="greater_than">Greater than</SelectItem>
                        <SelectItem value="less_than">Less than</SelectItem>
                        <SelectItem value="equals">Equals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="threshold_value">
                      Threshold ({formData.alert_type === 'temperature' ? '°F' : formData.alert_type === 'wind' ? 'mph' : formData.alert_type === 'air_quality' ? 'AQI' : '%'}) *
                    </Label>
                    <Input
                      id="threshold_value"
                      type="number"
                      value={formData.threshold_value}
                      onChange={(e) => setFormData({ ...formData, threshold_value: e.target.value })}
                      placeholder="e.g., 85"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location_filter">Location Filter (Optional)</Label>
                  <Input
                    id="location_filter"
                    value={formData.location_filter}
                    onChange={(e) => setFormData({ ...formData, location_filter: e.target.value })}
                    placeholder="e.g., New York, Los Angeles"
                  />
                </div>

                <div>
                  <Label htmlFor="alert_message">Alert Message *</Label>
                  <Textarea
                    id="alert_message"
                    value={formData.alert_message}
                    onChange={(e) => setFormData({ ...formData, alert_message: e.target.value })}
                    placeholder="Message to send when alert is triggered..."
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <Button type="submit" className="w-full">
                  {editingAlert ? 'Update Alert' : 'Create Alert'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Weather Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {weatherAlerts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No weather alerts configured. Create your first alert to start monitoring weather conditions.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weatherAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{alert.alert_title}</div>
                        <div className="text-sm text-muted-foreground">{alert.alert_message.substring(0, 50)}...</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {alertTypeIcons[alert.alert_type as keyof typeof alertTypeIcons]}
                        <span className="capitalize">{alert.alert_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {alert.condition_operator.replace('_', ' ')} {alert.threshold_value}
                        {alert.alert_type === 'temperature' ? '°F' : 
                         alert.alert_type === 'wind' ? ' mph' : 
                         alert.alert_type === 'air_quality' ? ' AQI' : '%'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={alert.is_active ? "default" : "secondary"}>
                        {alert.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAlertStatus(alert.id, alert.is_active)}
                        >
                          {alert.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editAlert(alert)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherAlertsManager;