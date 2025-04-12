-- Create the database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ChatbotDB')
BEGIN
    CREATE DATABASE ChatbotDB;
END
GO

USE ChatbotDB;
GO

-- Create the ChatHistory table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatHistory')
BEGIN
    CREATE TABLE ChatHistory (
        id INT IDENTITY(1,1) PRIMARY KEY,
        prompt NVARCHAR(MAX) NOT NULL,
        timestamp DATETIME DEFAULT GETDATE()
    );
END
GO

-- Add an index on the timestamp column for faster retrieval
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ChatHistory_Timestamp')
BEGIN
    CREATE INDEX IX_ChatHistory_Timestamp ON ChatHistory(timestamp DESC);
END
GO

PRINT 'Database setup completed successfully!'; 