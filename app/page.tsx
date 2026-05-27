import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/budbook-app/?mock=1');
}
