"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

const SignupPage = () => {
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isStrongPassword = (password: string) => {
    // Requer ao menos 8 caracteres, incluindo letra maiúscula, número e símbolo
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }

    if (!isStrongPassword(password)) {
      setError('A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, um número e um símbolo.');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          birth_date: birthDate,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      const userId = data.user?.id;
      if (userId) {
        const { error: insertError } = await supabase.from('users').insert([
          {
            id: userId,
            full_name: fullName.trim(),
            birth_date: birthDate,
            email: email.trim(),
          },
        ]);

        if (insertError) {
          setError(insertError.message);
        } else {
          alert('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar sua conta.');
          router.push('/signin');
        }
      }
    }
  };

  return (
    <form onSubmit={handleSignup}>
      <h2>Cadastro de Usuário</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="text"
        placeholder="Nome Completo"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <input
        type="date"
        placeholder="Data de Nascimento"
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
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
      <button type="submit">Cadastrar</button>
    </form>
  );
};

export default SignupPage;
