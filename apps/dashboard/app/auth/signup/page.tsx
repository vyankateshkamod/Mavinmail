import SignupForm from '@/app/components/SignupForm';

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  );
}