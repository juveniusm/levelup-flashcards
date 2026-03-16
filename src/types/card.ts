export interface Card {
    id: string;
    deck_id: string;
    front: string;
    back: string;
    front_image_url?: string | null;
    back_image_url?: string | null;
    ease_factor?: number;
    interval?: number;
    card_seq?: number | null;
}
