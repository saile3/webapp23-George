/**
 * @fileOverview  Auxiliary data management procedures
 * @person Gerd Wagner, Elias George
 */
import Person from "../m/Person.mjs";
import Movie from "../m/Movie.mjs";

/*******************************************
 *** Auxiliary methods for testing **********
 ********************************************/
/**
 *  Create and save test data
 */
function generateTestData() {
  try {
    Person.instances["1"] = new Person({
      personId: 1,
      name: "Stephen Frears"
    });
    Person.instances["2"] = new Person({
      personId: 2,
      name: "George Lucas"
    });
    Person.instances["3"] = new Person({
      personId: 3,
      name: "Quentin Tarantino"
    });
    Person.instances["4"] = new Person({
      personId: 4,
      name: "Uma Thurman"
    });
    Person.instances["5"] = new Person({
      personId: 5,
      name: "John Travolta"
    });
    Person.instances["6"] = new Person({
      personId: 6,
      name: "Ewan McGregor"
    });
    Person.instances["7"] = new Person({
      personId: 7,
      name: "Natalie Portman"
    });
    Person.instances["8"] = new Person({
      personId: 8,
      name: "Keanu Reeves"
    });


    Person.saveAll();
    Movie.instances["1"] = new Movie({
      movieId: "1",
      title: "Pulp Fiction",
      releaseDate: "1994-05-12",
      directorIdRefs: 3,
      actors_id: [3, 5, 6],
    });
    Movie.instances["2"] = new Movie({
      movieId: "2",
      title: "Star Wars",
      releaseDate: "1977-05-25",
      directorIdRefs: 2,
      actors_id: [7, 8],
    });
    Movie.instances["3"] = new Movie({
      movieId: "3",
      title: "Dangerous Liaisons",
      releaseDate: "1988-12-16",
      directorIdRefs: 1,
      actors_id: [8, 5],
    });

    Movie.saveAll();
  } catch (e) {
    console.log(`${e.constructor.name}: ${e.message}`);
  }
}
/**
 * Clear data
 */
function clearData() {
  if (confirm("Do you really want to delete the entire database?")) {
    try {
      Person.instances = {};
      localStorage["persons"] = "{}";
      Movie.instances = {};
      localStorage["movies"] = "{}";
      console.log("All data cleared.");
    } catch (e) {
      console.log(`${e.constructor.name}: ${e.message}`);
    }
  }
}

export { generateTestData, clearData };
