-- Create microsite_components table
CREATE TABLE IF NOT EXISTS microsite_components (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    orderposition INTEGER NOT NULL,
    isactive BOOLEAN NOT NULL DEFAULT true,
    organizationid VARCHAR(255),
    config JSONB, -- Store component configuration as JSON
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_microsite_components_organizationid ON microsite_components(organizationid);
CREATE INDEX IF NOT EXISTS idx_microsite_components_orderposition ON microsite_components(orderposition);
CREATE INDEX IF NOT EXISTS idx_microsite_components_type ON microsite_components(type);
CREATE INDEX IF NOT EXISTS idx_microsite_components_isactive ON microsite_components(isactive);

-- Create unique constraint for organization + orderposition combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_microsite_components_org_orderposition ON microsite_components(organizationid, orderposition);

-- Add foreign key constraint if organizations table exists
-- ALTER TABLE microsite_components ADD CONSTRAINT fk_microsite_components_organization 
--     FOREIGN KEY (organizationid) REFERENCES organizations(id) ON DELETE CASCADE;

-- Insert sample data for testing
INSERT INTO microsite_components (id, type, orderposition, isactive, organizationid, config, createdat, updatedat) VALUES
('1', 'carousel', 1, true, '1', '{"title": "Welcome", "description": "Welcome to our venue"}', NOW(), NOW()),
('2', 'halls', 2, true, '1', '{"showFilters": true, "itemsPerPage": 6}', NOW(), NOW()),
('3', 'reviews', 3, true, '1', '{"maxReviews": 5, "showRating": true}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
