import { setup, assign } from 'xstate';

export interface Card {
    id: string;
    front: string;
    back: string;
}

export interface StudyContext {
    cards: Card[];
    currentIndex: number;
    lives: number;
    score: number;
    correctAnswers: number;
    incorrectAnswers: number;
    gameStatus: 'playing' | 'game_over' | 'completed' | 'session_over';
}

type StudyEvent =
    | { type: 'SUBMIT_ANSWER', isCorrect: boolean, isPerfect: boolean }
    | { type: 'NEXT_CARD' }
    | { type: 'RESTART' }
    | { type: 'QUIT' };

export const classicModeMachine = setup({
    types: {
        context: {} as StudyContext,
        events: {} as StudyEvent,
    },
    actions: {
        handleCorrectAnswer: assign({
            score: ({ context, event }) => {
                if (event.type !== 'SUBMIT_ANSWER') return context.score;
                return context.score + (event.isPerfect ? 10 : 5);
            },
            correctAnswers: ({ context }) => context.correctAnswers + 1
        }),
        handleIncorrectAnswer: assign({
            lives: ({ context }) => Math.max(0, context.lives - 1),
            incorrectAnswers: ({ context }) => context.incorrectAnswers + 1
        }),
        incrementIndex: assign({
            currentIndex: ({ context }) => context.currentIndex + 1
        }),
        resetGame: assign({
            currentIndex: 0,
            lives: 5,
            score: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            gameStatus: 'playing' as const
        })
    },
    guards: {
        hasMoreCards: ({ context }) => context.currentIndex < context.cards.length - 1,
        hasLives: ({ context }) => context.lives > 0,
        isCorrect: ({ event }) => event.type === 'SUBMIT_ANSWER' && event.isCorrect
    }
}).createMachine({
    id: 'classicMode',
    initial: 'question',
    context: {
        cards: [],
        currentIndex: 0,
        lives: 5,
        score: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        gameStatus: 'playing'
    },
    states: {
        question: {
            on: {
                SUBMIT_ANSWER: [
                    {
                        guard: 'isCorrect',
                        target: 'feedback_correct',
                        actions: ['handleCorrectAnswer']
                    },
                    {
                        guard: ({ context }) => context.lives <= 1,
                        target: 'game_over',
                        actions: ['handleIncorrectAnswer']
                    },
                    {
                        target: 'feedback_incorrect',
                        actions: ['handleIncorrectAnswer']
                    }
                ],
                QUIT: {
                    target: 'session_over'
                }
            }
        },
        feedback_correct: {
            on: {
                NEXT_CARD: [
                    {
                        guard: 'hasMoreCards',
                        target: 'question',
                        actions: ['incrementIndex']
                    },
                    {
                        target: 'completed'
                    }
                ],
                QUIT: {
                    target: 'session_over'
                }
            }
        },
        feedback_incorrect: {
            on: {
                NEXT_CARD: [
                    {
                        guard: ({ context }) => context.lives > 0 && context.currentIndex < context.cards.length - 1,
                        target: 'question',
                        actions: ['incrementIndex']
                    },
                    {
                        guard: ({ context }) => context.lives > 0,
                        target: 'completed'
                    },
                    {
                        target: 'game_over'
                    }
                ],
                QUIT: {
                    target: 'session_over'
                }
            }
        },
        completed: {
            entry: assign({ gameStatus: 'completed' }),
            on: {
                RESTART: {
                    target: 'question',
                    actions: ['resetGame']
                }
            }
        },
        game_over: {
            entry: assign({ gameStatus: 'game_over' }),
            on: {
                RESTART: {
                    target: 'question',
                    actions: ['resetGame']
                }
            }
        },
        session_over: {
            entry: assign({ gameStatus: 'session_over' }),
            on: {
                RESTART: {
                    target: 'question',
                    actions: ['resetGame']
                }
            }
        }
    }
});
