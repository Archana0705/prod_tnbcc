const express = require("express");
const pool = require("../db/db");
const path = require("path");
const fs = require("fs");
const authenticateToken = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();
function hasHtmlCssJsTags(str) {
  if (!str) return false;
  const tagPattern = /<\/?(script|style|iframe|[a-z][\s\S]*?)>/i;
  return tagPattern.test(String(str));
}
// Grievance Routes
router.post("/upload", authenticateToken, async (req, res) => {
  const { information_officer, designation, mobile_number } = req.body;

  if (!information_officer || !designation || !mobile_number) {
    return res.status(400).json({ error: "All details are required" });
  }
  if (
    hasHtmlCssJsTags(information_officer) ||
    hasHtmlCssJsTags(designation) ||
    hasHtmlCssJsTags(mobile_number)
  ) {
    return res
      .status(400)
      .json({ error: "HTML, CSS, and JS tags are not allowed" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO rit_contact (user_id, information_officer, designation, mobile_number) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.user.userId, information_officer, designation, mobile_number]
    );

    res
      .status(201)
      .json({ message: "submitted successfully", data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to submit" });
  }
});

// Get all grievances
router.get("/details", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id,information_officer, designation, mobile_number  FROM rit_contact"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Get a single grievance
router.get("/detail/:id", authenticateToken, async (req, res) => {
  const id = req.params.id;

  try {
    const result = await pool.query("SELECT * FROM rit_contact WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "data not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Update a grievance
router.put("/edit/:id", authenticateToken, async (req, res) => {
  const id = req.params.id;
  const { information_officer, designation, mobile_number } = req.body;

  try {
    const result = await pool.query(
      "UPDATE rit_contact SET information_officer = $1, designation = $2, mobile_number = $3 WHERE id = $4 RETURNING *",
      [information_officer, designation, mobile_number, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "data not found" });
    }

    res
      .status(200)
      .json({ message: "data updated successfully", data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update data" });
  }
});

// Delete a grievance
router.delete("/delete/:id", authenticateToken, async (req, res) => {
  const id = req.params.id;

  try {
    const result = await pool.query("DELETE FROM rit_contact WHERE id = $1", [
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "data not found" });
    }

    res.status(200).send("data deleted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete data" });
  }
});
module.exports = router;
