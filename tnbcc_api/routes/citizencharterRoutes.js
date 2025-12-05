const express = require('express');
const pool = require('../db/db');
const path = require('path');
const fs = require('fs');
const authenticateToken = require('../middleware/authMiddleware');
const { error } = require('console');
require('dotenv').config();



const router = express.Router();
function hasHtmlCssJsTags(str) {
  if (!str) return false;
  const tagPattern = /<\/?(script|style|iframe|[a-z][\s\S]*?)>/i;
  return tagPattern.test(String(str));
}
router.post('/upload', authenticateToken, async (req, res) => {
  const { cc_name } = req.body;

  if (!cc_name) return res.status(400).json({ error: 'All details are required' });
  if (!req.files || !req.files.file) return res.status(400).json({ error: 'File is required' });
 if (hasHtmlCssJsTags(cc_name)) {
    return res
      .status(400)
      .json({ error: "HTML, CSS, and JS tags are not allowed" });
  }
  const uploadedFile = req.files.file;
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'video/mp4'];
  if (!allowedMimeTypes.includes(uploadedFile.mimetype)) return res.status(400).json({ error: 'Only PDF, image, or video files are allowed' });

  const uploadDirectory = uploadedFile.mimetype.includes('pdf') ? 'uploads/pdfs' :
                         uploadedFile.mimetype.includes('image') ? 'uploads/images' : 'uploads/videos';
  const uploadPath = path.join(__dirname, '..', uploadDirectory, uploadedFile.name);

  try {
    uploadedFile.mv(uploadPath, async (err) => {
      if (err) return res.status(500).json({ error: 'Failed to save the file',err });

      const result = await pool.query(
        'INSERT INTO citizen_charter (user_id, cc_name , filename, file_type) VALUES ($1, $2, $3, $4) RETURNING *',
        [req.user.userId, cc_name , uploadedFile.name, uploadedFile.mimetype]
      );
      res.status(201).json({ message: 'File uploaded successfully', data: result.rows[0] });
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload data' });
  }
});

// Download files by type
router.get('/download/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const fileTypeMap = { pdf: 'application/pdf', image: ['image/jpeg', 'image/png'], video: 'video/mp4' };
  
  const query = `SELECT filename FROM citizen_charter WHERE id = $1 AND file_type = ANY($2::text[])`;
  const values = [id, Array.isArray(fileTypeMap[type]) ? fileTypeMap[type] : [fileTypeMap[type]]];

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: `${type} file not found` });

    const filename = result.rows[0].filename;
    const filePath = path.join(__dirname, '..', 'uploads', type === 'pdf' ? 'pdfs' : type === 'image' ? 'images' : 'videos', filename);
    res.download(filePath, filename);
  } catch (err) {
    res.status(500).json({ error: `Failed to download ${type}` });
  }
});


// Get all user details
router.get('/details', async (req, res) => {

  try {
    const result = await pool.query('SELECT id, cc_name ,filename, file_type FROM citizen_charter');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve user details' });
  }
});

router.put('/edit/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  // Log the entire request body and files for debugging
  console.log('Request Body:', req.body);
  console.log('Files:', req.files);

  const cc_name = req.body.cc_name; // Extract the specific field

  // Validate input
  if (!cc_name) return res.status(400).json({ error: 'All details are required' });
  if (!req.files || !req.files.file) return res.status(400).json({ error: 'File is required' });

  // Check if the user detail exists
  const checkResult = await pool.query('SELECT * FROM citizen_charter WHERE id = $1', [id]);
  if (checkResult.rows.length === 0) {
    return res.status(404).json({ error: 'User detail not found' });
  }

  try {
    // Check if a file is provided
    if (req.files && req.files.file) {
      const uploadedFile = req.files.file;

      // Validate file type
      const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'video/mp4'];
      if (!allowedMimeTypes.includes(uploadedFile.mimetype)) {
        return res.status(400).json({ error: 'Only PDF, image, or video files are allowed' });
      }

      // Determine upload directory based on file type
      const uploadDirectory = uploadedFile.mimetype.includes('pdf') ? 'uploads/pdfs' :
                              uploadedFile.mimetype.includes('image') ? 'uploads/images' : 'uploads/videos';
      const uploadPath = path.join(__dirname, '..', uploadDirectory, uploadedFile.name);

      // Delete the old file if it exists in the database
      const oldFile = checkResult.rows[0].pdf_filename;
      if (oldFile) {
        const oldDirectory = checkResult.rows[0].file_type.includes('pdf') ? 'uploads/pdfs' :
                             checkResult.rows[0].file_type.includes('image') ? 'uploads/images' : 'uploads/videos';
        const oldFilePath = path.join(__dirname, '..', oldDirectory, oldFile);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Move the new file to the correct directory
      await uploadedFile.mv(uploadPath);

      // Update the database with the new filename and file type
      await pool.query(
        'UPDATE citizen_charter SET cc_name = $1, filename = $2, file_type = $3 WHERE id = $4 RETURNING *',
        [cc_name, uploadedFile.name, uploadedFile.mimetype, id]
      );
    } else {
      // If no file is uploaded, just update the cc_name
      await pool.query(
        'UPDATE citizen_charter SET cc_name = $1 WHERE id = $2 RETURNING *',
        [cc_name, id]
      );
    }

    res.status(200).json({ message: 'Data updated successfully' });
  } catch (err) {
    console.error('Error editing data:', err);
    res.status(500).json({ error: 'Failed to edit data' });
  }
});


// Delete citizen_charter
router.delete('/delete/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM citizen_charter WHERE id = $1', [id]);

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