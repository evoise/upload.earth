# upload.earth 🌍

> Professional image hosting service built with Next.js 14

[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.4-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb)](https://reactjs.org/)

A modern image hosting platform with drag & drop uploads, API access, password protection, and user management. Built with Next.js 14, TypeScript, MongoDB, and AWS S3.

## Features

- Drag & drop image upload with progress tracking
- Multiple image upload (up to 10 images)
- Custom file naming and password protection
- Retention policies (1h, 24h, 7d, 30d, or custom)
- User authentication with JWT
- RESTful API for programmatic uploads
- Dark mode and multi-language support (EN, FR, TR)
- QR code generation and bulk download
- Admin panel for user and image management
- Rate limiting and storage limits
- SEO optimized with structured data

## Prerequisites

- Node.js 18.x or later
- MongoDB (local or Atlas)
- AWS S3 bucket with IAM credentials

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/image-cloud.git
cd image-cloud
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/image-cloud
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_REGION=us-east-1
NEXT_PUBLIC_BASE_URL=http://localhost:3000
BASE_URL=http://localhost:3000
JWT_SECRET=jwt_key
JWT_EXPIRES_IN=7d
```

4. Run development server:
```bash
npm run dev
```

## API Usage

### Upload Image
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@/path/to/image.jpg" \
  -F "customFileName=my-image" \
  -F "retentionTime=86400" \
  -F "password=secure_password"
```

### Get Image
```bash
curl http://localhost:3000/api/image/my-image-abc123.jpg
```

### Get User Images
```bash
curl http://localhost:3000/api/user/images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Available Scripts

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm start      # Start production server
npm run lint   # Run linter
```

## Project Structure

```
app/              # Next.js App Router
├── api/          # API routes
├── image/        # Image viewing page
├── my-images/    # User dashboard
└── ...
components/       # React components
lib/              # Utilities (JWT, MongoDB, S3, etc.)
models/           # Mongoose models
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

The application can also be deployed to Netlify, Railway, AWS Amplify, or any platform supporting Next.js.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret key | Yes |
| `AWS_S3_BUCKET_NAME` | S3 bucket name | Yes |
| `AWS_REGION` | AWS region | Yes |
| `NEXT_PUBLIC_BASE_URL` | Public-facing URL | Yes |
| `BASE_URL` | Server-side URL | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRES_IN` | JWT expiration (default: 7d) | No |
| `MAX_BUCKET_SIZE_GB` | Global bucket size limit | No |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | Google Analytics ID | No |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

See [LICENSE](LICENSE) for more details.

## Support

For support, contact: p@evoise.dev

---

**Made with ❤️ by evoise**
