
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, MessageCircle, Hash } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type BusinessInfo = Tables<'business_info'>;

interface BusinessInfoDisplayProps {
  businessInfo: BusinessInfo;
}

const BusinessInfoDisplay = ({ businessInfo }: BusinessInfoDisplayProps) => {
  const socialLinks = [
    { icon: Globe, url: businessInfo.website_url, label: 'Sitio Web' },
    { icon: Facebook, url: businessInfo.facebook_url, label: 'Facebook' },
    { icon: Instagram, url: businessInfo.instagram_url, label: 'Instagram' },
    { icon: Twitter, url: businessInfo.twitter_url, label: 'X (Twitter)' },
    { icon: MessageCircle, url: businessInfo.whatsapp_url, label: 'WhatsApp' },
    { icon: Hash, url: businessInfo.tiktok_url, label: 'TikTok' },
  ].filter(link => link.url);

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <Card className="overflow-hidden border-0 shadow-lg">
        {/* Cover Image */}
        {businessInfo.cover_image_url && (
          <div className="relative h-48 md:h-64 w-full">
            <img
              src={businessInfo.cover_image_url}
              alt="Portada del restaurante"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}
        
        <CardContent className="p-6 md:p-8">
          <div className="text-center space-y-6">
            {/* Logo and Business Name */}
            <div className="flex flex-col items-center space-y-4">
              {businessInfo.logo_url && (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                  <img
                    src={businessInfo.logo_url}
                    alt="Logo del restaurante"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-primary">
                  {businessInfo.business_name}
                </h2>
                {businessInfo.description && (
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    {businessInfo.description}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {businessInfo.address && (
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-center">{businessInfo.address}</span>
                </div>
              )}
              
              {businessInfo.phone && (
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                  <a 
                    href={`tel:${businessInfo.phone}`} 
                    className="hover:text-primary transition-colors"
                  >
                    {businessInfo.phone}
                  </a>
                </div>
              )}
              
              {businessInfo.email && (
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                  <a 
                    href={`mailto:${businessInfo.email}`} 
                    className="hover:text-primary transition-colors"
                  >
                    {businessInfo.email}
                  </a>
                </div>
              )}
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex flex-wrap justify-center gap-3">
                  {socialLinks.map((link, index) => {
                    const IconComponent = link.icon;
                    return (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 px-3 py-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors text-sm"
                        title={link.label}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="hidden sm:inline">{link.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tax ID Badge */}
            {businessInfo.tax_id && (
              <div className="pt-2">
                <Badge variant="outline" className="text-xs">
                  NIT: {businessInfo.tax_id}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessInfoDisplay;
