-- Add fields for CAD Page format parsing
-- Supports format:
--   CAD Page
--   Incident #004525
--   RespArea E2
--   MEDC2: MED, CODE 2 MEDICAL
--   Address + Google Maps link
--   Resources: ems, fire, police
--   Remarks/Responding to/Determined/Caller Statement

-- Add new columns to incidents table
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS response_area TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resources_assigned JSONB DEFAULT '[]';
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS responding_to TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS determined TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS caller_statement TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS raw_cad_text TEXT;

-- Add index for response area searches
CREATE INDEX IF NOT EXISTS idx_incidents_response_area ON incidents(response_area);

-- Comment the new fields
COMMENT ON COLUMN incidents.response_area IS 'Response area code from CAD (e.g., E2, W1)';
COMMENT ON COLUMN incidents.resources_assigned IS 'JSON array of assigned resources (EMS, Fire, Police units)';
COMMENT ON COLUMN incidents.remarks IS 'Additional remarks from CAD dispatch';
COMMENT ON COLUMN incidents.responding_to IS 'What responders are responding to (from CAD)';
COMMENT ON COLUMN incidents.determined IS 'Incident determination notes from CAD';
COMMENT ON COLUMN incidents.caller_statement IS 'Original caller statement from CAD';
COMMENT ON COLUMN incidents.google_maps_url IS 'Google Maps URL for incident location';
COMMENT ON COLUMN incidents.raw_cad_text IS 'Original raw CAD page text for reference';
