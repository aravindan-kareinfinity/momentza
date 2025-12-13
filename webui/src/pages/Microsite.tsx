import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  GripVertical, 
  Image as ImageIcon, 
  Type, 
  Building, 
  Star, 
  Search,
  Eye,
  Settings
} from 'lucide-react';
import { ComponentConfigDialog } from '@/components/Microsite/ComponentConfigDialog';
import { MicrositePreview } from '@/components/Microsite/MicrositePreview';
import { micrositeService, authService } from '@/services/ServiceFactory';
import { MicrositeComponent } from '@/services/interfaces/IDataService';
import { useToast } from '@/hooks/use-toast';
import { AnimatedPage } from '@/components/Layout/AnimatedPage';

const componentTypes = [
  { type: 'carousel', label: 'Carousel', icon: ImageIcon, description: 'Hero carousel with images' },
  { type: 'halls', label: 'Halls Grid', icon: Building, description: 'Display all halls' },
  { type: 'reviews', label: 'Reviews', icon: Star, description: 'Customer testimonials' },
 // { type: 'search', label: 'Hall Search', icon: Search, description: 'Search and filter halls' },
  { type: 'image', label: 'Image Block', icon: ImageIcon, description: 'Single image with caption' },
  { type: 'text', label: 'Text Block', icon: Type, description: 'Rich text content' },
];

// Helper functions
const getComponentIcon = (type: string) => {
  const component = componentTypes.find(c => c.type === type);
  return component?.icon || Type;
};

const getComponentLabel = (type: string) => {
  const component = componentTypes.find(c => c.type === type);
  return component?.label || type;
};

// Sortable Item Component
const SortableItem = ({ component, onToggle, onConfig, onRemove }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = getComponentIcon(component.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 border rounded-lg bg-white ${
        isDragging ? 'shadow-lg opacity-50' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <div {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
        </div>
        <Icon className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-medium">{getComponentLabel(component.type)}</h3>
          <p className="text-sm text-gray-500">Order: {component.orderPosition}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Badge variant={component.isActive ? 'default' : 'secondary'}>
          {component.isActive ? 'Active' : 'Inactive'}
        </Badge>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => onToggle(component.id)}
        >
          {component.isActive ? 'Hide' : 'Show'}
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => onConfig(component)}
        >
          <Settings className="h-4 w-4" />
        </Button>
        
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onRemove(component.id)}
        >
          Remove
        </Button>
      </div>
    </div>
  );
};

const Microsite = () => {
  const [components, setComponents] = useState<MicrositeComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [configComponent, setConfigComponent] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const { toast } = useToast();

  // Fetch user and components data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current user first
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        
        if (user?.organizationId) {
          // Fetch microsite components
          const componentsData = await micrositeService.getComponents(user.organizationId);
          setComponents(componentsData);
        }
      } catch (error) {
        console.error('Failed to load microsite data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load microsite components',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      let reorderedComponents: MicrositeComponent[] = [];
      
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update orderPosition numbers
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          orderPosition: index + 1
        }));
        
        // Store for API call
        reorderedComponents = updatedItems;
        
        return updatedItems;
      });

      // Persist the new order to the server
      try {
        if (currentUser?.organizationId && reorderedComponents.length > 0) {
          await micrositeService.reorderComponents(
            currentUser.organizationId, 
            reorderedComponents.map(item => item.id)
          );
        }
      } catch (error) {
        console.error('Failed to save component order:', error);
        toast({
          title: 'Error',
          description: 'Failed to save component order',
          variant: 'destructive',
        });
        // Reload components on error
        if (currentUser?.organizationId) {
          const componentsData = await micrositeService.getComponents(currentUser.organizationId);
          setComponents(componentsData);
        }
      }
    }
  };

  const addComponent = async (type: string) => {
    if (!currentUser?.organizationId) {
      toast({
        title: 'Error',
        description: 'No organization ID available',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newComponent = await micrositeService.createComponent({
        type,
        orderPosition: components.length + 1,
        isActive: true,
        organizationId: currentUser.organizationId
      });
      
      setComponents(prev => [...prev, newComponent]);
      setShowAddMenu(false);
      
      toast({
        title: 'Success',
        description: 'Component added successfully',
      });
    } catch (error) {
      console.error('Failed to add component:', error);
      toast({
        title: 'Error',
        description: 'Failed to add component',
        variant: 'destructive',
      });
    }
  };

  const removeComponent = async (id: string) => {
    try {
      const success = await micrositeService.deleteComponent(id);
      if (success) {
        setComponents(prev => prev.filter(comp => comp.id !== id));
        toast({
          title: 'Success',
          description: 'Component removed successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to remove component',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to remove component:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove component',
        variant: 'destructive',
      });
    }
  };

  const toggleComponent = async (id: string) => {
    try {
      const component = components.find(comp => comp.id === id);
      if (!component) return;
      
      const updatedComponent = await micrositeService.toggleComponent(id, !component.isActive);
      setComponents(prev => prev.map(comp => 
        comp.id === id ? updatedComponent : comp
      ));
      
      toast({
        title: 'Success',
        description: `Component ${updatedComponent.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Failed to toggle component:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle component',
        variant: 'destructive',
      });
    }
  };

  const handleConfigSave = async (config: any) => {
    if (configComponent) {
      try {
        // Create a full component object with the updated config
        const componentToUpdate = {
          ...configComponent,
          config: config,
          updatedAt: new Date().toISOString()
        };

        // Update the component configuration in the database
        const updatedComponent = await micrositeService.updateComponent(
          configComponent.id,
          componentToUpdate
        );

        // Update local state with the updated component using functional update
        setComponents(prev => prev.map(comp => 
          comp.id === configComponent.id ? updatedComponent : comp
        ));

        // Close the config dialog
        setConfigComponent(null);

        // Show success message
        toast({
          title: 'Success',
          description: 'Component configuration saved successfully',
        });
      } catch (error) {
        console.error('Failed to save component configuration:', error);
        
        // Show error message
        toast({
          title: 'Error',
          description: 'Failed to save component configuration',
          variant: 'destructive',
        });
      }
    }
  };

  const getComponentIcon = (type: string) => {
    const component = componentTypes.find(c => c.type === type);
    return component?.icon || Type;
  };

  const getComponentLabel = (type: string) => {
    const component = componentTypes.find(c => c.type === type);
    return component?.label || type;
  };

  if (loading) {
    return (
      <AnimatedPage className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Microsite Builder</h1>
            <p className="text-gray-600">Loading components...</p>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (showPreview) {
    return (
      <AnimatedPage className="space-y-0">
        <div className="flex justify-between items-center p-6 bg-white border-b">
          <h1 className="text-2xl font-bold">Microsite Preview</h1>
          <button 
            onClick={() => setShowPreview(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Editor
          </button>
        </div>
        <MicrositePreview components={components} />
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Microsite Builder</h1>
          <p className="text-gray-600">Design your landing page by organizing components</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={() => setShowAddMenu(!showAddMenu)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Component
          </Button>
        </div>
      </div>

      {showAddMenu && (
        <Card>
          <CardHeader>
            <CardTitle>Add Component</CardTitle>
            <CardDescription>Choose a component to add to your landing page</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {componentTypes.map((componentType) => {
                const Icon = componentType.icon;
                return (
                  <Card 
                    key={componentType.type}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => addComponent(componentType.type)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="font-semibold">{componentType.label}</h3>
                          <p className="text-sm text-gray-600">{componentType.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Page Components</CardTitle>
          <CardDescription>Drag and drop to reorder components</CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={components.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {components.map((component) => (
                  <SortableItem
                    key={component.id}
                    component={component}
                    onToggle={toggleComponent}
                    onConfig={setConfigComponent}
                    onRemove={removeComponent}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      <ComponentConfigDialog
        open={!!configComponent}
        onOpenChange={(open) => !open && setConfigComponent(null)}
        componentType={configComponent?.type || ''}
        currentConfig={configComponent?.config}
        onSave={handleConfigSave}
      />
    </AnimatedPage>
  );
};

export default Microsite;
