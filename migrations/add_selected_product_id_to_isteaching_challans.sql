-- Add selected_product_id column to isteaching_challans table
ALTER TABLE isteaching_challans 
ADD COLUMN selected_product_id integer REFERENCES products(id);

-- Add index for better query performance
CREATE INDEX idx_isteaching_challans_selected_product_id ON isteaching_challans(selected_product_id);