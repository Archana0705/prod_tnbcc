const express = require("express");
const pool = require("../db/db");
const path = require("path");
const fs = require("fs");
const authenticateToken = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

// Get user details
router.get("/user-details", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, actandrules, pdf_filename FROM user_details"
    );

    const userDetailsWithDownloadUrls = result.rows.map((userDetail) => ({
      ...userDetail,
      downloadUrl: `${process.env.PDF_URL}/apex/download_pdf/${userDetail.id}`,
    }));

    res.status(200).json(userDetailsWithDownloadUrls);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve user details" });
  }
});

// Download PDF by ID
router.get("/download_pdf/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT pdf_filename FROM user_details WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "PDF file not found" });
    }

    const filename = result.rows[0].pdf_filename;
    const filePath = path.join(__dirname, "../uploads", filename);

    res.download(filePath, filename);
  } catch (err) {
    res.status(500).json({ error: "Failed to download PDF" });
  }
});

// Upload PDF
function hasHtmlCssJsTags(str) {
  if (!str) return false;
  const tagPattern = /<\/?(script|style|iframe|[a-z][\s\S]*?)>/i;
  return tagPattern.test(String(str));
}

router.post("/upload", authenticateToken, async (req, res) => {
  const { name, actandrules } = req.body;

  if (!name || !actandrules || !req.files || !req.files.pdf) {
    return res.status(400).json({ error: "All details and PDF are required" });
  }
  // 2. XSS protection
  if (hasHtmlCssJsTags(name) || hasHtmlCssJsTags(actandrules)) {
    return res
      .status(400)
      .json({ error: "HTML, CSS, and JS tags are not allowed" });
  }

  const pdfFile = req.files.pdf;
  const uploadPath = path.join(__dirname, "../uploads", pdfFile.name);

  try {
    pdfFile.mv(uploadPath, async (err) => {
      if (err)
        return res.status(500).json({ error: "Failed to save the file" });

      const result = await pool.query(
        "INSERT INTO user_details (user_id, name, actandrules, pdf_filename) VALUES ($1, $2, $3, $4) RETURNING *",
        [req.user.userId, name, actandrules, pdfFile.name]
      );

      res
        .status(201)
        .json({ message: "File uploaded successfully", data: result.rows[0] });
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to upload data" });
  }
});
// Edit user details (PUT)
router.put("/edit-user-detail/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, actandrules } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID is required" });
  }

  // Check if the user detail exists
  const checkResult = await pool.query(
    "SELECT * FROM user_details WHERE id = $1",
    [id]
  );
  if (checkResult.rows.length === 0) {
    return res.status(404).json({ error: "User detail not found" });
  }

  try {
    // Update user details
    const updateResult = await pool.query(
      "UPDATE user_details SET name = COALESCE($1, name), actandrules = COALESCE($2, actandrules) WHERE id = $3 RETURNING *",
      [name, actandrules, id]
    );

    // If a PDF file is provided, replace the existing file
    if (req.files && req.files.pdf) {
      const pdfFile = req.files.pdf;

      // Ensure the uploaded file is a PDF
      if (pdfFile.mimetype !== "application/pdf") {
        return res.status(400).json({ error: "Only PDF files are allowed" });
      }

      const uploadPath = path.join(__dirname, "../uploads", pdfFile.name);

      await pdfFile.mv(uploadPath);

      // Update the database with the new filename
      await pool.query(
        "UPDATE user_details SET pdf_filename = $1 WHERE id = $2",
        [pdfFile.name, id]
      );
    }

    res
      .status(200)
      .json({
        message: "User detail updated successfully",
        data: updateResult.rows[0],
      });
  } catch (err) {
    console.error("Error editing user detail:", err);
    res.status(500).json({ error: "Failed to edit user detail" });
  }
});

// Delete user detail (DELETE)
router.delete(
  "/delete-user-detail/:id",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    try {
      // Retrieve the user detail to get the filename
      const result = await pool.query(
        "SELECT pdf_filename FROM user_details WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User detail not found" });
      }

      const filename = result.rows[0].pdf_filename;

      // Delete the PDF file from the server
      const filePath = path.join(__dirname, "../uploads", filename);
      try {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filename}`);
      } catch (err) {
        console.error(`Error deleting file: ${err.message}`);
      }

      // Delete the entry from the database
      await pool.query("DELETE FROM user_details WHERE id = $1", [id]);

      res.status(200).json({ message: "User detail deleted successfully" });
    } catch (err) {
      console.error("Error deleting user detail:", err);
      res.status(500).json({ error: "Failed to delete user detail" });
    }
  }
);

module.exports = router;
