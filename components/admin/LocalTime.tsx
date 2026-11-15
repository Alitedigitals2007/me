'use client';

import { useEffect, useState } from 'react';

export default function LocalTime({ value }: { value: string | null }) {
  const [text, setText] = useState('—');

  useEffect(() => {
    if (!value) {
      setText('—');
      return;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      setText('—');
      return;
    }
    setText(
      d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' ' +
        d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    );
  }, [value]);

  return <>{text}</>;
}
