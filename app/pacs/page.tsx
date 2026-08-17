import { redirect } from 'next/navigation';

/** Pacs.MT landing — scanner-first. */
export default function PacsHomePage() {
  redirect('/pacs/scanner');
}
