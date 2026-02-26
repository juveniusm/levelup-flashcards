// Thin wrapper — kept for backwards compatibility with existing import paths
import CardForm from "./CardForm";

export default function CreateCardForm({ deckId }: { deckId: string }) {
    return <CardForm deckId={deckId} mode="create" />;
}
