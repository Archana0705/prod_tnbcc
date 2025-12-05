const express = require('express');
const pool = require('../db/db');
const path = require('path');
const fs = require('fs');
const authenticateToken = require('../middleware/authMiddleware');
require('dotenv').config();



const router = express.Router();

router.post('/upload', authenticateToken, async (req, res) => {

  if (!req.files || !req.files.file) return res.status(400).json({ error: 'File is required' });

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
        'INSERT INTO community_list_english (user_id , filename, file_type) VALUES ($1, $2, $3) RETURNING *',
        [req.user.userId,  uploadedFile.name, uploadedFile.mimetype]
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
  
  const query = `SELECT filename FROM community_list_english WHERE id = $1 AND file_type = ANY($2::text[])`;
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
    const result = await pool.query('SELECT id ,filename, file_type FROM community_list_english');
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

  // Validate input
  if (!req.files || !req.files.file) return res.status(400).json({ error: 'File is required' });

  // Check if the user detail exists
  const checkResult = await pool.query('SELECT * FROM community_list_english WHERE id = $1', [id]);
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
        'UPDATE community_list_english SET  filename = $1, file_type = $2 WHERE id = $3 RETURNING *',
        [ uploadedFile.name, uploadedFile.mimetype, id]
      );
    } else {
      console.log("something went wrong")
    }

    res.status(200).json({ message: 'Data updated successfully' });
  } catch (err) {
    console.error('Error editing data:', err);
    res.status(500).json({ error: 'Failed to edit data' });
  }
});


// Delete community_list_english
router.delete('/delete/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM community_list_english WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'data not found' });
    }

    res.status(200).send({message:'Community list [English] deleted successfully'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete Community list [English]' });
  }

});


module.exports = router;