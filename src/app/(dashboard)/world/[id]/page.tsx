import { redirect } from 'next/navigation'

export default async function WorldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/world/${id}/sources`)
}
