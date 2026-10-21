// @ts-ignore CSS is loaded by the framework bundler; it has no TypeScript module declaration.
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-black text-gray-100 min-h-screen antialiased" data-theme="dark">
        {children}
      </body>
    </html>
  );
}
