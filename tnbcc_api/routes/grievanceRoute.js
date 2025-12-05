const express = require('express');
const pool = require('../db/db');
const path = require('path');
const fs = require('fs');
const authenticateToken = require('../middleware/authMiddleware');
require('dotenv').config();

const router = express.Router();

// Grievance Routes
router.post('/grievances', authenticateToken, async (req, res) => {
    const { name, email, mobile_number, address, feedback } = req.body;
  
    if (!name || !email || !mobile_number || !address || !feedback) {
      return res.status(400).json({ error: 'All details are required' });
    }
  
    try {
      const result = await pool.query(
        'INSERT INTO grievance_report (user_id, name, email, mobile_number, address, feedback) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [req.user.user_id,name, email, mobile_number, address, feedback]
      );
  
      res.status(201).json({ message: 'Grievance submitted successfully', data: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to submit grievance' });
    }
  });
  
  // Get all grievances
  router.get('/grievances', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query('SELECT id,name, email, mobile_number, address, feedback FROM grievance_report');
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch grievances' });
    }
  });
  
  // Get a single grievance
  router.get('/grievances/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    
    try {
      const result = await pool.query('SELECT * FROM grievance_report WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Grievance not found' });
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch grievance' });
    }
  });
  
  // Update a grievance
  router.put('/grievances/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const { name, email, mobile_number, address, feedback } = req.body;
  
    try {
      const result = await pool.query(
        'UPDATE grievance_report SET name = $1, email = $2, mobile_number = $3, address = $4, feedback = $5 WHERE id = $6 RETURNING *',
        [name, email, mobile_number, address, feedback, id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Grievance not found' });
      }
  
      res.status(200).json({ message: 'Grievance updated successfully', data: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update grievance' });
    }
  });
  
  // Delete a grievance
  router.delete('/grievances/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
  
    try {
      const result = await pool.query('DELETE FROM grievance_report WHERE id = $1', [id]);
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'data not found' });
      }
  
      res.status(204).send('data deleted successfully');
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete data' });
    }
  });
module.exports = router;
