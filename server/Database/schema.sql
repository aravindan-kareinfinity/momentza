-- Create organization table
CREATE TABLE IF NOT EXISTS organization (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    contactperson VARCHAR(100) NOT NULL DEFAULT '',
    contactno VARCHAR(20) NOT NULL DEFAULT '',
    defaultdomain VARCHAR(100) NOT NULL,
    customdomain VARCHAR(100),
    logo VARCHAR(500),
    theme JSONB DEFAULT '{"primaryColor": "#8B5CF6", "secondaryColor": "#F3F4F6"}',
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_defaultdomain ON organization(defaultdomain);
CREATE INDEX IF NOT EXISTS idx_organization_customdomain ON organization(customdomain);
CREATE INDEX IF NOT EXISTS idx_organization_name ON organization(name);

-- Insert sample organization for testing
INSERT INTO organization (id, name, contactperson, contactno, defaultdomain, customdomain, logo, theme, createdat, updatedat) VALUES
('ddae3baf-3c43-41ba-8f79-c5bb73f60cfd', 'Pakshi Organization', 'John Doe', '+1234567890', 'pakshi.localhost', 'pakshi.com', '/uploads/logo.png', '{"primaryColor": "#8B5CF6", "secondaryColor": "#F3F4F6"}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    organizationid VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    passwordhash VARCHAR(255) NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    isactive BOOLEAN NOT NULL DEFAULT true,
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_organizationid ON users(organizationid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create halls table
CREATE TABLE IF NOT EXISTS halls (
    id VARCHAR(255) PRIMARY KEY,
    organizationid VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    capacity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    images TEXT[], -- Array of image URLs
    amenities TEXT[], -- Array of amenities
    isactive BOOLEAN NOT NULL DEFAULT true,
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for halls table
CREATE INDEX IF NOT EXISTS idx_halls_organizationid ON halls(organizationid);
CREATE INDEX IF NOT EXISTS idx_halls_capacity ON halls(capacity);
CREATE INDEX IF NOT EXISTS idx_halls_price ON halls(price);
CREATE INDEX IF NOT EXISTS idx_halls_isactive ON halls(isactive);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(255) PRIMARY KEY,
    organizationid VARCHAR(255) NOT NULL,
    hallid VARCHAR(255) NOT NULL,
    customerid VARCHAR(255) NOT NULL,
    customername VARCHAR(200) NOT NULL,
    customeremail VARCHAR(255) NOT NULL,
    customerphone VARCHAR(20),
    eventdate DATE NOT NULL,
    starttime TIME NOT NULL,
    endtime TIME NOT NULL,
    totalamount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for bookings table
CREATE INDEX IF NOT EXISTS idx_bookings_organizationid ON bookings(organizationid);
CREATE INDEX IF NOT EXISTS idx_bookings_hallid ON bookings(hallid);
CREATE INDEX IF NOT EXISTS idx_bookings_customerid ON bookings(customerid);
CREATE INDEX IF NOT EXISTS idx_bookings_eventdate ON bookings(eventdate);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(255) PRIMARY KEY,
    organizationid VARCHAR(255) NOT NULL,
    hallid VARCHAR(255) NOT NULL,
    bookingid VARCHAR(255) NOT NULL,
    customername VARCHAR(200) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    isapproved BOOLEAN NOT NULL DEFAULT false,
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for reviews table
CREATE INDEX IF NOT EXISTS idx_reviews_organizationid ON reviews(organizationid);
CREATE INDEX IF NOT EXISTS idx_reviews_hallid ON reviews(hallid);
CREATE INDEX IF NOT EXISTS idx_reviews_bookingid ON reviews(bookingid);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_isapproved ON reviews(isapproved);

-- Create carousel_items table
CREATE TABLE IF NOT EXISTS carousel_items (
    id VARCHAR(255) PRIMARY KEY,
    organizationid VARCHAR(255) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    imageurl VARCHAR(500) NOT NULL,
    buttontext VARCHAR(100),
    buttonurl VARCHAR(500),
    orderposition INTEGER NOT NULL DEFAULT 0,
    isactive BOOLEAN NOT NULL DEFAULT true,
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for carousel_items table
CREATE INDEX IF NOT EXISTS idx_carousel_items_organizationid ON carousel_items(organizationid);
CREATE INDEX IF NOT EXISTS idx_carousel_items_orderposition ON carousel_items(orderposition);
CREATE INDEX IF NOT EXISTS idx_carousel_items_isactive ON carousel_items(isactive);

-- Create gallery_items table
CREATE TABLE IF NOT EXISTS gallery_items (
    id VARCHAR(255) PRIMARY KEY,
    organizationid VARCHAR(255) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    imageurl VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    orderposition INTEGER NOT NULL DEFAULT 0,
    isactive BOOLEAN NOT NULL DEFAULT true,
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for gallery_items table
CREATE INDEX IF NOT EXISTS idx_gallery_items_organizationid ON gallery_items(organizationid);
CREATE INDEX IF NOT EXISTS idx_gallery_items_category ON gallery_items(category);
CREATE INDEX IF NOT EXISTS idx_gallery_items_orderposition ON gallery_items(orderposition);
CREATE INDEX IF NOT EXISTS idx_gallery_items_isactive ON gallery_items(isactive);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(255) PRIMARY KEY,
    organizationid VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    category VARCHAR(100),
    isactive BOOLEAN NOT NULL DEFAULT true,
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for services table
CREATE INDEX IF NOT EXISTS idx_services_organizationid ON services(organizationid);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_isactive ON services(isactive);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(255) PRIMARY KEY,
    organizationid VARCHAR(255) NOT NULL,
    settingkey VARCHAR(100) NOT NULL,
    settingvalue TEXT,
    settingtype VARCHAR(50) NOT NULL DEFAULT 'string',
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(organizationid, settingkey)
);

-- Create indexes for settings table
CREATE INDEX IF NOT EXISTS idx_settings_organizationid ON settings(organizationid);
CREATE INDEX IF NOT EXISTS idx_settings_settingkey ON settings(settingkey);

-- Create foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_organization 
    FOREIGN KEY (organizationid) REFERENCES organization(id) ON DELETE CASCADE;

ALTER TABLE halls ADD CONSTRAINT fk_halls_organization 
    FOREIGN KEY (organizationid) REFERENCES organization(id) ON DELETE CASCADE;

ALTER TABLE bookings ADD CONSTRAINT fk_bookings_organization 
    FOREIGN KEY (organizationid) REFERENCES organization(id) ON DELETE CASCADE;

ALTER TABLE bookings ADD CONSTRAINT fk_bookings_hall 
    FOREIGN KEY (hallid) REFERENCES halls(id) ON DELETE CASCADE;

ALTER TABLE reviews ADD CONSTRAINT fk_reviews_organization 
    FOREIGN KEY (organizationid) REFERENCES organization(id) ON DELETE CASCADE;

ALTER TABLE reviews ADD CONSTRAINT fk_reviews_hall 
    FOREIGN KEY (hallid) REFERENCES halls(id) ON DELETE CASCADE;

ALTER TABLE reviews ADD CONSTRAINT fk_reviews_booking 
    FOREIGN KEY (bookingid) REFERENCES bookings(id) ON DELETE CASCADE;

ALTER TABLE carousel_items ADD CONSTRAINT fk_carousel_items_organization 
    FOREIGN KEY (organizationid) REFERENCES organization(id) ON DELETE CASCADE;

ALTER TABLE gallery_items ADD CONSTRAINT fk_gallery_items_organization 
    FOREIGN KEY (organizationid) REFERENCES organization(id) ON DELETE CASCADE;

ALTER TABLE services ADD CONSTRAINT fk_services_organization 
    FOREIGN KEY (organizationid) REFERENCES organization(id) ON DELETE CASCADE;

ALTER TABLE settings ADD CONSTRAINT fk_settings_organization 
    FOREIGN KEY (organizationid) REFERENCES organization(id) ON DELETE CASCADE;
