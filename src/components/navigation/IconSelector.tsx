import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Home, Package, ShoppingCart, Calendar, BarChart3, Settings, Users, 
  CreditCard, MessageCircle, Zap, LogIn, LayoutDashboard, Search,
  ArrowLeft, ArrowRight, User, Mail, Phone, Globe, MapPin, Star,
  Heart, Bell, Shield, Lock, Key, Database, Cloud, Download,
  Upload, Image, File, Folder, Tag, Link, Share, Copy, Edit,
  Trash, Plus, Minus, Check, X, AlertTriangle, Info, Eye,
  EyeOff, Menu, MoreHorizontal, MoreVertical, ChevronDown,
  ChevronUp, ChevronLeft, ChevronRight, Play, Pause, Square,
  Volume2, VolumeX, Maximize, Minimize, RefreshCw, Power
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const iconOptions = [
  { name: 'Home', component: Home },
  { name: 'Package', component: Package },
  { name: 'ShoppingCart', component: ShoppingCart },
  { name: 'Calendar', component: Calendar },
  { name: 'BarChart3', component: BarChart3 },
  { name: 'Settings', component: Settings },
  { name: 'Users', component: Users },
  { name: 'CreditCard', component: CreditCard },
  { name: 'MessageCircle', component: MessageCircle },
  { name: 'Zap', component: Zap },
  { name: 'LogIn', component: LogIn },
  { name: 'LayoutDashboard', component: LayoutDashboard },
  { name: 'Search', component: Search },
  { name: 'ArrowLeft', component: ArrowLeft },
  { name: 'ArrowRight', component: ArrowRight },
  { name: 'User', component: User },
  { name: 'Mail', component: Mail },
  { name: 'Phone', component: Phone },
  { name: 'Globe', component: Globe },
  { name: 'MapPin', component: MapPin },
  { name: 'Star', component: Star },
  { name: 'Heart', component: Heart },
  { name: 'Bell', component: Bell },
  { name: 'Shield', component: Shield },
  { name: 'Lock', component: Lock },
  { name: 'Key', component: Key },
  { name: 'Database', component: Database },
  { name: 'Cloud', component: Cloud },
  { name: 'Download', component: Download },
  { name: 'Upload', component: Upload },
  { name: 'Image', component: Image },
  { name: 'File', component: File },
  { name: 'Folder', component: Folder },
  { name: 'Tag', component: Tag },
  { name: 'Link', component: Link },
  { name: 'Share', component: Share },
  { name: 'Copy', component: Copy },
  { name: 'Edit', component: Edit },
  { name: 'Trash', component: Trash },
  { name: 'Plus', component: Plus },
  { name: 'Minus', component: Minus },
  { name: 'Check', component: Check },
  { name: 'X', component: X },
  { name: 'AlertTriangle', component: AlertTriangle },
  { name: 'Info', component: Info },
  { name: 'Eye', component: Eye },
  { name: 'EyeOff', component: EyeOff },
  { name: 'Menu', component: Menu },
  { name: 'MoreHorizontal', component: MoreHorizontal },
  { name: 'MoreVertical', component: MoreVertical },
  { name: 'ChevronDown', component: ChevronDown },
  { name: 'ChevronUp', component: ChevronUp },
  { name: 'ChevronLeft', component: ChevronLeft },
  { name: 'ChevronRight', component: ChevronRight },
  { name: 'Play', component: Play },
  { name: 'Pause', component: Pause },
  { name: 'Square', component: Square },
  { name: 'Volume2', component: Volume2 },
  { name: 'VolumeX', component: VolumeX },
  { name: 'Maximize', component: Maximize },
  { name: 'Minimize', component: Minimize },
  { name: 'RefreshCw', component: RefreshCw },
  { name: 'Power', component: Power },
];

interface IconSelectorProps {
  selectedIcon: string;
  onIconSelect: (iconName: string) => void;
}

export const IconSelector: React.FC<IconSelectorProps> = ({
  selectedIcon,
  onIconSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);

  const filteredIcons = iconOptions.filter(icon =>
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedIconComponent = iconOptions.find(icon => icon.name === selectedIcon)?.component;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {selectedIconComponent && 
            React.createElement(selectedIconComponent, { className: "h-4 w-4 mr-2" })
          }
          {selectedIcon || 'Seleccionar ícono'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar íconos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <ScrollArea className="h-64">
            <div className="grid grid-cols-6 gap-2 p-1">
              {filteredIcons.map((icon) => {
                const IconComponent = icon.component;
                return (
                  <Button
                    key={icon.name}
                    variant={selectedIcon === icon.name ? "default" : "ghost"}
                    size="sm"
                    className="h-10 w-10 p-0"
                    onClick={() => {
                      onIconSelect(icon.name);
                      setOpen(false);
                    }}
                    title={icon.name}
                  >
                    <IconComponent className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
          
          {filteredIcons.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              No se encontraron íconos
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};