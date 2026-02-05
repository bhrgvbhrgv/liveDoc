# LiveDoc Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- ✅ MongoDB Atlas account and cluster set up
- ✅ Liveblocks account with API key
- ✅ All environment variables configured
- ✅ Code tested locally

---

## Environment Variables

### Required Variables

Create a `.env` file in the `server/` directory with these variables:

```env
PORT=5000
MONGODB_URI=mongodb+srv://cookiezxxc2_db_user:cookiezxxc221th@cluster0.cok2pfp.mongodb.net/livedoc?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=c9722639747604a5147a117d9cffcbd2b994f0142aca0ff16123a0dd7dcbd47e8a16a63d8282cd4af93f5a96aded2e1985a4a00b09030d46e5af455587f06454
LIVEBLOCKS_SECRET_KEY=sk_dev_eV7tqQx_3jRpqtZcF7PaR_uCiuxwnrpscZJILGVqBdYP_H-A-9ZUGzFt3BspWDgd
NODE_ENV=production
```

> [!IMPORTANT]
> **Never commit the `.env` file to Git!** It's already in `.gitignore`.

---

## MongoDB Atlas Setup ✅

Your MongoDB Atlas is already configured:
- **Connection String**: `mongodb+srv://cookiezxxc2_db_user:...@cluster0.cok2pfp.mongodb.net/`
- **Database Name**: `livedoc`
- **Status**: Ready for deployment

### Verify MongoDB Atlas Connection

1. **Whitelist IP Addresses**:
   - Go to MongoDB Atlas → Network Access
   - Add `0.0.0.0/0` to allow all IPs (or specific deployment server IP)

2. **Test Connection**:
   ```bash
   cd server
   npm run dev
   ```
   Look for: `✅ MongoDB connected successfully`

---

## Deployment Options

### Option 1: Deploy to Render (Recommended)

**Backend Deployment:**

1. Go to https://render.com and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `livedoc-backend`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add all from `.env`

**Frontend Deployment:**

1. Click "New +" → "Static Site"
2. Configure:
   - **Name**: `livedoc-frontend`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Add environment variable:
   - `VITE_API_URL`: Your backend URL (e.g., `https://livedoc-backend.onrender.com`)

---

### Option 2: Deploy to Vercel

**Frontend Only (Vercel):**

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy frontend:
   ```bash
   cd client
   vercel
   ```

3. Set environment variable in Vercel dashboard:
   - `VITE_API_URL`: Your backend URL

**Backend (Use Render or Railway for Node.js)**

---

### Option 3: Deploy to Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Railway will auto-detect both services
5. Add environment variables for each service

---

## Pre-Deployment Checklist

- [ ] MongoDB Atlas connection tested
- [ ] All environment variables set
- [ ] `.gitignore` includes `.env` and `node_modules`
- [ ] Liveblocks API key is valid
- [ ] JWT secret is secure (not default)
- [ ] Code pushed to GitHub
- [ ] Frontend API URL points to backend

---

## Post-Deployment Steps

### 1. Update Frontend API URL

If deploying separately, update the frontend to point to your deployed backend:

**File**: `client/src/lib/api.js`
```javascript
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    // ...
});
```

### 2. Test the Deployment

1. Visit your deployed frontend URL
2. Register a new account
3. Create a document
4. Open in two tabs to test real-time collaboration
5. Verify all features work

### 3. Monitor Logs

Check deployment platform logs for any errors:
- Render: Dashboard → Logs
- Vercel: Dashboard → Deployments → Logs
- Railway: Dashboard → Deployments

---

## Production Optimizations

### Backend (`server/package.json`)

Add production start script:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### Frontend Build

The build command creates optimized production files:
```bash
cd client
npm run build
```

This creates a `dist/` folder with minified, optimized files.

---

## Security Recommendations

1. **Use HTTPS**: Ensure deployment platform uses SSL
2. **Rotate Secrets**: Change JWT secret for production
3. **IP Whitelist**: Restrict MongoDB Atlas access if possible
4. **Environment Variables**: Never hardcode secrets
5. **CORS**: Configure proper CORS origins in production

---

## Troubleshooting

### MongoDB Connection Issues
- Verify IP whitelist in MongoDB Atlas
- Check connection string format
- Ensure database name is included in URI

### Liveblocks Not Working
- Verify secret key is correct
- Check Liveblocks dashboard for usage limits
- Ensure frontend and backend are on same domain or CORS is configured

### 500 Errors
- Check backend logs
- Verify all environment variables are set
- Test MongoDB connection

---

## Support

If you encounter issues:
1. Check deployment platform logs
2. Verify environment variables
3. Test MongoDB Atlas connection
4. Review Liveblocks dashboard

---

**Your app is ready for deployment! 🚀**
