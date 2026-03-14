-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    region VARCHAR(100) DEFAULT 'Unknown',
    farm_size VARCHAR(100) DEFAULT 'Unknown',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Scans table
CREATE TABLE IF NOT EXISTS scans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    local_id VARCHAR(255) NOT NULL UNIQUE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    accuracy DECIMAL(10, 2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Image Metadata
    resolution VARCHAR(50),
    orientation VARCHAR(20),
    flash_used BOOLEAN,
    quality_flag VARCHAR(50) DEFAULT 'Unknown',
    
    -- Crop Context
    growth_stage VARCHAR(50) DEFAULT 'Unknown',
    plant_age VARCHAR(50),
    
    -- Diagnosis
    model_prediction VARCHAR(255),
    confidence DECIMAL(5, 4),
    severity VARCHAR(50) DEFAULT 'Unknown',
    user_verified BOOLEAN DEFAULT FALSE,
    final_diagnosis VARCHAR(255),
    
    -- Environment
    weather VARCHAR(50) DEFAULT 'Unknown',
    weed_presence VARCHAR(20) DEFAULT 'Not Sure',
    leafhopper_observed VARCHAR(20) DEFAULT 'Not Sure',
    
    -- App Usage
    retries INTEGER DEFAULT 0,
    time_spent_seconds INTEGER,
    result_accepted BOOLEAN,
    
    -- Device Info
    device_model VARCHAR(255),
    os_version VARCHAR(50),
    
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    image_url VARCHAR(255)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
