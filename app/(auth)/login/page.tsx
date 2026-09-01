// app/(auth)/login/page.tsx
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="bg-verde-oscuro min-h-screen flex items-center justify-center bg-gray-50">
      <LoginForm />
    </main>
  );
}