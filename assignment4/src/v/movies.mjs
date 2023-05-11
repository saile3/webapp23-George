/**
 * @fileOverview  View code of UI for managing Movie data
 * @person Gerd Wagner, Elias George
 */
/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import Person from "../m/Person.mjs";
import Movie from "../m/Movie.mjs";
import { fillSelectWithOptions, createListFromMap, createMultiSelectionWidget }
  from "../../lib/util.mjs";

/***************************************************************
 Load data
 ***************************************************************/
Person.retrieveAll();
Movie.retrieveAll();

/***************************************************************
 Set up general, use-case-independent UI elements
 ***************************************************************/
// set up back-to-menu buttons for all CRUD UIs
for (const btn of document.querySelectorAll("button.back-to-menu")) {
  btn.addEventListener("click", refreshManageDataUI);
}
// neutralize the submit event for all CRUD UIs
for (const frm of document.querySelectorAll("section > form")) {
  frm.addEventListener("submit", function (e) {
    e.preventDefault();
    frm.reset();
  });
}
// save data when leaving the page
window.addEventListener("beforeunload", Movie.saveAll);

/**********************************************
 Use case Retrieve/List All Movies
 **********************************************/
document.getElementById("RetrieveAndListAll")
  .addEventListener("click", function () {
    document.getElementById("Movie-M").style.display = "none";
    document.getElementById("Movie-R").style.display = "block";
    const tableBodyEl = document.querySelector("section#Movie-R>table>tbody");
    tableBodyEl.innerHTML = "";  // drop old content
    for (const key of Object.keys(Movie.instances)) {
      const movie = Movie.instances[key];
      // create list of persons for this movie
      const authListEl = createListFromMap(movie.actors, "name");
      const row = tableBodyEl.insertRow();
      row.insertCell().textContent = movie.movieId;
      row.insertCell().textContent = movie.title;
      row.insertCell().textContent = movie.releaseDate;
      //the movie director, show its name
      row.insertCell().textContent =
        movie.director ? movie.director.name : "";
      row.insertCell().appendChild(authListEl);
    }
  });

/**********************************************
  Use case Create Movie
 **********************************************/
const createFormEl = document.querySelector("section#Movie-C > form"),
  selectActorsEl = createFormEl["selectActors"],
  selectDirectorEl = createFormEl["selectDirector"],
  selectReleaseDate = createFormEl["releaseDate"];
document.getElementById("Create").addEventListener("click", function () {
  // set up a single selection list for selecting a Director
  fillSelectWithOptions(selectDirectorEl, Person.instances, "name");
  // set up a multiple selection list for selecting Actors
  fillSelectWithOptions(selectActorsEl, Person.instances,
    "personId", { displayProp: "name" });
  document.getElementById("Movie-M").style.display = "none";
  document.getElementById("Movie-C").style.display = "block";
  createFormEl.reset();
});
// set up event handlers for responsive constraint validation
createFormEl.movieId.addEventListener("input", function () {
  createFormEl.movieId.setCustomValidity(
    Movie.checkMovieIdAsId(createFormEl["movieId"].value).message);
});

createFormEl.title.addEventListener("input", function () {
  createFormEl.title.setCustomValidity(
    Movie.checkTitle(createFormEl["title"].value).message);
});

selectReleaseDate.addEventListener("input", function () {
  selectReleaseDate.setCustomValidity(
    Movie.checkReleaseDate(createFormEl["releaseDate"].value).message);
});

selectDirectorEl.addEventListener("click", function () {
  selectDirectorEl.setCustomValidity(
    Movie.checkDirector(createFormEl["selectDirector"].selectedIndex).message);
});

selectActorsEl.addEventListener("click", function () {
  selectActorsEl.setCustomValidity(
    createFormEl.selectActors.selectedOptions.length > 0 ? "" : "No actor selected!");
});

/* SIMPLIFIED/MISSING CODE: add event listeners for responsive
   validation on user input with Movie.checkTitle and checkYear */

// handle Save button click events
createFormEl["commit"].addEventListener("click", function () {
  const slots = {
    movieId: createFormEl["movieId"].value,
    title: createFormEl["title"].value,
    releaseDate: createFormEl["releaseDate"].value,
    actors: [],
    director: createFormEl["selectDirector"].selectedIndex
  };
  // check all input fields and show error messages
  createFormEl.movieId.setCustomValidity(
    Movie.checkMovieIdAsId(slots.movieId).message);

  createFormEl.title.setCustomValidity(
    Movie.checkTitle(slots.title).message);

  createFormEl.selectDirector.setCustomValidity(
    Movie.checkDirector(slots.director).message);

  /* SIMPLIFIED CODE: no before-submit validation of name */
  // get the list of selected persons
  const selAuthOptions = createFormEl.selectActors.selectedOptions;
  // check the mandatory value constraint for persons
  createFormEl.selectActors.setCustomValidity(
    selAuthOptions.length > 0 ? "" : "No person selected!"
  );
  // save the input data only if all form fields are valid
  if (createFormEl.checkValidity()) {
    // construct a list of person ID references
    for (const opt of selAuthOptions) {
      slots.actors.push(opt.value);
    }
    Movie.add(slots);
  }
});

/**********************************************
 * Use case Update Movie
**********************************************/
const updateFormEl = document.querySelector("section#Movie-U > form"),
  updateDirectorEl = updateFormEl["selectDirector"],
  updateReleaseDate = updateFormEl["releaseDate"],
  updSelMovieEl = updateFormEl["selectMovie"];


document.getElementById("Update").addEventListener("click", function () {
  // reset selection list (drop its previous contents)
  updSelMovieEl.innerHTML = "";
  // populate the selection list
  fillSelectWithOptions(updSelMovieEl, Movie.instances,
    "movieId", { displayProp: "title" });
  document.getElementById("Movie-M").style.display = "none";
  document.getElementById("Movie-U").style.display = "block";
  updateFormEl.reset();
});

/**
 * handle movie selection events: when a movie is selected,
 * populate the form with the data of the selected movie
 */
updSelMovieEl.addEventListener("change", function () {
  const saveButton = updateFormEl["commit"],
    selectPersonsWidget = updateFormEl.querySelector(".MultiSelectionWidget"),
    selectDirectorEl = updateFormEl["selectDirector"],
    movieId = updateFormEl["selectMovie"].value;
  if (movieId) {
    const movie = Movie.instances[movieId];
    updateFormEl["movieId"].value = movie.movieId;
    updateFormEl["title"].value = movie.title;
    updateFormEl["releaseDate"].value = movie.releaseDate;
    // set up the associated director selection list
    fillSelectWithOptions(selectDirectorEl, Person.instances, "name");
    // set up the associated actor selection widget
    createMultiSelectionWidget(selectPersonsWidget, movie.actors,
      Person.instances, "personId", "name", 1);  // minCard=1
    // assign associated director as the selected option to select element
    if (movie.director) updateFormEl["selectDirector"].value = movie.director.name;
    saveButton.disabled = false;
  } else {
    updateFormEl.reset();
    updateFormEl["selectDirector"].selectedIndex = 0;
    selectPersonsWidget.innerHTML = "";
    saveButton.disabled = true;
  }
  //setup event listener for updates
  updateFormEl.title.addEventListener("input", function () {
    updateFormEl.title.setCustomValidity(
      Movie.checkTitle(updateFormEl["title"].value).message);
  });

  updateReleaseDate.addEventListener("input", function () {
    updateReleaseDate.setCustomValidity(
      Movie.checkReleaseDate(updateFormEl["releaseDate"].value).message);
  });

  updateDirectorEl.addEventListener("click", function () {
    updateDirectorEl.setCustomValidity(
      Movie.checkDirector(updateFormEl["selectDirector"].selectedIndex).message);
  });

});
// handle Save button click events
updateFormEl["commit"].addEventListener("click", function () {
  const movieIdRef = updSelMovieEl.value,
    selectPersonsWidget = updateFormEl.querySelector(".MultiSelectionWidget"),
    selectedPersonsListEl = selectPersonsWidget.firstElementChild;
  if (!movieIdRef) return;
  const slots = {
    movieId: updateFormEl["movieId"].value,
    title: updateFormEl["title"].value,
    releaseDate: updateFormEl["releaseDate"].value,
    director_id: updateFormEl["selectDirector"].selectedIndex
  };
  // add event listeners for responsive validation
  /* MISSING CODE */
  // commit the update only if all form field values are valid
  if (updateFormEl.checkValidity()) {
    // construct personIdRefs-ToAdd/ToRemove lists
    const personIdRefsToAdd = [], personIdRefsToRemove = [];
    for (const personItemEl of selectedPersonsListEl.children) {
      if (personItemEl.classList.contains("removed")) {
        personIdRefsToRemove.push(personItemEl.getAttribute("data-value"));
      }
      if (personItemEl.classList.contains("added")) {
        personIdRefsToAdd.push(personItemEl.getAttribute("data-value"));
      }
    }
    // if the add/remove list is non-empty, create a corresponding slot
    if (personIdRefsToRemove.length > 0) {
      slots.personIdRefsToRemove = personIdRefsToRemove;
    }
    if (personIdRefsToAdd.length > 0) {
      slots.personIdRefsToAdd = personIdRefsToAdd;
    }
    Movie.update(slots);
    // update the movie selection list's option element
    updSelMovieEl.options[updSelMovieEl.selectedIndex].text = slots.title;
    // drop widget content
    selectPersonsWidget.innerHTML = "";
  }
});

/**********************************************
 * Use case Delete Movie
**********************************************/
const deleteFormEl = document.querySelector("section#Movie-D > form");
const delSelMovieEl = deleteFormEl["selectMovie"];
document.getElementById("Delete").addEventListener("click", function () {
  // reset selection list (drop its previous contents)
  delSelMovieEl.innerHTML = "";
  // populate the selection list
  fillSelectWithOptions(delSelMovieEl, Movie.instances,
    "movieId", { displayProp: "title" });
  document.getElementById("Movie-M").style.display = "none";
  document.getElementById("Movie-D").style.display = "block";
  deleteFormEl.reset();
});
// handle Delete button click events
deleteFormEl["commit"].addEventListener("click", function () {
  const movieIdRef = delSelMovieEl.value;
  if (!movieIdRef) return;
  if (confirm("Do you really want to delete this movie?")) {
    Movie.destroy(movieIdRef);
    // remove deleted movie from select options
    delSelMovieEl.remove(delSelMovieEl.selectedIndex);
  }
});

/**********************************************
 * Refresh the Manage Movies Data UI
 **********************************************/
function refreshManageDataUI() {
  // show the manage movie UI and hide the other UIs
  document.getElementById("Movie-M").style.display = "block";
  document.getElementById("Movie-R").style.display = "none";
  document.getElementById("Movie-C").style.display = "none";
  document.getElementById("Movie-U").style.display = "none";
  document.getElementById("Movie-D").style.display = "none";
}

// Set up Manage Movie UI
refreshManageDataUI();
