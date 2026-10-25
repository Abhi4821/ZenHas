import { LocationAPI } from './api.js';

export async function loadCountries(selectEl) {
    const res = await LocationAPI.countries();
    const list = res.data || res; // dono handle
    selectEl.innerHTML = '<option value="">Select Country</option>';
    list.forEach(c => {
        const o = document.createElement('option');
        o.value = c.id; o.textContent = c.name; selectEl.appendChild(o);
    });
}
export async function loadStates(countryId, selectEl) {
    selectEl.innerHTML = '<option>Loading...</option>'; selectEl.disabled = true;
    const res = await LocationAPI.states(countryId);
    const list = res.data || res;
    selectEl.innerHTML = '<option value="">Select State</option>';
    list.forEach(s => {
        const o = document.createElement('option'); o.value = s.id; o.textContent = s.name; selectEl.appendChild(o);
    });
    selectEl.disabled = false;
}
export async function loadCities(stateId, selectEl) {
    selectEl.innerHTML = '<option>Loading...</option>'; selectEl.disabled = true;
    const res = await LocationAPI.cities(stateId);
    const list = res.data || res;
    selectEl.innerHTML = '<option value="">Select City</option>';
    list.forEach(c => {
        const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; selectEl.appendChild(o);
    });
    selectEl.disabled = false;
}