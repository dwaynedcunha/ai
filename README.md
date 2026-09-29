# ANPR Vision — Automatic Number Plate Recognition

## Purpose

ANPR Vision is a frontend prototype for demonstrating an automatic number plate recognition research workflow. It provides an interactive, browser-based walkthrough of image input, preprocessing, plate localization, cropping, OCR, and a simulated result.

**This project is a frontend-only research demonstration. It does not contain a backend or a production machine-learning model. Detection and OCR results are simulated for demonstration purposes.**

## Features

- Vehicle image upload with drag-and-drop, preview, replace, and remove controls
- Simulated number plate detection with an animated bounding box
- Browser-side plate crop visualization and simulated OCR result
- Animated processing pipeline and confidence indicator
- Four built-in demo samples with predefined demonstration results
- Research-paper methodology and reported-results visualization
- Detection history stored in browser localStorage
- Export demo results as JSON or TXT
- Responsive layout with smooth section navigation

## Installation

```sh
npm install
```

## Run

```sh
npm run dev
```

Vite prints the local URL when the development server starts. To create a production build, run `npm run build`.

## Demo behavior

Uploaded images remain in the browser. Arbitrary uploads receive a generated `DEMO-XXXX` plate value; selecting a built-in sample uses its predefined example plate. Bounding boxes, confidence values, and recognition are illustrative only and are not model predictions. Research accuracy values shown in the results section are labeled as values reported by the referenced paper and are not results produced by this website.

Sample vehicle photography is loaded from Unsplash. All interaction, simulation, history, and exports run in the browser; there are no APIs, credentials, database, or server-side ML requirements.