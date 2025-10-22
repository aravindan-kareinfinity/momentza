
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, User } from 'lucide-react';
import { User as UserType, Hall } from '@/types';
import { userService, hallService, authService } from '@/services/ServiceFactory';
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';

const Users = () => {
  // State for data
  const [users, setUsers] = useState<UserType[]>([]);
  const [availableHalls, setAvailableHalls] = useState<Hall[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'manager' as 'admin' | 'manager',
    accessibleHalls: [] as string[]
  });

  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch data on component mount
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[Users] Fetching all users and halls data from API...');
      // Get current user first
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      
      // Fetch all users and halls in parallel (not filtered by organization)
      const [usersData, hallsData] = await Promise.all([
        userService.getAll(),
        hallService.getAllHalls()
      ]);
      
      console.log('[Users] All users data:', usersData);
      console.log('[Users] All halls data:', hallsData);
      
      // Ensure we always have arrays
      setUsers(Array.isArray(usersData) ? usersData : []);
      setAvailableHalls(Array.isArray(hallsData) ? hallsData : []);
      setShowErrorDialog(false);
    } catch (err) {
      const error = err as Error;
      console.error('Failed to load users data:', error);
      setError(error);
      setShowErrorDialog(true);
      // Set empty arrays on error to prevent map errors
      setUsers([]);
      setAvailableHalls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetry = async () => {
    await fetchData();
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  const openAddDialog = () => {
    setIsEditMode(false);
    setEditingUser(null);
    setNewUser({ name: '', email: '', password: '', role: 'manager', accessibleHalls: [] });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: UserType) => {
    setIsEditMode(true);
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      password: '', // Empty password for edit mode
      role: user.role,
      accessibleHalls: user.accessibleHalls
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setEditingUser(null);
    setNewUser({ name: '', email: '', password: '', role: 'manager', accessibleHalls: [] });
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      closeDialog();
    }
  };

  const handleSaveUser = async () => {
    if (!currentUser?.organizationId) {
      console.error('Current user has no organizationId');
      setError(new Error('Cannot save user: No organization ID available'));
      setShowErrorDialog(true);
      return;
    }

    // Validate password for new users
    if (!isEditMode && !newUser.password.trim()) {
      setError(new Error('Password is required for new users'));
      setShowErrorDialog(true);
      return;
    }
    
    try {
      if (isEditMode && editingUser) {
        // Update existing user with full entity
        const updatedUser = await userService.update(editingUser.id, {
          ...editingUser,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          accessibleHalls: newUser.accessibleHalls
        });
        
        setUsers(users.map(user => user.id === editingUser.id ? updatedUser : user));
      } else {
        // Create new user
        const newUserData = {
          name: newUser.name,
          email: newUser.email,
          password: newUser.password, // Include password for new users
          role: newUser.role,
          organizationId: currentUser.organizationId,
          accessibleHalls: newUser.accessibleHalls
        };
        
        const createdUser = await userService.create(newUserData);
        setUsers([...users, createdUser]);
      }
      
      closeDialog();
    } catch (err) {
      console.error('Failed to save user:', err);
      setError(err as Error);
      setShowErrorDialog(true);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const success = await userService.delete(userId);
      if (success) {
        setUsers(users.filter(user => user.id !== userId));
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError(err as Error);
      setShowErrorDialog(true);
    }
  };

  const handleHallAccess = (hallId: string, checked: boolean) => {
    if (checked) {
      setNewUser({ ...newUser, accessibleHalls: [...newUser.accessibleHalls, hallId] });
    } else {
      setNewUser({ ...newUser, accessibleHalls: newUser.accessibleHalls.filter(id => id !== hallId) });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !currentUser) {
    return (
      <>
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading data
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {error?.message || 'Unable to load all users'}
                </p>
                <Button onClick={handleRetry} className="mt-2">Retry</Button>
              </div>
            </div>
          </div>
        </div>

        <ServerErrorDialog
          isOpen={showErrorDialog}
          onClose={handleCloseErrorDialog}
          onRetry={handleRetry}
          isLoading={loading}
          title="Users Service Error"
          message={error?.message || 'Unable to load all users data. Please try again.'}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">All Users</h1>
            <p className="text-gray-600">View and manage all users in the system</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                {!isEditMode && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <Label>Role</Label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'manager' })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <Label>Accessible Halls</Label>
                  <div className="space-y-2 mt-2">
                    {availableHalls.map((hall) => (
                      <div key={hall.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={hall.id}
                          checked={newUser.accessibleHalls.includes(hall.id)}
                          onCheckedChange={(checked) => handleHallAccess(hall.id, checked as boolean)}
                        />
                        <Label htmlFor={hall.id}>{hall.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={handleSaveUser} className="w-full">
                  {isEditMode ? 'Update User' : 'Add User'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <User className="h-6 w-6" />
                  <div>
                    <CardTitle>{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">
                      Organization: {user.organizationId || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Accessible Halls: {user.accessibleHalls.length}
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      {user.accessibleHalls.map(hallId => {
                        const hall = availableHalls.find(h => h.id === hallId);
                        return hall ? hall.name : 'Unknown Hall';
                      }).join(', ')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <ServerErrorDialog
        isOpen={showErrorDialog}
        onClose={handleCloseErrorDialog}
        onRetry={handleRetry}
        isLoading={loading}
        title="Users Service Error"
        message={error?.message || 'Unable to load users data. Please try again.'}
      />
    </>
  );
};

export default Users;
