const express = require("express");
const ExpressError = require("../expressError");
const slugify = require("slugify");
const router = express.Router();
const db = require("../db");

//Retun list of companies
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});

//Reutns obj of company, if the company given cannot be found, this should return a 404 status response.
router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query("SELECT * FROM companies WHERE code = $1", [
      code,
    ]);
    const invResult = await db.query(
      `SELECT id
       FROM invoices
       WHERE comp_code = $1`,
      [code]
    );

    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}`, 404);
    }
    const company = compResult.rows[0];
    const invoices = invResult.rows;

    company.invoices = invoices.map((inv) => inv.id);

    return res.json({ company: company });
  } catch (e) {
    return next(e);
  }
});

// Adds a company. Needs to be given JSON like: {code, name, description} Returns obj of new company:  {company: {code, name, description}}

router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    let code = slugify(name, { lower: true });
    const results = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description",
      [code, name, description]
    );
    return res.status(201).json({ comapnies: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

//Edit existing company. Should return 404 if company cannot be found.  Needs to be given JSON like: {name, description} Returns update company object: {company: {code, name, description}}

router.patch("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const results = await db.query(
      "UPDATE companies SET name=$1, type=$2 WHERE id=$3 RETURNING code, name, description",
      [name, description, code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't update company with code of ${code}`, 404);
    }
    return res.send({ companies: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

//Deletes company. Should return 404 if company cannot be found.Returns {status: "deleted"}

router.delete("/:code", async (req, res, next) => {
  try {
    const result = await db.query(
      `DELETE FROM companies
       WHERE code=$1
       RETURNING code`,
      [code]
    );
    if (result.rows.length == 0) {
      throw new ExpressError(`No such company: ${code}`, 404);
    } else {
      return res.json({ status: "deleted" });
    }
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
