import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating.js";
import { useMovies } from "./useMovies.js";
import { useLocalStorage } from "./useLocalStorage.js";
import { useKEY } from "./useKey.js";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);
const KEY = "c128eb57";
export default function App() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [watched, setWatched] = useLocalStorage([], "watched");
  function handleSelectedMovies(id) {
    setSelectedId((selectedId) => (id === selectedId ? null : id));
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  function handleAddwatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }

  function handleDeleteMovies(id) {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  }

  const { movies, isLoading, error } = useMovies(query);

  return (
    <>
      <Navbar>
        <Logo />
        <Searchbar
          query={query}
          setQuery={setQuery}
          onCloseMovies={handleCloseMovie}
        />
        <NumMovies movies={movies} />
      </Navbar>
      <Main>
        <Box>
          {/* {isLoading ? <Loader /> : <MoviesList movies={movies} />} */}
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MoviesList
              movies={movies}
              onSelectedMovies={handleSelectedMovies}
            />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          {selectedId ? (
            <MoviesDetails
              selectedId={selectedId}
              onCloseMovies={handleCloseMovie}
              onAddwatchMovies={handleAddwatched}
              watched={watched}
            />
          ) : (
            <>
              <WatchedSummry watched={watched} />
              <MoviesWatchList
                watched={watched}
                ondeleteMovies={handleDeleteMovies}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function Loader() {
  return (
    <div className="loader">
      <p>Loading...</p>
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div className="error">
      <p>{message}</p>
    </div>
  );
}

function Navbar({ children }) {
  return <nav className="nav-bar">{children}</nav>;
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}
function Searchbar({ query, setQuery }) {
  const inputel = useRef(null);
  useKEY(function () {
    if (document.activeElement === inputel.current) return;
    inputel.current.focus();
    setQuery("");
  }, "Enter");

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputel}
    />
  );
}

function NumMovies({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

function MoviesList({ movies, onSelectedMovies }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movies
          movie={movie}
          key={movie.imdbID}
          onSelectedMovies={onSelectedMovies}
        />
      ))}
    </ul>
  );
}

function Movies({ movie, onSelectedMovies }) {
  return (
    <li onClick={() => onSelectedMovies(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function MoviesDetails({
  selectedId,
  onCloseMovies,
  onAddwatchMovies,
  watched,
}) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userRating, setUserrating] = useState("");
  const isWatched = watched.map((movie) => movie.imdbID).includes(selectedId);
  const watchmovieRating = watched.find(
    (movie) => movie.imdbID === selectedId
  )?.userRating;

  const {
    Actors,
    Awards,
    BoxOffice,
    Country,
    Director,
    Genre,
    Language,
    Plot,
    Poster,
    Rated,
    Released,
    Runtime,
    Title,
    imdbRating,
    imdbVotes,
    Writer,
    Year,
  } = movie;

  function handleAddMovies() {
    const newMoviesList = {
      imdbID: selectedId,
      imdbRating: Number(imdbRating),
      Title,
      Poster,
      Year,
      Runtime: Number(Runtime.split(" ").at(0)),
      userRating,
    };

    onAddwatchMovies(newMoviesList);
    onCloseMovies();
  }
  useEffect(
    function () {
      async function moviesDetails() {
        try {
          setIsLoading(true);
          setError("");
          const response = await fetch(
            `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
          );
          const data = await response.json();
          if (data.Response === "False")
            throw new Error("Something went wrong while fetching movies");
          setMovie(data);
        } catch (error) {
          setError(error.message);
        } finally {
          setIsLoading(false);
        }
      }
      moviesDetails();
    },
    [selectedId]
  );

  useEffect(() => {
    if (!Title) return;

    document.title = `Movie | ${Title}`;

    return () => {
      document.title = "Imdb-clone App";
    };
  }, [Title]);

  useKEY(onCloseMovies, "Escape");
  return (
    <div className="details">
      {isLoading && <Loader />}
      {!isLoading && !error && (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovies}>
              &times;
            </button>
            <img src={Poster} alt={Title} />
            <div className="details-overview">
              <h2>{Title}</h2>
              <p>
                {Released} 🎞 {Runtime}
              </p>
              <p>{Genre}</p>

              <p>
                <span>⭐{imdbRating} IMDB Rating</span>
              </p>
              <p>
                <span>Country : {Country}</span>
              </p>
              <p>
                <span>Language : {Language}</span>
              </p>
              <p>
                <span>BoxOffice : {BoxOffice}</span>
              </p>
            </div>
          </header>
          <section>
            <div className="rating">
              {!isWatched ? (
                <StarRating
                  maxrating={10}
                  size={32}
                  onsetRating={setUserrating}
                />
              ) : (
                <p>You Already Rated This Movie {watchmovieRating} Stars</p>
              )}
              {userRating && (
                <button className="btn-add" onClick={handleAddMovies}>
                  + Add Movies List
                </button>
              )}
            </div>

            <p>
              <em>{Plot}</em>
            </p>
            <p>
              <em>Actors : {Actors}</em>
            </p>
            <p>
              <em>
                Director : {Director} , Writer : {Writer}
              </em>
            </p>
            <p>
              <em>
                Awards : {Awards} , imdbVotes : {imdbVotes} , Rated : {Rated}
              </em>
            </p>
          </section>
        </>
      )}
      {error && <ErrorMessage message={error} />}
    </div>
  );
}

function WatchedSummry({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.Runtime));
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime.toFixed(2)} min</span>
        </p>
      </div>
    </div>
  );
}

function MoviesWatchList({ watched, ondeleteMovies }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovies
          movie={movie}
          key={movie.imdbID}
          ondeleteMovies={ondeleteMovies}
        />
      ))}
    </ul>
  );
}

function WatchedMovies({ movie, ondeleteMovies }) {
  return (
    <li>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.Runtime} min</span>
        </p>
      </div>
      <button
        className="btn-delete"
        onClick={() => ondeleteMovies(movie.imdbID)}
      >
        &times;
      </button>
    </li>
  );
}
