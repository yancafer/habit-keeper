"use client";

import { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const Signin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();

  const handleSignin = async () => {
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    if (!isValidEmail(email)) {
      setError('Por favor, insira um e-mail válido.');
      setLoading(false);
      return;
    }

    setTimeout(async () => {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          setError('Credenciais incorretas.');
          setPassword('');
          setAttempts((prev) => prev + 1);

          if (attempts >= 4) {
            setError('Muitas tentativas de login. Tente novamente mais tarde.');
            setLoading(false);
            return;
          }
        } else {
          router.push('/dashboard');
        }
      } catch {
        setError('Erro de rede. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div>
      <h1>Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button onClick={handleSignin} disabled={loading}>
        {loading ? 'Entrando...' : 'Sign In'}
      </button>
    </div>
  );
};

export default Signin;
