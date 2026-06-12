import './style.css';
import { mountThemeToggle } from './theme.js';
import { mountGate } from './screens/gate.js';
import { mountIntro } from './screens/intro.js';
import { mountRiddle } from './screens/riddle.js';
import { mountJourney } from './screens/journey.js';

const app = document.querySelector('#app');

// Build the screen containers up front.
app.innerHTML = `
  <section class="screen" id="gate"></section>
  <section class="screen" id="intro"></section>
  <section class="screen" id="riddle"></section>
  <section class="screen" id="journey"></section>
`;

const screens = {
  gate: document.querySelector('#gate'),
  intro: document.querySelector('#intro'),
  riddle: document.querySelector('#riddle'),
  journey: document.querySelector('#journey'),
};

let current = null;
function show(name) {
  Object.entries(screens).forEach(([key, el]) => {
    if (key === name) {
      el.classList.add('active');
      el.classList.remove('gone');
    } else {
      el.classList.remove('active');
      el.classList.add('gone');
    }
  });
  current = name;
}

// --- wire the flow: gate -> intro -> riddle -> journey ---
const introApi = mountIntro(screens.intro, () => show('riddle'));
mountGate(screens.gate, () => {
  show('intro');
  introApi.start();
});
mountRiddle(screens.riddle, () => {
  show('journey');
  startJourney();
});

let journeyStarted = false;
let journeyApi = null;
function startJourney() {
  if (journeyStarted) return;
  journeyStarted = true;
  journeyApi = mountJourney(screens.journey);
  journeyApi.start();
}

show('gate');
mountThemeToggle();

// Keep the 3D canvas honest on orientation / resize changes.
window.addEventListener('resize', () => journeyApi?.resize());
