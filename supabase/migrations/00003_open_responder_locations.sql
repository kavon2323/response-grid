-- Allow all responders on the same incident to see each other's locations
-- This improves situational awareness - a volunteer on scene should know where backup is

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Command can view all responder locations" ON responder_locations;
DROP POLICY IF EXISTS "Responders can view locations if user allows" ON responder_locations;

-- New policy: Any responder on an incident can see all responder locations for that incident
CREATE POLICY "Responders can view locations for their incidents"
  ON responder_locations FOR SELECT
  USING (
    -- User must be responding to the same incident
    incident_id IN (
      SELECT ir.incident_id
      FROM incident_responses ir
      JOIN users u ON u.id = ir.user_id
      WHERE u.auth_id = auth.uid()
    )
    -- Or user is command level (can see all in their department)
    OR (
      is_command_level() AND
      incident_id IN (
        SELECT id FROM incidents WHERE department_id = get_user_department_id()
      )
    )
  );

-- Keep the insert policy - users can only insert their own locations
-- (Already exists from initial migration)

COMMENT ON POLICY "Responders can view locations for their incidents" ON responder_locations
  IS 'All responders on an incident can see each other for situational awareness';
