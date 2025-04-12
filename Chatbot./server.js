const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

// In-memory storage for chat history
const inMemoryStorage = [];
let useInMemoryStorage = true; // Default to in-memory storage

// SQL Server Configuration
// Direct use of the server name without parsing to avoid backslash issues
const config = {
  server: 'localhost',
  database: process.env.DB_DATABASE,
  options: {
    trustServerCertificate: true,
    enableArithAbort: true,
    encrypt: false,
    instanceName: 'SQLEXPRESS'
  },
  authentication: {
    type: 'default',
    options: {
      trustedConnection: true
    }
  },
  connectionTimeout: 30000
};

console.log('Trying to connect to SQL Server with config:', JSON.stringify(config, null, 2));

// Create the ChatHistory table if it doesn't exist
async function initializeDatabase() {
  try {
    console.log('Trying to connect to SQL Server...');
    await sql.connect(config);
    console.log('SQL Server connection successful');
    
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatHistory')
      BEGIN
        CREATE TABLE ChatHistory (
          id INT IDENTITY(1,1) PRIMARY KEY,
          prompt NVARCHAR(MAX) NOT NULL,
          timestamp DATETIME DEFAULT GETDATE()
        )
      END
    `;
    await sql.query(createTableQuery);
    console.log('Database initialized successfully');
    useInMemoryStorage = false; // Switch to SQL Server storage
  } catch (err) {
    console.error('Database initialization error:', err.message);
    console.log('Falling back to in-memory storage');
    useInMemoryStorage = true;
  } finally {
    console.log(`Using ${useInMemoryStorage ? 'in-memory' : 'SQL Server'} storage`);
  }
}

// Initialize the database when the server starts
initializeDatabase();

// API Routes
// Save chat history
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (useInMemoryStorage) {
      // Use in-memory storage
      const newEntry = {
        id: inMemoryStorage.length + 1,
        prompt: prompt,
        timestamp: new Date()
      };
      inMemoryStorage.push(newEntry);
      console.log('Saved prompt to in-memory storage:', prompt.substring(0, 50) + '...');
    } else {
      // Use SQL Server
      try {
        const pool = await sql.connect(config);
        await pool.request()
          .input('prompt', sql.NVarChar, prompt)
          .query('INSERT INTO ChatHistory (prompt) VALUES (@prompt)');
        console.log('Saved prompt to SQL Server:', prompt.substring(0, 50) + '...');
      } catch (sqlErr) {
        console.error('SQL error, falling back to in-memory:', sqlErr.message);
        useInMemoryStorage = true;
        // Save to in-memory as fallback
        const newEntry = {
          id: inMemoryStorage.length + 1,
          prompt: prompt,
          timestamp: new Date()
        };
        inMemoryStorage.push(newEntry);
      }
    }
    
    res.status(201).json({ success: true, message: 'Chat history saved' });
  } catch (err) {
    console.error('Error saving chat history:', err.message);
    res.status(500).json({ error: 'Failed to save chat history' });
  }
});

// Get chat history
app.get('/api/history', async (req, res) => {
  try {
    if (useInMemoryStorage) {
      // Use in-memory storage
      const sortedHistory = [...inMemoryStorage].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      console.log('Returning in-memory history:', sortedHistory.length, 'entries');
      res.json(sortedHistory);
    } else {
      // Use SQL Server
      try {
        const pool = await sql.connect(config);
        const result = await pool.request()
          .query('SELECT id, prompt, timestamp FROM ChatHistory ORDER BY timestamp DESC');
        console.log('Returning SQL Server history:', result.recordset.length, 'entries');
        res.json(result.recordset);
      } catch (sqlErr) {
        console.error('SQL error, falling back to in-memory for history:', sqlErr.message);
        useInMemoryStorage = true;
        // Return in-memory as fallback
        const sortedHistory = [...inMemoryStorage].sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        res.json(sortedHistory);
      }
    }
  } catch (err) {
    console.error('Error fetching chat history:', err.message);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open your browser and navigate to: http://localhost:${PORT}`);
}); 