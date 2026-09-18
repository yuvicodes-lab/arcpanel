import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata = {
  title: 'YUVI PANEL — Key Management',
  description: 'Modern control panel to generate, manage and monitor access keys, resellers and servers.',
};

export const viewport = {
  themeColor: '#f4f5f8',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
