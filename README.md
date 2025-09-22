# Ghost Blog with Static Site Generation

A Ghost blog setup with static site generation for free hosting on GitHub Pages.

## Overview

This repository provides a complete Ghost blog solution that combines:
- **Local Ghost development** for content creation and management
- **Static site generation** using wget to create deployable files
- **GitHub Pages hosting** for free, fast, and reliable hosting

## Features

### Local Development
- Docker Compose setup for easy local Ghost development
- Ghost admin interface at http://localhost:2368/ghost
- Automatic database setup and configuration
- Full Ghost features for content creation

### Static Site Generation
- Automated export of Ghost content to static HTML
- GitHub Actions workflow for automatic deployment
- Support for custom domains with HTTPS
- Fast, CDN-powered hosting via GitHub Pages

### Benefits
- **Free hosting** on GitHub Pages
- **Lightning fast** static site performance
- **Custom domain** support with automatic HTTPS
- **No server maintenance** required
- **Global CDN** for worldwide performance

## Quick Start

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd ghost-blog
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Ghost locally**:
   ```bash
   npm run dev
   ```

4. **Access Ghost**:
   - Blog: http://localhost:2368
   - Admin: http://localhost:2368/ghost

5. **Create your admin account** and start writing!

### Static Site Deployment

1. **Enable GitHub Pages** in repository settings
2. **Create content** using local Ghost admin
3. **Push to main branch** - automatic deployment!
4. **Visit your site** at `https://yourusername.github.io/repository-name`

## Development Commands

```bash
# Start Ghost locally
npm run dev

# View logs
docker-compose logs -f ghost

# Stop services
npm run stop

# Reset database (removes all data)
npm run reset
```

### Database Access

MySQL is accessible on `localhost:3306` with:
- Username: `root`
- Password: `ghostpassword`
- Database: `ghost`

See [STATIC-DEPLOYMENT.md](STATIC-DEPLOYMENT.md) for complete static site setup instructions.