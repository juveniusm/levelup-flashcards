// Thin wrapper — kept for backwards compatibility with existing import paths
import CardForm, { type ExistingCard } from "./CardForm";

interface EditCardFormProps {
    deckId: string;
    card: ExistingCard;
}

export default function EditCardForm({ deckId, card }: EditCardFormProps) {
    return <CardForm deckId={deckId} mode="edit" existingCard={card} />;
}
