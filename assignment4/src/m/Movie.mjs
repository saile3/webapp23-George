/**
 * @fileOverview  The model class Movie with attribute definitions, (class-level)
 *                check methods, setter methods, and the special methods saveAll
 *                and retrieveAll
 * @person Gerd Wagner
 */
import Person from "./Person.mjs";
import { cloneObject } from "../../lib/util.mjs";
import {
  NoConstraintViolation, MandatoryValueConstraintViolation,
  RangeConstraintViolation, PatternConstraintViolation, UniquenessConstraintViolation
}
  from "../../lib/errorTypes.mjs";

/**
 * The class Movie
 * @class
 */
class Movie {
  // using a record parameter with ES6 function parameter destructuring
  constructor({ movieId, title, releaseDate, director, directorIdRefs,
    actors, actors_id }) {
    this.movieId = movieId;
    this.title = title;
    this.releaseDate = releaseDate;
    // assign object references or ID references (to be converted in setter)
    this.director = director || directorIdRefs;
    if (actors || actors_id) {
      this.actors = actors || actors_id;
    }
  }
  get movieId() {
    return this._movieId;
  }
  static checkMovieId(movieId) {
    if (!movieId) return new NoConstraintViolation();
    else if (typeof movieId !== "string" || movieId.trim() === "" || isNaN(movieId)) {
      return new RangeConstraintViolation(
        "The Movie ID must be a non-empty Number!");
    } else {
      return new NoConstraintViolation();
    }
  }
  static checkMovieIdAsId(movieId) {
    var validationResult = Movie.checkMovieId(movieId);
    if ((validationResult instanceof NoConstraintViolation)) {
      if (!movieId) {
        validationResult = new MandatoryValueConstraintViolation(
          "A value for the Movie ID must be provided!");
      } else if (Movie.instances[movieId]) {
        validationResult = new UniquenessConstraintViolation(
          `There is already a movie record with Movie ID ${movieId}`);
      } else {
        validationResult = new NoConstraintViolation();
      }
    }
    return validationResult;
  }
  set movieId(movieId) {
    const validationResult = Movie.checkMovieIdAsId(movieId);
    if (validationResult instanceof NoConstraintViolation) {
      this._movieId = movieId;
    } else {
      throw validationResult;
    }
  }
  get title() {
    return this._title;
  }

  static checkTitle(title) {
    if (!title) {
      return new MandatoryValueConstraintViolation("A title must be provided!");
    } else if (title.trim() === "") {
      return new RangeConstraintViolation("The title must be a non-empty string!");
    } else {
      return new NoConstraintViolation();
    }
  };

  set title(title) {
    const validationResult = Movie.checkTitle(title);
    if (validationResult instanceof NoConstraintViolation) {
      this._title = title;
    } else {
      throw validationResult;
    }
  }

  get releaseDate() {
    return this._releaseDate;
  }

  static checkReleaseDate(releaseDate) {
    if (!releaseDate || releaseDate === undefined
      || releaseDate === null || releaseDate.trim() === "") {
      return new MandatoryValueConstraintViolation("Release Date is Manditory");
    } else {
      return new NoConstraintViolation();
    }
  };

  set releaseDate(releaseDate) {
    const VALIDATION_RESULT = Movie.checkReleaseDate(releaseDate);
    if (VALIDATION_RESULT instanceof NoConstraintViolation) {
      this._releaseDate = releaseDate;
    } else {
      throw VALIDATION_RESULT;
    }
  }
  get director() {
    return this._director;
  }
  static checkDirector(directorId) {
    var validationResult = null;
    if (!directorId) {
      validationResult = new MandatoryValueConstraintViolation("The Movie Director value is manditory");
    } else {
      // invoke foreign key constraint check
      validationResult = Person.checkPersonIdAsIdRef(directorId);
    }
    return validationResult;
  }
  set director(director) {
    if (!director) {  // unset publisher
      delete this._director;
    } else {
      // p can be an ID reference or an object reference
      const director_id = (typeof director !== "object") ? director : director.name;
      const validationResult = Movie.checkDirector(director_id);
      if (validationResult instanceof NoConstraintViolation) {
        // create the new director reference
        this._director = Person.instances[director_id];
      } else {
        throw validationResult;
      }
    }
  }
  get actors() {
    return this._actors;
  }
  static checkActors(actorId) {
    var validationResult = null;
    if (!actorId) {
      validationResult = new MandatoryValueConstraintViolation("Movie Actor is manditory");
    } else {
      // invoke foreign key constraint check
      validationResult = Person.checkPersonIdAsIdRef(actorId);
    }
    return validationResult;
  }
  addActors(actor) {
    // a can be an ID reference or an object reference
    const actors_id = (typeof actor !== "object") ? parseInt(actor) : actor.personId;
    if (actors_id) {
      const validationResult = Movie.checkActors(actors_id);
      if (actors_id && validationResult instanceof NoConstraintViolation) {
        // add the new person reference
        const key = String(actors_id);
        this._actors[key] = Person.instances[key];
      } else {
        throw validationResult;
      }
    }
  }
  removeActors(actor) {
    // a can be an ID reference or an object reference
    const actors_id = (typeof actor !== "object") ? parseInt(actor) : actor.personId;
    if (actors_id) {
      const validationResult = Movie.checkActors(actors_id);
      if (validationResult instanceof NoConstraintViolation) {
        // delete the person reference
        delete this._actors[String(actors_id)];
      } else {
        throw validationResult;
      }
    }
  }
  set actors(actor) {
    this._actors = {};
    if (Array.isArray(actor)) {  // array of IdRefs
      for (const idRef of actor) {
        this.addActors(idRef);
      }
    } else {  // map of IdRefs to object references
      for (const idRef of Object.keys(actor)) {
        this.addActors(actor[idRef]);
      }
    }
  }
  // Serialize movie object
  toString() {
    var movieStr = `Movie{ movieId: ${this.movieId}, title: ${this.title}, releaseDate: ${this.releaseDate}, director: ${this.director}`;
    //if (this.director) movieStr += `, director: ${this.director}`;
    return `${movieStr}, actors: ${Object.keys(this.actors).join(",")} }`;
  }
  // Convert object to record with ID references
  toJSON() {  // is invoked by JSON.stringify in Movie.saveAll
    var rec = {};
    for (const p of Object.keys(this)) {
      // copy only property slots with underscore prefix
      if (p.charAt(0) !== "_") continue;
      switch (p) {
        case "_director":
          // convert object reference to ID reference
          if (this._director) rec.director = this._director.personId;
          break;
        case "_actors":
          // convert the map of object references to a list of ID references
          rec.actors_id = [];
          for (const personIdStr of Object.keys(this.actors)) {
            rec.actors_id.push(parseInt(personIdStr));
          }
          break;
        default:
          // remove underscore prefix
          rec[p.substr(1)] = this[p];
      }
    }
    return rec;
  }
}
/***********************************************
*** Class-level ("static") properties **********
************************************************/
// initially an empty collection (in the form of a map)
Movie.instances = {};

/********************************************************
*** Class-level ("static") storage management methods ***
*********************************************************/
/**
 *  Create a new movie record/object
 */
Movie.add = function (slots) {
  try {
    const movie = new Movie(slots);
    Movie.instances[movie.movieId] = movie;
    console.log(`Movie record ${movie.toString()} created!`);
  } catch (e) {
    console.log(`${e.constructor.name}: ${e.message}`);
  }
};
/**
 *  Update an existing Movie record/object
 */
Movie.update = function ({ movieId, title, releaseDate,
  personIdRefsToAdd, personIdRefsToRemove, director_id }) {
  const movie = Movie.instances[movieId],
    objectBeforeUpdate = cloneObject(movie);
  var noConstraintViolated = true, updatedProperties = [];
  try {
    if (title && movie.title !== title) {
      movie.title = title;
      updatedProperties.push("title");
    }
    if (releaseDate && movie.releaseDate !== releaseDate) {
      movie.releaseDate = releaseDate;
      updatedProperties.push("releaseDate");
    }
    if (personIdRefsToAdd) {
      updatedProperties.push("persons(added)");
      for (const personIdRef of personIdRefsToAdd) {
        movie.addActors(personIdRef);
      }
    }
    if (personIdRefsToRemove) {
      updatedProperties.push("persons(removed)");
      for (const person_id of personIdRefsToRemove) {
        movie.removeActors(person_id);
      }
    }
    // publisher_id may be the empty string for unsetting the optional property
    if (director_id && (!movie.director && director_id ||
      movie.director && movie.director.name !== director_id)) {
      movie.director = director_id;
      updatedProperties.push("director");
    }
  } catch (e) {
    console.log(`${e.constructor.name}: ${e.message}`);
    noConstraintViolated = false;
    // restore object to its state before updating
    Movie.instances[movieId] = objectBeforeUpdate;
  }
  if (noConstraintViolated) {
    if (updatedProperties.length > 0) {
      let ending = updatedProperties.length > 1 ? "ies" : "y";
      console.log(`Propert${ending} ${updatedProperties.toString()} modified for movie ${movieId}`);
    } else {
      console.log(`No property value changed for movie ${movie.movieId}!`);
    }
  }
};
/**
 *  Delete an existing Movie record/object
 */
Movie.destroy = function (movieId) {
  if (Movie.instances[movieId]) {
    console.log(`${Movie.instances[movieId].toString()} deleted!`);
    delete Movie.instances[movieId];
  } else {
    console.log(`There is no movie with Movie ID ${movieId} in the database!`);
  }
};
/**
 *  Load all movie table rows and convert them to objects 
 *  Precondition: publishers and people must be loaded first
 */
Movie.retrieveAll = function () {
  var movies = {};
  try {
    if (!localStorage["movies"]) localStorage["movies"] = "{}";
    else {
      movies = JSON.parse(localStorage["movies"]);
      console.log(`${Object.keys(movies).length} movie records loaded.`);
    }
  } catch (e) {
    alert("Error when reading from Local Storage\n" + e);
  }
  for (const movieId of Object.keys(movies)) {
    try {
      Movie.instances[movieId] = new Movie(movies[movieId]);
    } catch (e) {
      console.log(`${e.constructor.name} while deserializing movie ${movieId}: ${e.message}`);
    }
  }
};
/**
 *  Save all movie objects
 */
Movie.saveAll = function () {
  const nmrOfMovies = Object.keys(Movie.instances).length;
  try {
    localStorage["movies"] = JSON.stringify(Movie.instances);
    console.log(`${nmrOfMovies} movie records saved.`);
  } catch (e) {
    alert("Error when writing to Local Storage\n" + e);
  }
};

export default Movie;
