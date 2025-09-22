# Ghost Static Site Generation & GitHub Pages Deployment

This guide shows you how to generate a static version of your Ghost blog and deploy it to GitHub Pages for free hosting.

## Overview

This setup allows you to:
- Write and manage content using Ghost's admin interface locally
- Generate a static version of your site
- Deploy automatically to GitHub Pages
- Host your blog for free with custom domain support

## Benefits of Static Deployment

- **Free Hosting**: GitHub Pages is completely free
- **Fast Performance**: Static files load incredibly fast
- **High Availability**: GitHub's CDN ensures global availability
- **Custom Domains**: Support for your own domain name
- **HTTPS**: Automatic SSL certificates
- **No Server Maintenance**: No need to manage AWS infrastructure

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your GitHub repository
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the settings

### 2. Configure Custom Domain (Optional)

If you want to use a custom domain:

1. In your repository, go to **Settings** → **Secrets and variables** → **Variables**
2. Click **New repository variable**
3. Name: `GITHUB_PAGES_DOMAIN`
4. Value: `yourdomain.com` (your actual domain)
5. Click **Add variable**

### 3. Configure DNS (For Custom Domain)

Point your domain to GitHub Pages:

**For apex domain (yourdomain.com):**
```
A    185.199.108.153
A    185.199.109.153
A    185.199.110.153
A    185.199.111.153
```

**For subdomain (blog.yourdomain.com):**
```
CNAME    yourusername.github.io
```

### 4. Local Development Workflow

1. **Start Ghost locally**:
   ```bash
   npm run dev
   ```

2. **Create content**:
   - Visit http://localhost:2368/ghost
   - Write posts, configure settings, upload images

3. **Test static export locally**:
   ```bash
   npm run export:local
   ```
   This will export your site to the `static-site/` directory

4. **Preview static site**:
   ```bash
   cd static-site
   python3 -m http.server 8000
   # Visit http://localhost:8000
   ```

### 5. Deployment Process

The deployment happens automatically:

1. **Push to main branch**: Triggers immediate deployment
2. **Daily schedule**: Automatically rebuilds at 2 AM UTC to catch any content changes
3. **Manual trigger**: You can manually trigger deployment from GitHub Actions

## File Structure

```
├── .github/workflows/
│   ├── static-deploy.yml    # GitHub Pages deployment
│   ├── deploy.yml          # AWS ECS deployment (optional)
│   └── terraform.yml       # Infrastructure deployment (optional)
├── static-site/            # Generated static files (git-ignored)
├── static-export.js        # Static export script
├── package.json           # Node.js dependencies
├── docker-compose.yml     # Local development
└── STATIC-DEPLOYMENT.md   # This guide
```

## Workflow Details

The GitHub Actions workflow:

1. **Starts Ghost** using Docker Compose
2. **Waits for Ghost** to be fully ready
3. **Exports static files** using wget
4. **Processes files** for GitHub Pages compatibility
5. **Deploys to GitHub Pages** automatically

## Content Management

### Adding New Posts

1. Start Ghost locally: `npm run dev`
2. Go to http://localhost:2368/ghost
3. Write your post
4. Publish when ready
5. Commit and push to trigger deployment

### Managing Images

- Upload images through Ghost admin
- Images are automatically included in static export
- Consider optimizing images for web before upload

### Theme Customization

- Ghost themes work with static export
- Modify themes in the Ghost admin or by editing theme files
- Changes are included in the next static export

## Limitations of Static Export

- **No Comments**: Consider using Disqus, Utterances, or similar
- **No Search**: Implement client-side search or use external services
- **No Contact Forms**: Use external form services like Formspree
- **No Dynamic Features**: RSS feeds and sitemaps are static snapshots

## Troubleshooting

### Build Fails

1. Check GitHub Actions logs
2. Ensure Ghost starts properly locally
3. Verify all content is accessible

### Missing Content

1. Ensure content is published (not draft)
2. Check if Ghost is fully loaded before export
3. Verify wget export includes all pages

### Custom Domain Issues

1. Verify DNS settings
2. Check CNAME file is created
3. Wait for DNS propagation (up to 24 hours)

## Performance Optimization

### Image Optimization

```bash
# Install imagemin for image optimization
npm install -g imagemin-cli imagemin-webp imagemin-mozjpeg imagemin-pngquant

# Optimize images after export
imagemin static-site/content/images/* --out-dir=static-site/content/images/ --plugin=mozjpeg --plugin=pngquant
```

### CDN Integration

Consider using:
- **Cloudflare**: Free CDN with additional optimizations
- **jsDelivr**: Free CDN for static assets
- **GitHub's CDN**: Already included with GitHub Pages

## Cost Comparison

| Solution | Monthly Cost | Pros | Cons |
|----------|-------------|------|------|
| **GitHub Pages** | £0 | Free, fast, reliable | Static only, limited features |
| **AWS ECS** | £44-72 | Full Ghost features | Costs money, requires maintenance |
| **Hybrid** | £0 | Best of both worlds | Requires local Ghost for editing |

## Hybrid Approach (Recommended)

For the best experience:

1. **Development**: Use local Ghost for content creation
2. **Staging**: Deploy to AWS ECS for testing (optional)
3. **Production**: Use GitHub Pages for public site

This gives you:
- Free hosting for your public site
- Full Ghost admin interface for content management
- Option to upgrade to dynamic hosting later

## Migration from Dynamic to Static

If you're currently using the AWS ECS deployment:

1. Export your content from the live Ghost instance
2. Import it into your local Ghost
3. Set up static deployment
4. Update DNS to point to GitHub Pages
5. Optionally shut down AWS resources

## Next Steps

1. Set up GitHub Pages in your repository
2. Configure custom domain (if desired)
3. Create your first post locally
4. Push to main branch to trigger deployment
5. Visit your new static site!

Your site will be available at:
- `https://yourusername.github.io/repository-name` (default)
- `https://yourdomain.com` (if custom domain configured)