# Barcode Feature Implementation

This document describes the implementation of the barcode generation feature for stitching challans.

## Overview

The barcode feature allows users to generate barcodes for each size in a stitching challan. For each size, the system generates a specific number of barcodes based on the quantity entered by the user plus an additional 3 barcodes.

## Implementation Details

### 1. Database Schema

The stitching challan table (`isteaching_challans`) already stores size information in the `product_size` JSONB column.

### 2. UI Changes

- Added a "Barcode" column to the stitching challan list table
- Created a new print page for displaying barcodes at `/print/barcode/isteaching-challan/[id]`

### 3. API Endpoints

- `/api/barcode/isteaching-challan/[id]` - Generates barcodes for a specific stitching challan
- `/api/barcode/test` - Test endpoint for verifying barcode generation

### 4. Barcode Content

Each barcode contains the following product-specific data:
- Product Name
- Product Description
- Batch Number
- Cost Incurred on the Product So Far
- Associated Weaver Challan Number
- Associated Stitching Challan Number
- Product SKU
- Product Category
- Product Subcategory
- Product Brand
- Product Color
- Product Material
- Quality
- Ledger Name

## How It Works

1. User creates a stitching challan with size information
2. When viewing the challan list, user can click the barcode icon
3. This opens a new page displaying barcodes for each size in the challan
4. For each size, the system generates (quantity + 3) barcodes
5. Each barcode contains complete product-specific data encoded in the barcode

## Testing

A test page is available at `/print/barcode/test` to verify barcode generation functionality.

## Future Improvements

- Add support for API tokens to handle higher rate limits
- Implement bulk barcode generation for better performance
- Add caching mechanism for generated barcodes