// @ts-expect-error CSS imports are handled by the Next.js bundler.
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      {/* Tailwind’s `bg-gray-100` gives a light gray background, `p-4` adds padding */}
      <body className="bg-gray-100 p-4 text-gray-900">{children}</body>
    </html>
  );
}