"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isStrongPassword = (password: string) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const SignupPage = () => {
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isValidEmail(email)) {
      setError('Por favor, insira um e-mail válido.');
      setLoading(false);
      return;
    }

    if (!isStrongPassword(password)) {
      setError('A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, um número e um símbolo.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            birth_date: birthDate.trim(),
          },
        },
      });

      if (error) throw error;

      const userId = data.user?.id;
      if (userId) {
        const { error: insertError } = await supabase.from('users').insert([
          {
            id: userId,
            full_name: fullName.trim(),
            birth_date: birthDate.trim(),
            email: email.trim(),
          },
        ]);

        if (insertError) throw insertError;

        alert('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar sua conta.');
        setFullName('');
        setBirthDate('');
        setEmail('');
        setPassword('');
        router.push('/signin');
      } else {
        setError('Erro inesperado: usuário não registrado.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(`Erro: ${err.message}`);
      } else {
        setError('Ocorreu um erro desconhecido.');
      }
    } finally {
      setLoading(false);
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
      <button type="submit" disabled={loading}>
        {loading ? 'Cadastrando...' : 'Cadastrar'}
      </button>
    </form>
  );
};

export default SignupPage;
