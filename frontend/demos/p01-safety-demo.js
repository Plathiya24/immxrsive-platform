const choices = document.getElementById('scenario-choices');
const buttons = [...choices.querySelectorAll('button')];
const feedback = document.getElementById('scenario-feedback');
const next = document.getElementById('scenario-next');
const replay = document.getElementById('replay');
watchPreview(document.querySelector('.scenario-scene'), 'The warehouse illustration is unavailable.',
  '/demos/p01-safety-fallback.html', 'Read the scenario summary');

const outcomes = {
  continue: {
    title: 'The hazard is still unreported',
    explanation: 'Continuing leaves the hazard unreported and other people may still enter the route.'
  },
  stop: {
    title: 'Correct',
    explanation: 'You avoid the hazard and alert the person who can secure the route and arrange cleanup.'
  }
};

for (const button of buttons) {
  button.addEventListener('click', () => {
    const outcome = outcomes[button.dataset.answer];
    for (const choice of buttons) {
      choice.setAttribute('aria-pressed', String(choice === button));
    }
    const heading = document.createElement('strong');
    const detail = document.createElement('p');
    heading.textContent = outcome.title;
    detail.textContent = outcome.explanation;
    feedback.dataset.outcome = button.dataset.answer;
    feedback.replaceChildren(heading, detail);
    next.hidden = false;
  });
}

replay.addEventListener('click', () => {
  for (const choice of buttons) choice.setAttribute('aria-pressed', 'false');
  delete feedback.dataset.outcome;
  feedback.replaceChildren();
  next.hidden = true;
  buttons[0].focus();
});

choices.hidden = false;
