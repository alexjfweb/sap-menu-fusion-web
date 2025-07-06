
import React from 'react';
import AuthForm from '@/components/AuthForm';
import AuthNavbar from '@/components/AuthNavbar';

const Auth = () => {
  return (
    <div className="min-h-screen bg-background">
      <AuthNavbar />
      <div className="container mx-auto px-4 py-8">
        <AuthForm />
      </div>
    </div>
  );
};

export default Auth;
