import { redirect } from 'next/navigation'

export default function WorldPage({ params }: { params: { id: string } }) {
  redirect(`/world/${params.id}/beats`)
}
