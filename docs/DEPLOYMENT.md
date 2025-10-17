# Deployment Guide

## Automated CI/CD Pipeline

### GitHub Actions Workflow

The project uses GitHub Actions for automated testing and building:

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs**:

1. **Test Job** (runs on all branches):
   - Install dependencies
   - Run ESLint
   - Run Jest tests
   - Build extension

2. **Build Job** (runs only on `main`):
   - Creates production build
   - Uploads artifact for 30 days
   - Ready for Chrome Web Store submission

### Local Development

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Run tests
npm test

# Build extension
npm run build
```

### Manual Deployment to Chrome Web Store

**Note**: Chrome Web Store requires manual submission due to review process.

1. **Build the extension**:
   ```bash
   npm run build
   ```

2. **Create ZIP file**:
   ```bash
   zip -r chuckle-v1.0.0.zip manifest.json *.js *.html *.css icons/
   ```

3. **Upload to Chrome Web Store**:
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Click "Upload new item"
   - Upload the ZIP file
   - Fill in store listing details
   - Submit for review

4. **Download artifact from GitHub Actions** (alternative):
   - Go to Actions tab in GitHub
   - Select latest successful workflow run
   - Download `chuckle-extension` artifact
   - Use for Chrome Web Store submission

### Version Management

Update version in:
- `manifest.json`
- `package.json`

Follow semantic versioning: `MAJOR.MINOR.PATCH`

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Linter passes with no errors
- [ ] Code formatted with Prettier
- [ ] Version bumped in manifest.json and package.json
- [ ] CHANGELOG updated
- [ ] README updated if needed
- [ ] Icons present and correct
- [ ] API keys not hardcoded

### Continuous Integration

The CI pipeline ensures:
- ✅ Code quality (ESLint)
- ✅ Code formatting (Prettier)
- ✅ All tests pass
- ✅ Extension builds successfully
- ✅ Artifacts available for deployment

### Future Enhancements

Potential automation improvements:
- Automated version bumping
- Changelog generation
- Release notes creation
- Chrome Web Store API integration (when available)
