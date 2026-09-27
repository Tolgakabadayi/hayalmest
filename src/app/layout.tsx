import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import MainLayout from '@/components/MainLayout';

export const metadata: Metadata = {
  title: 'HayalMest Anadolu Meyhanesi | Bostancı Canlı Fasıl & Rezervasyon',
  description: 'HayalMest Anadolu Meyhanesi Kadıköy Bostancı’da. Her kadehte bir anı, her masada bir dostluk. Canlı fasıl, zengin Türk mezeleri, kebap çeşitleri ve özel kutlamalarınız için masanızı hemen ayırtın.',
  keywords: 'hayalmest, bostancı meyhane, kadıköy meyhane, canlı fasıl istanbul, anadolu meyhanesi, meyhane rezervasyon, fasıl gecesi',
  openGraph: {
    title: 'HayalMest Anadolu Meyhanesi - Bostancı',
    description: 'Her kadehte bir anı, her masada bir dostluk. Lezzete kadeh kaldır.',
    url: 'https://hayalmest.com',
    siteName: 'HayalMest Anadolu Meyhanesi',
    images: [
      {
        url: '/assets/Hayalmest-sahne.jpg',
        width: 1200,
        height: 630,
        alt: 'HayalMest Sahne ve Meyhane',
      },
    ],
    locale: 'tr_TR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,400;1,600&display=swap" rel="stylesheet" />
        <link rel="icon" href="/assets/favicon-300x300.png" type="image/png" />
      </head>
      <body className="min-h-screen flex flex-col bg-meyhane-bg text-gray-100 antialiased selection:bg-gold selection:text-black">
        <Navbar />
        <MainLayout>
          {children}
        </MainLayout>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
