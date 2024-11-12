import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'TODO + Habit Tracker',
  description: 'Organize suas tarefas e hábitos facilmente.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
