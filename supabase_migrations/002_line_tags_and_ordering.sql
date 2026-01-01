-- =============================================================================
-- Migration: Add Line Tags and Sort Order
-- Run this in Supabase SQL Editor
-- =============================================================================

-- 1. Add sort_order column to lines table for drag-and-drop ordering
ALTER TABLE lines ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Set initial sort order based on name (alphabetical)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as rn
  FROM lines
)
UPDATE lines SET sort_order = ordered.rn
FROM ordered WHERE lines.id = ordered.id;

-- 2. Create line_tags table for categorizing lines (rows)
CREATE TABLE IF NOT EXISTS line_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT 'slate', -- tailwind color name: slate, red, orange, amber, emerald, cyan, blue, violet, pink
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure unique tag names
  CONSTRAINT line_tags_name_unique UNIQUE (name)
);

-- 3. Add line_tag_id column to lines table
ALTER TABLE lines ADD COLUMN IF NOT EXISTS line_tag_id uuid REFERENCES line_tags(id) ON DELETE SET NULL;

-- 4. Enable RLS on line_tags
ALTER TABLE line_tags ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for line_tags (same pattern as other tables)
CREATE POLICY "Enable read access for authenticated users" ON line_tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON line_tags
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON line_tags
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON line_tags
  FOR DELETE TO authenticated USING (true);

-- 6. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lines_sort_order ON lines(sort_order);
CREATE INDEX IF NOT EXISTS idx_lines_line_tag_id ON lines(line_tag_id);
CREATE INDEX IF NOT EXISTS idx_line_tags_sort_order ON line_tags(sort_order);

-- 7. Insert some default line tags (optional - remove if you don't want these)
INSERT INTO line_tags (name, color, description, sort_order) VALUES
  ('Instructor', 'emerald', 'Flight instructors', 1),
  ('Rental Car', 'blue', 'Rental vehicles', 2),
  ('Checkride', 'amber', 'Checkride scheduling', 3),
  ('Airbnb', 'violet', 'Lodging accommodations', 4)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- Verification: Run these SELECTs to confirm the migration worked
-- =============================================================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'lines';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'line_tags';
-- SELECT * FROM line_tags;
