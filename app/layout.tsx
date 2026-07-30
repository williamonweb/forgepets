import './globals.css';
export const metadata = { title: 'ForgePets', description: 'Gestão profissional para pet shops', icons: { icon: '/favicon.ico', shortcut: '/favicon.ico' } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="pt-BR"><body>{children}</body></html>; }
