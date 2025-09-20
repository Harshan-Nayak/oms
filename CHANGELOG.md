# Changelog

All notable changes to the Bhaktinandan OMS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enhanced batch history feature with professional UI
- Summary cards showing key metrics for each batch
- Remaining quantity calculation in batch history
- Documentation for batch history feature
- Database migration for enhanced batch history function
- Test file for batch history component
- Comprehensive production statistics in batch history
- Detailed stitching challan information with top/bottom breakdown
- Additional summary cards for production metrics (top qty, bottom qty, utilization rate)
- Enhanced TypeScript types for stitching challan data

### Changed
- Updated batch history database function to include quality name as type in shorting entries
- Improved UI/UX of batch history page with beautiful card layouts
- Enhanced README.md with information about batch history feature
- Extended batch history function to include detailed stitching challan information
- Updated stitching challans table with detailed top/bottom breakdown

### Fixed
- Type error in batch history page where string|array was not properly handled

## [1.0.0] - 2025-01-15

### Added
- Initial release of Bhaktinandan OMS
- Complete authentication system with role-based access control
- Full database schema with RLS policies
- All major modules (Inventory, Ledger, Production, Purchase, Users)
- Real-time dashboard with live data
- Responsive UI with modern components