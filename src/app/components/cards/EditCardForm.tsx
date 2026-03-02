// Thin wrapper — kept for backwards compatibility with existing import paths
import CardForm from "./CardForm";
import { Card } from "@/types/card";

interface EditCardFormProps {
    deckId: string;
    card: Card;
}

export default function EditCardForm({ deckId, card }: EditCardFormProps) {
    return <CardForm deckId={deckId} mode="edit" existingCard={card} />;
}
