import './globals.css'

export const metadata = {
  title: 'FRY BYOD License',
  description: 'Purchase your FRY BYOD License here!',
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        {children}
      </body>
    </html>

  )
}
