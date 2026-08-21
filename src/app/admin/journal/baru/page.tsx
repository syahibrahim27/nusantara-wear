import { JournalForm } from "@/components/admin/journal-form"

export default function NewJournalPage() {
  return (
    <section>
      <p className="eyebrow text-primary">Studio Console</p>
      <h1 className="display mt-3 text-6xl">Artikel baru</h1>
      <JournalForm />
    </section>
  )
}
