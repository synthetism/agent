# AI-FS Safety Demonstration

This directory contains safe filesystem operations demonstration files.

## Safety Constraints Active:
- ✅ Path restrictions: `./demo/**` only
- ✅ Operation whitelist: read, create, replace only  
- ✅ Size limits: 1MB maximum
- ✅ Depth limits: 3 levels maximum
- ⚠️ No terminal access
- ⚠️ No network operations
- ⚠️ No system file access

## Available for AI Operations:
- `config.json` - Sample configuration file
- `data.txt` - Sample data file
- This README file

Agent can safely create, read, and modify files within this sandbox.
