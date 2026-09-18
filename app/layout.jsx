import "./globals.css";
import ScrollToTop from '@/components/layout/ScrollToTop';

import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title:"DESIRE",
  description:"Luxury fashion brand"
};


export default function RootLayout({children}){

 return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ScrollToTop />
          

          {children}
        </AuthProvider>
      </body>
    </html>
  );
}