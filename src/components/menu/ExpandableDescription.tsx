
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ExpandableDescriptionProps {
  description: string;
  maxLength?: number;
  textColor?: string;
}

const ExpandableDescription = ({ 
  description, 
  maxLength = 100,
  textColor = '#6c757d'
}: ExpandableDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) return null;

  const shouldTruncate = description.length > maxLength;
  const displayText = isExpanded || !shouldTruncate 
    ? description 
    : `${description.slice(0, maxLength)}...`;

  return (
    <div className="space-y-2 mb-3">
      <p 
        className="text-sm"
        style={{ color: textColor }}
      >
        {displayText}
      </p>
      {shouldTruncate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0 h-auto font-normal text-sm"
          style={{ color: textColor }}
        >
          {isExpanded ? 'Ver menos' : 'Ver más'}
        </Button>
      )}
    </div>
  );
};

export default ExpandableDescription;
