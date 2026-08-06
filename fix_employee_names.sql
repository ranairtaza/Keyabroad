-- 1. Fix the existing historical data for Junaid
UPDATE registrations 
SET completed_by = 'Junaid Mehmood' 
WHERE completed_by = 'junaid' OR completed_by LIKE 'junaid (%';

UPDATE enquiries 
SET completed_by = 'Junaid Mehmood' 
WHERE completed_by = 'junaid' OR completed_by LIKE 'junaid (%';

-- 2. Create an automated function to cascade future name changes
CREATE OR REPLACE FUNCTION cascade_team_member_name_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If an employee's name is updated in the team_members table
  IF NEW.name <> OLD.name THEN
    
    -- Update all their old registrations
    UPDATE registrations SET completed_by = NEW.name WHERE completed_by = OLD.name;
    
    -- Update all their old walk-in enquiries
    UPDATE enquiries SET completed_by = NEW.name WHERE completed_by = OLD.name;
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach the trigger permanently to the team_members table
DROP TRIGGER IF EXISTS trg_team_member_name_change ON team_members;
CREATE TRIGGER trg_team_member_name_change
AFTER UPDATE OF name ON team_members
FOR EACH ROW
EXECUTE FUNCTION cascade_team_member_name_change();
