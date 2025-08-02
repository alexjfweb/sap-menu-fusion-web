-- Update existing menu customization records with poor contrast
-- Change white text to dark text for light header backgrounds
UPDATE menu_customization 
SET header_text_color = '#333333'
WHERE header_bg_color IN ('#f8f9fa', '#ffffff', '#f5f5f5', '#e9ecef') 
  AND header_text_color = '#ffffff';