
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ExpandableDescriptionProps {
  description: string;
  maxLength?: number;
}

const ExpandableDescription = ({ description, maxLength = 100 }: ExpandableDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) return null;

  const shouldTruncate = description.length > maxLength;
  const displayText = isExpanded || !shouldTruncate 
    ? description 
    : `${description.substring(0, maxLength)}...`;

  return (
    <div className="text-sm text-muted-foreground mb-3">
      <p>{displayText}</p>
      {shouldTruncate && (
        <Button
          variant="link"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0 h-auto text-xs text-primary hover:underline"
        >
          {isExpanded ? 'Ver menos' : 'Ver más'}
        </Button>
      )}
    </div>
  );
};

export default ExpandableDescription;
