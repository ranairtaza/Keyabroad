"use client";

import { useCompareStore, CompareItem } from '@/store/compare';
import { Button } from '@keyabroad/ui/components/button';
import { Plus, Check } from 'lucide-react';

interface CompareButtonProps {
  item: CompareItem;
}

export function CompareButton({ item }: CompareButtonProps) {
  const { items, addItem, removeItem } = useCompareStore();
  
  const isSelected = items.some(i => i.id === item.id);
  const isFull = items.length >= 4;

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the Link
    e.stopPropagation();

    if (isSelected) {
      removeItem(item.id);
    } else if (!isFull) {
      addItem(item);
    }
  };

  return (
    <Button 
      variant={isSelected ? "default" : "outline"}
      size="sm"
      className={`w-full mt-4 ${isSelected ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
      onClick={toggleCompare}
      disabled={!isSelected && isFull}
    >
      {isSelected ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Added to Compare
        </>
      ) : (
        <>
          <Plus className="h-4 w-4 mr-2" />
          {isFull ? 'Compare Full' : 'Compare'}
        </>
      )}
    </Button>
  );
}
