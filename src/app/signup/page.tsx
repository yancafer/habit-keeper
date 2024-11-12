"use client";

import { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      alert(`Erro ao criar conta: ${error.message}`);
      return;
    }

    const user = data?.user;

    if (user) {
      const { error: insertError } = await supabase.from('users').insert([
        {
          id: user.id,
          email: user.email,
          full_name: fullName,
          subscription_level: 'free',
        },
      ]);

      if (insertError) {
        alert('Erro ao salvar na tabela Users: ' + insertError.message);
        return;
      }

      alert('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar o cadastro.');
      router.push('/signin');
    }
  };

  return (
    <div>
      <h1>Signup</h1>
      <input
        type="text"
        placeholder="Nome completo"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button onClick={handleSignup}>Sign Up</button>
    </div>
  );
};

export default Signup;
