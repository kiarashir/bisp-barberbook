# Oʻzbekcha

A single-file Uzbek learning app: the Latin alphabet with sound guides and
Cyrillic equivalents, eleven lessons (greetings through to a lesson set in a
barbershop), flashcards with a five-box spaced repetition scheme, and
ten-question quizzes that mix vocabulary with grammar.

It is plain HTML, CSS and JavaScript with no build step. Open `index.html`
in a browser. Progress (name, flashcard boxes, quiz scores, lessons read)
is kept in the browser's localStorage.

The listen buttons appear only when the browser has an Uzbek text-to-speech
voice installed (Microsoft Edge ships one; Chrome on Android can use the
system Uzbek voice).
