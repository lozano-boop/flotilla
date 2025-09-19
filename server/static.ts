import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Cache policy: long cache for hashed assets, no-cache for HTML
  app.use((req, res, next) => {
    const url = req.url;
    // If file name contains a hash (e.g., app-XYZ123.js, .css, images), cache aggressively
    if (/\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf)$/.test(url) && /-[A-Za-z0-9]{6,}\./.test(url)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
    next();
  });

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist (no-cache to always get latest)
  app.use("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
