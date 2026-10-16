import './globals.css';

export const viewport = {
  themeColor: '#00321f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  title: 'AcadPK - Premier Academy Management System',
  description: 'The standard institutional management portal for Pakistani tuition academies, schools, and coaching centers. Manage fees, attendance, student records, and automated challans.',
  keywords: [
    'AcadPK',
    'Academy Management System Pakistan',
    'Tuition Portal Pakistan',
    'School Management Software',
    'Fee Challan Generator',
    'Education Portal',
  ],
  authors: [{ name: 'AcadPK Systems' }],
  creator: 'AcadPK Engineering',
  publisher: 'AcadPK Systems',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'AcadPK - Premier Academy Management System',
    description: 'Empowering Pakistan’s Education, One Academy at a Time. Streamline fee management, student records, and daily operations.',
    url: 'https://acadpk.com',
    siteName: 'AcadPK',
    locale: 'en_PK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AcadPK - Premier Academy Management System',
    description: 'Empowering Pakistan’s Education, One Academy at a Time.',
    creator: '@acadpk',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preconnect to external font providers */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Google Fonts: Inter & Plus Jakarta Sans */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
          rel="stylesheet"
        />

        {/* Google Material Symbols Outlined Icon Font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background font-sans antialiased min-h-screen flex flex-col selection:bg-secondary-container selection:text-on-secondary-container">
        {children}
      </body>
    </html>
  );
}