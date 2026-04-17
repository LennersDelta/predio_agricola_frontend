'use client';

import { useParams } from 'next/navigation';

export default function EditPage() {
  const params = useParams();

  return (
    <div>
      <h1>Editar</h1>
      <pre>{JSON.stringify(params)}</pre>
    </div>
  );
}