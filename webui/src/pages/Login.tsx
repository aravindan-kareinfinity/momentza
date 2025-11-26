
import React from 'react';
import { LoginForm } from '@/components/Auth/LoginForm';
import { AnimatedPage } from '@/components/Layout/AnimatedPage';

const Login = () => {
  return (
    <AnimatedPage className="min-h-screen flex items-center justify-center bg-background">
      <LoginForm />
    </AnimatedPage>
  );
};

export default Login;
