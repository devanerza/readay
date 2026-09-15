import { useState } from 'react';

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  const show = (msg: string) => setMessage(msg);
  const dismiss = () => setMessage(null);

  return { message, show, dismiss };
}
