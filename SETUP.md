# MongoDB Setup Guide

## Quick Start

### 1. Choose Your MongoDB Option

#### Option A: Local MongoDB with Docker (Easiest)
```powershell
# Pull and run MongoDB
docker run -d -p 27017:27017 --name imprest-mongodb mongo:latest

# Verify it's running
docker ps
```

#### Option B: MongoDB Atlas (Recommended for Production)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account and cluster
3. Get connection string

#### Option C: Local MongoDB Installation
1. Download from [MongoDB.com](https://www.mongodb.com/try/download/community)
2. Install and start service

### 2. Install Dependencies
```powershell
npm install
```

### 3. Configure Environment
```powershell
# Copy example file
copy .env.example .env

# Edit .env with your database URL
notepad .env
```

Set `DATABASE_URL` to one of:
- Local: `mongodb://localhost:27017/imprest_db`
- Atlas: `mongodb+srv://username:password@cluster.mongodb.net/imprest_db`

### 4. Setup Database
```powershell
# Generate Prisma client
npm run db:generate

# Push schema to MongoDB
npm run db:push

# Seed with basic data
npm run db:seed
```

### 5. Start Development
```powershell
npm run dev
```

## Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to MongoDB |
| `npm run db:seed` | Add basic configuration data |
| `npm run db:studio` | Open visual database browser |
| `npm run db:reset` | Reset and reseed database |

## What Gets Created

The seed script sets up:
- ✅ 11 system permissions
- ✅ 5 basic expense categories  
- ✅ Default ID generation series
- ✅ Default order number series
- ❌ No user accounts (create through app)
- ❌ No mock transactions
- ❌ No sample data

## Next Steps

1. **Start the app**: `npm run dev`
2. **Create admin user** through registration
3. **Add bank accounts** in settings
4. **Start creating transactions** 

The system is now ready for production use!
