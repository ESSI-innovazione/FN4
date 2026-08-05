import type { Metadata } from 'next';
import LoginForm from './login-form';

export const metadata: Metadata = {
  title: 'Accedi — FAD Manager',
};

export default function LoginPage() {
  return <LoginForm />;
}
