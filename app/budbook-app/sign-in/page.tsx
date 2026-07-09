import { Suspense } from 'react';
import SignInForm from './SignInForm';
import './sign-in.css';

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="sign-in-page" />}>
      <SignInForm />
    </Suspense>
  );
}
