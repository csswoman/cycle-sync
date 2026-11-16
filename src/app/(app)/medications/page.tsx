import { redirect } from 'next/navigation';

/** Medication now lives in the Daily Log (medication tab). Kept so old links and notifications still work. */
export default function MedicationsPage() {
  redirect('/log?tab=meds');
}
