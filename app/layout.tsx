import type { Metadata } from "next";
import { Poppins, IBM_Plex_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-poppins",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "https://upload.earth";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "upload.earth 🌍 - Professional Image Hosting Service",
    template: "%s | upload.earth 🌍"
  },
  description: "Professional image hosting service. Upload your images instantly, get shareable links in seconds. No registration required, no quality loss, unlimited bandwidth. Free image hosting with API access.",
  keywords: [
    "image hosting",
    "free image upload",
    "image upload service",
    "image sharing",
    "image hosting free",
    "image upload api",
    "image storage",
    "image hosting service",
    "upload images",
    "share images",
    "image links",
    "image url",
    "image hosting without registration",
    "fast image upload",
    "image hosting api",
    "image uploader",
    "image hosting platform",
    "image storage service",
    "image sharing platform",
    "image hosting Germany"
  ],
  authors: [{ name: "upload.earth" }],
  creator: "upload.earth",
  publisher: "upload.earth",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["fr_FR", "tr_TR"],
    url: baseUrl,
    siteName: "upload.earth",
    title: "upload.earth 🌍 - Professional Image Hosting Service",
    description: "Professional image hosting service. Upload your images instantly, get shareable links in seconds. No registration required, no quality loss, unlimited bandwidth.",
    images: [
      {
        url: `${baseUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "upload.earth - Professional Image Hosting",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "upload.earth 🌍 - Professional Image Hosting Service",
    description: "Professional image hosting service. Upload your images instantly, get shareable links in seconds.",
    images: [`${baseUrl}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      "en": `${baseUrl}`,
      "fr": `${baseUrl}`,
      "tr": `${baseUrl}`,
    },
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = document.cookie.split('; ').find(row => row.startsWith('theme='))?.split('=')[1];
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${poppins.variable} ${ibmPlexMono.variable} font-sans antialiased font-light`}>
        {children}
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
        )}
      </body>
    </html>
  );
}

