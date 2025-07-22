import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, UserPlus, Search, Filter, Edit, Phone, Mail, Shield, UserCheck, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  user_id: string;
  username: string;
  role: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
}

interface UserPreferences {
  user_id: string;
  emergency_alerts: boolean;
  weather_alerts: boolean;
  company_alerts: boolean;
  system_alerts: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
}

const ManageUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userPrefs, setUserPrefs] = useState<UserPreferences[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    loadUserPreferences();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*');

      if (error) throw error;
      setUserPrefs(data || []);
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.user_id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const updateUserPhoneNumber = async (userId: string, phoneNumber: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: phoneNumber })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.user_id === userId ? { ...user, phone_number: phoneNumber } : user
      ));

      setIsEditModalOpen(false);
      setSelectedUser(null);

      toast({
        title: "Phone Number Updated",
        description: "User phone number has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update phone number.",
        variant: "destructive",
      });
    }
  };

  const getUserPreferences = (userId: string): UserPreferences | undefined => {
    return userPrefs.find(pref => pref.user_id === userId);
  };

  const getAlertCount = (userId: string): number => {
    // This would typically come from an API call to count alerts for the user
    return Math.floor(Math.random() * 50); // Mock data for demonstration
  };

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.phone_number?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });

  const getUserStats = () => {
    const total = users.length;
    const admins = users.filter(user => user.role === 'admin').length;
    const employees = users.filter(user => user.role === 'employee').length;
    const withPhones = users.filter(user => user.phone_number).length;
    
    return { total, admins, employees, withPhones };
  };

  const stats = getUserStats();

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Manage Users</h1>
              <p className="text-muted-foreground">View and manage user accounts and permissions</p>
            </div>
          </div>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrators</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.admins}</div>
              <p className="text-xs text-muted-foreground">Admin users</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.employees}</div>
              <p className="text-xs text-muted-foreground">Standard users</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SMS Enabled</CardTitle>
              <Phone className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.withPhones}</div>
              <p className="text-xs text-muted-foreground">Can receive SMS</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrators</SelectItem>
                  <SelectItem value="employee">Employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Manage user roles, contact information, and alert preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Alert Preferences</TableHead>
                  <TableHead>Alerts Received</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const preferences = getUserPreferences(user.user_id);
                  const alertCount = getAlertCount(user.user_id);
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.username || 'No username'}</div>
                          <div className="text-sm text-muted-foreground">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => updateUserRole(user.user_id, newRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1" />
                            {user.phone_number || 'No phone'}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 mr-1" />
                            Email on file
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {preferences?.emergency_alerts && (
                            <Badge variant="destructive" className="text-xs">Emergency</Badge>
                          )}
                          {preferences?.weather_alerts && (
                            <Badge variant="default" className="text-xs">Weather</Badge>
                          )}
                          {preferences?.company_alerts && (
                            <Badge variant="secondary" className="text-xs">Company</Badge>
                          )}
                          {preferences?.sms_enabled && (
                            <Badge variant="outline" className="text-xs">SMS</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{alertCount}</div>
                          <div className="text-xs text-muted-foreground">alerts</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog open={isEditModalOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                          setIsEditModalOpen(open);
                          if (!open) setSelectedUser(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit User</DialogTitle>
                              <DialogDescription>
                                Update user information and contact details.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                  id="phone"
                                  defaultValue={selectedUser?.phone_number || ''}
                                  placeholder="+1 (555) 123-4567"
                                  onBlur={(e) => {
                                    if (selectedUser) {
                                      updateUserPhoneNumber(selectedUser.user_id, e.target.value);
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Alert Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>User Management Guidelines</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Role Permissions</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Admin:</strong> Can send alerts, manage users, view all data</li>
                  <li>• <strong>Employee:</strong> Can receive alerts, update preferences</li>
                  <li>• Role changes take effect immediately</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Contact Information</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Phone numbers are required for SMS alerts</li>
                  <li>• Email addresses are managed through authentication</li>
                  <li>• Users can update their own preferences</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ManageUsers;