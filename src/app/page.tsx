"use client";

import { useRouter } from 'next/navigation';

const HomePage = () => {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h1>Bem-vindo ao TODO + Habit Tracker</h1>
      <p>Escolha uma opção para começar:</p>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <button onClick={() => router.push('/signin')} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Login
        </button>
        <button onClick={() => router.push('/signup')} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Cadastro
        </button>
      </div>
    </div>
  );
};

export default HomePage;
