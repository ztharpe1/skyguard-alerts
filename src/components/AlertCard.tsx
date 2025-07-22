import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Cloud, Building2, Info, CheckCircle } from 'lucide-react';

export interface Alert {
  id: string;
  type: 'emergency' | 'weather' | 'company' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'sent' | 'delivered' | 'read';
  recipients?: number;
}

interface AlertCardProps {
  alert: Alert;
  showRecipients?: boolean;
}

const getAlertIcon = (type: Alert['type']) => {
  switch (type) {
    case 'emergency':
      return AlertTriangle;
    case 'weather':
      return Cloud;
    case 'company':
      return Building2;
    default:
      return Info;
  }
};

const getPriorityColor = (priority: Alert['priority']) => {
  switch (priority) {
    case 'critical':
      return 'bg-destructive text-destructive-foreground';
    case 'high':
      return 'bg-warning text-warning-foreground';
    case 'medium':
      return 'bg-accent text-accent-foreground';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
};

const getStatusColor = (status: Alert['status']) => {
  switch (status) {
    case 'delivered':
      return 'bg-success text-success-foreground';
    case 'read':
      return 'bg-primary text-primary-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const AlertCard = ({ alert, showRecipients = false }: AlertCardProps) => {
  const Icon = getAlertIcon(alert.type);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              alert.priority === 'critical' ? 'bg-destructive/10' :
              alert.priority === 'high' ? 'bg-warning/10' :
              'bg-primary/10'
            }`}>
              <Icon className={`h-4 w-4 ${
                alert.priority === 'critical' ? 'text-destructive' :
                alert.priority === 'high' ? 'text-warning' :
                'text-primary'
              }`} />
            </div>
            <div>
              <CardTitle className="text-lg">{alert.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {alert.timestamp.toLocaleDateString()} at {alert.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={getPriorityColor(alert.priority)}>
              {alert.priority.toUpperCase()}
            </Badge>
            <Badge className={getStatusColor(alert.status)}>
              {alert.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-foreground mb-3">{alert.message}</p>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="capitalize">{alert.type} Alert</span>
          {showRecipients && alert.recipients && (
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4" />
              <span>{alert.recipients} recipients</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};