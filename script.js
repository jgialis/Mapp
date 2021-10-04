'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEventParameter;
  constructor() {
    //No input required so no parameters.
    this.workouts = [];
    this._getLocalStorage();
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener('click', this._moveMarker.bind(this));
  }
  _locatedSuccess(position) {
    const { latitude, longitude } = position.coords;
    const p = [latitude, longitude];
    this._loadMap(p);
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._locatedSuccess.bind(this),
        function () {
          alert(`Couldn't locate your position!`);
        }
      );
    }
  }
  _loadMap(p) {
    this.#map = L.map('map').setView(p, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.workouts.forEach(workout => {
      this._renderWorkOutMarker(workout);
    });
    this.#map.on('click', this._showForm.bind(this));
  }
  _showForm(event) {
    this.#mapEventParameter = event;
    const { lat, lng } = this.#mapEventParameter.latlng;
    const coordsClicked = [lat, lng];
    L.marker(coordsClicked, { opacity: 0.5 }).addTo(this.#map).bindPopup();

    form.classList.remove('hidden');
  }
  _toggleElevationField(e) {
    e.preventDefault();
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _isFormValid() {
    // Get Data from form
    const duration = inputDuration.value;
    const distance = inputDistance.value;
    const gain = inputElevation.value;
    const cadence = inputCadence.value;
    return (
      (Number(distance) > 0 && Number(duration) > 0 && Number(cadence) > 0) ||
      (Number(distance) > 0 && Number(duration) > 0 && Number(gain) > 0)
    );
  }
  _newWorkout(e) {
    e.preventDefault();
    const { lat, lng } = this.#mapEventParameter.latlng;
    const coordsClicked = [lat, lng];
    let workOut;
    // Check if data is valid
    if (!this._isFormValid())
      return alert('ERROR!  Please enter positive numbers');

    if (inputType.value === 'running') {
      workOut = new Running(
        coordsClicked,
        inputDistance.value,
        inputDuration.value,
        inputCadence.value
      );
      this.workouts.push(workOut);
    } else {
      workOut = new Cycling(
        coordsClicked,
        inputDistance.value,
        inputDuration.value,
        inputElevation.value
      );
      this.workouts.push(workOut);
    }
    //Render workout on map as marker and hide forms.
    this._renderWorkOutMarker(workOut);
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(function () {
      form.style.display = 'grid';
    }, 1000);

    //Render workout on list
    this._renderWorkOut(workOut);

    //Reset input fields
    this._resetInputs();

    //Set Local Storage
    this._setLocalStorage();
  }
  _renderWorkOutMarker(workOut) {
    L.marker(workOut.coords, { opacity: 1 })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          maxWidth: 250,
          minWidth: 100,
          className:
            workOut.type === 'cycling' ? 'cycling-popup' : 'running-popup',
        })
      )
      .setPopupContent(
        workOut.type === 'cycling'
          ? `🚴‍♂️ Cycling on ${String(workOut.date).slice(0, 10)}`
          : `🏃🏽‍♂️ Running on ${String(workOut.date).slice(0, 10)}`
      )
      .openPopup();
  }
  _renderWorkOut(workout) {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${String(workout.date).slice(0, 10)}</h2>
          <div class="workout__details">
            <span class="workout__icon">🏃‍♂️</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">178</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    } else {
      html += ` <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${Math.trunc(workout.speed)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${Math.trunc(workout.elevationGain)}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }
  _resetInputs() {
    inputCadence.value = '';
    inputDuration.value = '';
    inputDistance.value = '';
    inputElevation.value = '';
    inputDistance.blur();
    inputCadence.blur();
    inputDuration.blur();
    inputElevation.blur();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    // Guard close for empty data/no storage
    if (!data) return;

    // Restore our workouts array
    this.workouts = data;

    // Render each of the workouts on the list, and on the map
    this.workouts.forEach(workout => {
      this._renderWorkOut(workout);
    });
  }
  _moveMarker(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.workouts.find(el => el.id === workoutEl.dataset.id);

    this.#map.setView(workout.coords, 13, { animate: true, duration: 1 });
  }
}
class Workout {
  date = new Date();
  id = String(Date.now());
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  calcSpeed() {
    this.speed = 60 * (this.distance / this.duration);
    return this.speed;
  }
}

const app = new App();
