import './globals.css';

export const metadata = {
  title: 'Car Identifier',
  description: 'Upload a car image to identify its make, model and specifications',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}