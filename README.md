# ZVINTAG3 Storefront

A modern storefront website for [ZVINTAG3](https://www.ebay.ca/str/zvintag3), a curated vintage streetwear and designer apparel eBay store.

## Features

- Brand-aligned black, red, and white design matching the ZVINTAG3 banner
- Responsive layout with mobile navigation
- Featured products pulled from the live eBay store
- Category filtering (Vintage Clothing, Streetwear, Retro Tees, Denim, Accessories)
- Direct links to eBay listings for purchases
- Instagram and TikTok social links

## Refreshing product data

Product images, prices, and eBay URLs are paired using eBay's listing hash metadata. To refresh products from the live store:

```bash
python3 scripts/fetch-products.py
```

The shop section paginates items locally (24 per page). Re-run the fetch script to pull the latest listings from eBay.

## Quick Start

Serve the site locally with any static file server:

```bash
# Python
python3 -m http.server 8080

# Node.js (npx)
npx serve .
```

Then open [http://localhost:8080](http://localhost:8080).

## Structure

```
├── index.html          # Main storefront page
├── css/styles.css      # Styles
├── js/main.js          # Product loading & interactions
└── assets/
    ├── images/         # Banner, logo
    └── products.json   # Featured product data from eBay
```

## eBay Store

All purchases are made through the official eBay store:
**https://www.ebay.ca/str/zvintag3**
