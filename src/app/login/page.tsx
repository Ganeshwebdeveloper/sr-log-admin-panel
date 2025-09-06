import { AuthForm } from '@/components/auth/auth-form';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 to-gray-800 p-4">
      <AuthForm />
    </div>
  );
}