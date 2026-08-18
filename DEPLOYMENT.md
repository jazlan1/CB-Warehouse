# 🚀 Production Deployment & Maintenance Guide (Hostinger)

This guide provides step-by-step instructions for deploying and maintaining the **Warehouse Inventory Management Portal** on **Hostinger** (VPS or Cloud Node.js Hosting) with a zero-data-loss architecture.

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Environment Configuration (`.env`)](#3-environment-configuration-env)
4. [Database Setup (PostgreSQL)](#4-database-setup-postgresql)
5. [Hostinger VPS Deployment (Recommended)](#5-hostinger-vps-deployment-recommended)
6. [Hostinger Cloud / Web Hosting (Node.js)](#6-hostinger-cloud--web-hosting-nodejs)
7. [Safe Redeployment Workflow (Zero Data Loss)](#7-safe-redeployment-workflow-zero-data-loss)
8. [Persistent Storage & Uploads Strategy](#8-persistent-storage--uploads-strategy)
9. [Email & SMTP Configuration](#9-email--smtp-configuration)
10. [Database Migrations Strategy](#10-database-migrations-strategy)
11. [Backup & Recovery Recommendations](#11-backup--recovery-recommendations)
12. [Critical Rules: Directories That Must Never Be Deleted](#12-critical-rules-directories-that-must-never-be-deleted)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Architecture Overview

```mermaid
flowchart TD
    User([User Browser]) -->|HTTPS:443| Nginx[Nginx Reverse Proxy / SSL]
    Nginx -->|Proxy:3000| NextApp[Next.js Production Server\nPM2 Cluster]
    
    subgraph Persistent Data Layer (Never Overwritten on Redeploy)
        DB[(PostgreSQL Database\nHostinger VPS / Managed DB)]
        Uploads[Cloudinary CDN\nOR /var/www/uploads]
    end

    NextApp -->|Prisma Adapter Pool| DB
    NextApp -->|Upload Stream| Uploads
    NextApp -->|SMTP Port 465/587| MailServer[Hostinger SMTP / Gmail]
```

### Core Design Principles:
* **Separation of Code & State**: Application binaries (`.next/`, code files) are strictly decoupled from persistent user data (PostgreSQL database and uploaded media files).
* **Safe Incremental Migrations**: Schema migrations never drop tables or wipe production rows.
* **Resilient Mailer**: Supports both standard Hostinger SMTP (`smtp.hostinger.com`) and Gmail App Passwords.
* **Zero-Downtime Redeployment**: Code updates via Git and PM2 reload without affecting active user sessions or uploaded assets.

---

## 2. Prerequisites

* **Node.js**: Version `20.x` LTS or `22.x` LTS
* **Package Manager**: `npm` (v10+)
* **Database**: PostgreSQL 15+ (installed locally on Hostinger VPS, or cloud PostgreSQL like Neon, Supabase, AWS RDS, or Hostinger Managed DB)
* **Domain / Subdomain**: Pointed to your Hostinger server IP with DNS `A` record.

---

## 3. Environment Configuration (`.env`)

Create a `.env` file in the root directory on your server. **Never commit `.env` to Git.**

```env
# ==============================================================================
# ENVIRONMENT SETTINGS
# ==============================================================================
NODE_ENV=production
PORT=3000

# Your live domain URL (no trailing slash)
NEXT_PUBLIC_APP_URL=https://portal.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://portal.yourdomain.com

# Optional allowed origins for CORS
ALLOWED_ORIGINS=https://portal.yourdomain.com

# ==============================================================================
# DATABASE (PostgreSQL)
# ==============================================================================
DATABASE_URL="postgresql://warehouse_user:YourStrongPassword@127.0.0.1:5432/warehouse_db?schema=public"
DB_POOL_MAX=10

# ==============================================================================
# AUTHENTICATION & SECURITY
# ==============================================================================
# Generate with: openssl rand -hex 32
JWT_SECRET=c8f8b89e7a9b0c2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e

# ==============================================================================
# EMAIL / SMTP CONFIGURATION (Hostinger SMTP)
# ==============================================================================
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=YourHostingerEmailPassword
SMTP_FROM="Warehouse Portal <noreply@yourdomain.com>"

# ==============================================================================
# FILE STORAGE (Cloudinary Cloud-Persistent Storage)
# ==============================================================================
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Local persistent storage path (used if Cloudinary is not configured)
# UPLOAD_DIR=/var/www/warehouse-data/uploads

# ==============================================================================
# INITIAL SEED (First-time setup only)
# ==============================================================================
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
DEFAULT_ADMIN_PASSWORD=YourStrongInitialAdminPassword123!
```

---

## 4. Database Setup (PostgreSQL)

If using PostgreSQL on a **Hostinger Ubuntu/Debian VPS**:

```bash
# 1. Install PostgreSQL
sudo apt update && sudo apt install -y postgresql postgresql-contrib

# 2. Switch to postgres user and create database & user
sudo -u postgres psql

# Run inside psql:
CREATE DATABASE warehouse_db;
CREATE USER warehouse_user WITH ENCRYPTED PASSWORD 'YourStrongPassword';
GRANT ALL PRIVILEGES ON DATABASE warehouse_db TO warehouse_user;
GRANT ALL ON SCHEMA public TO warehouse_user;
\q
```

---

## 5. Hostinger VPS Deployment (Recommended)

### Step 1: Install Node.js, PM2, and Nginx

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git

# Install PM2 globally
sudo npm install -g pm2
```

### Step 2: Clone Repository

```bash
# Navigate to web root
cd /var/www
sudo git clone https://github.com/your-username/warehouse-Inventory.git portal
sudo chown -R $USER:$USER /var/www/portal
cd /var/www/portal
```

### Step 3: Configure Environment Variables

```bash
cp .env.example .env
nano .env   # Enter your real production credentials
```

### Step 4: Install Dependencies & Build

```bash
# Install packages
npm install

# Generate Prisma client
npm run db:generate

# Sync schema with database (non-destructive)
npm run db:push

# Run seed script (creates initial admin if database is empty)
npm run db:seed

# Build Next.js application
npm run build
```

### Step 5: Start Application with PM2

```bash
# Start standalone Next.js server with PM2
pm2 start npm --name "warehouse-portal" -- start

# Save PM2 process list to persist across server reboots
pm2 save
pm2 startup
```

### Step 6: Configure Nginx Reverse Proxy with SSL

Create `/etc/nginx/sites-available/portal`:

```nginx
server {
    listen 80;
    server_name portal.yourdomain.com;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and configure SSL:

```bash
sudo ln -s /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install free Let's Encrypt SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d portal.yourdomain.com
```

---

## 6. Hostinger Cloud / Web Hosting (Node.js)

If using Hostinger's **hPanel Node.js Application**:

1. In hPanel, navigate to **Websites** > **Manage** > **Node.js**.
2. Set **Node.js version** to `20.x` or latest LTS.
3. Set **Application Root** to `/home/u123456789/domains/yourdomain.com/public_html`.
4. Set **Application startup file** to `node_modules/next/dist/bin/next` with argument `start` (or `server.js` if running standalone).
5. In **Environment Variables**, add all keys from `.env`.
6. Run build via SSH terminal:
   ```bash
   npm install
   npm run db:generate
   npm run db:push
   npm run build
   ```
7. Click **Restart** in the Node.js panel.

---

## 7. Safe Redeployment Workflow (Zero Data Loss)

Whenever you make code updates in the future, follow this safe procedure. **Existing database records and uploaded files will remain 100% intact.**

```bash
# 1. Navigate to application folder
cd /var/www/portal

# 2. Pull latest code updates from Git
git pull origin main

# 3. Install any new dependencies
npm install

# 4. Generate updated Prisma client
npm run db:generate

# 5. Safely apply non-destructive schema changes
npm run db:push

# 6. Build the updated production bundle
npm run build

# 7. Zero-downtime reload with PM2
pm2 reload warehouse-portal
```

> [!NOTE]
> `pm2 reload` performs a graceful reload with zero downtime so active warehouse operators will not experience interruptions.

---

## 8. Persistent Storage & Uploads Strategy

User uploads (inventory photos, profile pictures) are handled with two persistent layers:

1. **Cloudinary (Recommended)**:
   * When `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are present, all images are streamed directly to Cloudinary's global CDN.
   * CDN URLs are stored in the database.
   * Uploaded assets are completely independent of the server filesystem and **will never be lost on server reboots, git pulls, or migrations**.

2. **Local Persistent Storage Fallback**:
   * If Cloudinary is not configured, the system writes files to `public/uploads/` (or external `UPLOAD_DIR`).
   * `.gitignore` is configured to ignore `public/uploads/*` so `git pull` will **never overwrite or delete user files**.
   * If using multiple server instances, mount an external volume to `UPLOAD_DIR`.

---

## 9. Email & SMTP Configuration

The mail service (`lib/mail.ts`) automatically detects your configuration:

* **Hostinger Email (Recommended)**:
  * Host: `smtp.hostinger.com`
  * Port: `465` (SSL) or `587` (TLS)
  * User: `noreply@yourdomain.com`
  * Pass: Email account password created in Hostinger hPanel.

* **Gmail (Fallback)**:
  * User: `yourgmail@gmail.com`
  * Pass: 16-character Google App Password (generated in Google Account > Security > 2-Step Verification > App Passwords).

---

## 10. Database Migrations Strategy

* **Safe Schema Updates (`npm run db:push`)**:
  * Applies any new models, new columns, or indexes without dropping existing tables or deleting data.
* **Never use destructive commands**:
  * ❌ `prisma migrate reset` (DESTRUCTIVE - Drops all tables!)
  * ❌ `prisma db push --force-reset` (DESTRUCTIVE - Drops database!)
* **Production Rule**: Always use `npm run db:push` or `npm run db:migrate` for incremental updates.

---

## 11. Backup & Recovery Recommendations

### Automated Daily PostgreSQL Backups (Cron Job)

On your Hostinger VPS, setup an automated daily database backup:

```bash
# Open crontab
sudo crontab -e

# Add daily backup at 2:00 AM:
0 2 * * * pg_dump -U warehouse_user -h 127.0.0.1 warehouse_db > /var/backups/warehouse_db_$(date +\%Y\%m\%d).sql
```

### Database Restore Procedure (if ever needed):

```bash
psql -U warehouse_user -h 127.0.0.1 -d warehouse_db < /var/backups/warehouse_db_20260815.sql
```

---

## 12. Critical Rules: Directories That Must NEVER Be Deleted

When performing server maintenance or updates, **NEVER delete**:

| Directory / File | Reason |
| :--- | :--- |
| `.env` | Contains production database passwords, JWT secrets, and API credentials. |
| `/var/lib/postgresql/` | Contains the actual PostgreSQL database storage on disk. |
| `public/uploads/` (or `UPLOAD_DIR`) | Contains user/client uploaded files and images. |
| `prisma/schema.prisma` | Defines the database schema mapping. |

---

## 13. Troubleshooting

### 1. Database Connection Failed (`ECONNREFUSED` or authentication failed)
* Verify PostgreSQL is running: `sudo systemctl status postgresql`
* Verify credentials in `.env`: `DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/warehouse_db"`
* Test connection: `node test1.js`

### 2. Emails / OTPs Not Arriving
* Check Hostinger SMTP credentials in `.env`.
* If using port 465, ensure `SMTP_SECURE=true`.
* Check mail logs in PM2: `pm2 logs warehouse-portal`

### 3. Image Upload Fails
* If using Cloudinary: check cloud name, API key, and secret in `.env`.
* If using local storage: check permissions on `public/uploads`: `chmod -R 775 public/uploads`.
* If using Nginx: verify `client_max_body_size 25M;` is configured in `/etc/nginx/sites-available/portal`.

### 4. CORS Access Denied on API
* Verify `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` match your live domain (e.g. `https://portal.yourdomain.com`).
* Add your domain to `ALLOWED_ORIGINS` in `.env`.
