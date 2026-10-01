import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  Compass,
  Globe2,
  Heart,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  Send,
  Sparkles,
  Sun,
  Thermometer,
  Wind,
  X,
} from 'lucide-react';
import { clearDemoNotebook, readDemoNotebook, writeDemoNotebook } from './lib/demoNotebook.js';
import {
  describeWeatherCode,
  getForecast,
  getLocalTime,
  getTravelNote,
  searchLocations,
  weatherGlyph,
} from './lib/travelApi.js';

const TravelMap = lazy(() => import('./components/TravelMap.jsx'));

const startPlace = {
  id: '2643743',
  name: 'London',
  admin1: 'England',
  country: 'United Kingdom',
  countryCode: 'GB',
  latitude: 51.5072,
  longitude: -0.1276,
  timezone: 'Europe/London',
};

function placeLabel(place) {
  const region =
    place.admin1?.toLocaleLowerCase() === place.name?.toLocaleLowerCase() ? '' : place.admin1;
  return [place.name, region, place.country].filter(Boolean).join(', ');
}

function placeRegion(place) {
  const region =
    place.admin1?.toLocaleLowerCase() === place.name?.toLocaleLowerCase() ? '' : place.admin1;
  return [region, place.country].filter(Boolean).join(', ');
}

function NotebookDialog({ onClose, onStart }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  function submit(event) {
    event.preventDefault();
    setMessage('');
    const cleanName = name.trim();
    if (!cleanName) {
      setMessage('Add a name for your notebook first.');
      return;
    }
    if (!onStart(cleanName))
        setMessage(
          'This browser could not save the notebook. Check its storage settings and try again.',
        );
  }

  return (
    <div
      className="modal-scrim"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog">
          <X size={19} />
        </button>
        <div className="eyebrow">
          <span className="eyebrow-mark" /> YOUR TRAVEL NOTEBOOK
        </div>
        <h2 id="auth-title">Make room for more.</h2>
        <p className="auth-intro">
          Give your travel notebook a name, then save places you want to remember.
        </p>
        <form className="auth-form" onSubmit={submit}>
          <label>
            What should we call you?
            <input
              autoComplete="given-name"
              maxLength={40}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              required
            />
          </label>
          {message && (
            <p className="form-error" role="alert">
              {message}
            </p>
          )}
          <button className="button button-dark auth-submit">
            Start my notebook
            <ArrowRight size={16} />
          </button>
        </form>
        <p className="fine-print">
          Demo mode: your name and saved places stay in this browser. No email or password is
          collected, and this is not an online account.
        </p>
      </section>
    </div>
  );
}

function WeatherCard({ place, forecast, loading, unit, onUnitChange }) {
  const current = forecast?.current;
  const daily = forecast?.daily;
  const degree = unit === 'celsius' ? '°C' : '°F';
  return (
    <section className="weather-card" aria-label="Local weather">
      <div className="weather-topline">
        <span className="section-label">
          <Sun size={14} /> RIGHT NOW
        </span>
        <button
          className="unit-toggle"
          onClick={() => onUnitChange(unit === 'celsius' ? 'fahrenheit' : 'celsius')}
          aria-label="Change temperature units"
        >
          {unit === 'celsius' ? '°C' : '°F'} <ChevronDown size={12} />
        </button>
      </div>
      {loading ? (
        <div className="weather-loading">
          <span className="loading-orbit" /> Finding the forecast…
        </div>
      ) : current ? (
        <>
          <div className="weather-current">
            <span className="weather-symbol">{weatherGlyph(current.weather_code)}</span>
            <div>
              <div className="weather-temp">
                {Math.round(current.temperature_2m)}
                <small>{degree}</small>
              </div>
              <div className="weather-condition">{describeWeatherCode(current.weather_code)}</div>
            </div>
          </div>
          <p className="weather-feels">
            Feels like {Math.round(current.apparent_temperature)}
            {degree} <span>·</span> local time {getLocalTime(forecast.timezone)}
          </p>
          <div className="weather-facts">
            <div>
              <Thermometer size={15} />
              <span>Humidity</span>
              <strong>{current.relative_humidity_2m}%</strong>
            </div>
            <div>
              <Wind size={15} />
              <span>Wind</span>
              <strong>
                {Math.round(current.wind_speed_10m)} {unit === 'celsius' ? 'km/h' : 'mph'}
              </strong>
            </div>
          </div>
          <div className="week-strip">
            {daily?.time?.slice(0, 5).map((day, index) => (
              <div className="week-day" key={day}>
                <span>
                  {index === 0
                    ? 'TODAY'
                    : new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' })
                        .format(new Date(day + 'T12:00:00Z'))
                        .toUpperCase()}
                </span>
                <i>{weatherGlyph(daily.weather_code[index])}</i>
                <strong>{Math.round(daily.temperature_2m_max[index])}°</strong>
                <small>{Math.round(daily.temperature_2m_min[index])}°</small>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="weather-empty">Choose a place to see its forecast.</div>
      )}
      <div className="weather-source">
        Forecast for {place.name} <span>·</span> Open-Meteo
      </div>
    </section>
  );
}

function SavedPlaces({ user, savedPlaces, onOpen, onToggle, onStartNotebook }) {
  return (
    <section className="member-card" id="notebook">
      <div className="member-head">
        <div className="member-icon">
          <Bookmark size={17} />
        </div>
        <div>
          <span className="section-label">TRAVEL NOTEBOOK</span>
          <h3>Your next somewhere</h3>
        </div>
        <span className="member-lock">DEMO · THIS BROWSER</span>
      </div>
      {user ? (
        <>
          <p className="member-copy">A small list of places you’d like to come back to.</p>
          <div className="saved-list">
            {savedPlaces.length ? (
              savedPlaces.map((place) => (
                <div className="saved-row" key={place.id}>
                  <button className="saved-place" onClick={() => onOpen(place)}>
                    <span className="saved-pin">
                      <MapPin size={14} />
                    </span>
                    <span>
                      <strong>{place.name}</strong>
                      <small>{placeRegion(place)}</small>
                    </span>
                  </button>
                  <button
                    className="icon-button remove-saved"
                    aria-label={'Remove ' + place.name}
                    onClick={() => onToggle(place)}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-saved">
                <span className="empty-sparkle">✳</span>
                <span>Save a place you’re curious about and it’ll be waiting here.</span>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="member-copy">
            Start a browser-only notebook to keep a shortlist of places. Come back on this device
            and reopen a saved spot with one tap.
          </p>
          <div className="member-preview">
            <span>
              <MapPin size={14} /> Your ideas, in one place
            </span>
            <span>
              <Check size={14} /> Saved on this device
            </span>
          </div>
          <button className="button button-outline member-cta" onClick={onStartNotebook}>
            Start a demo notebook <ArrowRight size={15} />
          </button>
        </>
      )}
      <div className="member-footnote">BROWSER-ONLY DEMO · SAVE · COME BACK TO IT</div>
    </section>
  );
}

function ChatAssistant({ place }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi, I’m your Near & Here travel helper. Ask me for a food idea, a half-day plan, or what to keep in mind in ' +
        place.name +
        '.',
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Hi, I’m your Near & Here travel helper. Ask me for a food idea, a half-day plan, or what to keep in mind in ' +
          place.name +
          '.',
      },
    ]);
  }, [place.name]);

  async function sendMessage(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.slice(-8),
          context: {
            place: placeLabel(place),
            latitude: place.latitude,
            longitude: place.longitude,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'The travel helper is unavailable right now.');
      setMessages((current) => [...current, { role: 'assistant', content: data.reply }]);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && (
        <section className="chat-panel" aria-label="Travel assistant">
          <div className="chat-header">
            <span className="chat-avatar">
              <Sparkles size={16} />
            </span>
            <div>
              <strong>A little local help</strong>
              <small>Talking about {place.name}</small>
            </div>
            <button
              className="icon-button"
              aria-label="Close travel helper"
              onClick={() => setOpen(false)}
            >
              <X size={17} />
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                className={
                  'chat-bubble ' + (message.role === 'user' ? 'from-user' : 'from-assistant')
                }
                key={index}
              >
                {message.content}
              </div>
            ))}
            {busy && (
              <div className="chat-bubble from-assistant typing">Putting a few ideas together…</div>
            )}
            {error && <div className="chat-error">{error}</div>}
            <div ref={endRef} />
          </div>
          <form className="chat-form" onSubmit={sendMessage}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={'Ask about ' + place.name + '…'}
              aria-label="Message the travel helper"
              maxLength={500}
            />
            <button aria-label="Send message" disabled={busy || !input.trim()}>
              <Send size={16} />
            </button>
          </form>
          <p className="chat-privacy">
            Messages and the selected city go to the AI service when sent. They aren’t saved by this
            app.
          </p>
        </section>
      )}
      <button
        className={'chat-launcher ' + (open ? 'is-open' : '')}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="chat-launch-icon">
          {open ? <X size={19} /> : <MessageCircle size={19} />}
        </span>
        <span>{open ? 'Close helper' : 'Ask a local'}</span>
        <i className="chat-online-dot" />
      </button>
    </>
  );
}

export default function App() {
  const [place, setPlace] = useState(startPlace);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [unit, setUnit] = useState('celsius');
  const [travelNote, setTravelNote] = useState(null);
  const [noteLoading, setNoteLoading] = useState(true);
  const [notebook, setNotebook] = useState(readDemoNotebook);
  const { user, savedPlaces } = notebook;
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);
  const [notice, setNotice] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setWeatherLoading(true);
    getForecast(place, unit, controller.signal)
      .then(setForecast)
      .catch((error) => {
        if (error.name !== 'AbortError') setForecast(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setWeatherLoading(false);
      });
    return () => controller.abort();
  }, [place, unit]);

  useEffect(() => {
    const controller = new AbortController();
    setNoteLoading(true);
    getTravelNote(place, controller.signal)
      .then(setTravelNote)
      .catch((error) => {
        if (error.name !== 'AbortError') setTravelNote(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setNoteLoading(false);
      });
    return () => controller.abort();
  }, [place]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setMatches([]);
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      searchLocations(query, controller.signal)
        .then(setMatches)
        .catch((error) => {
          if (error.name !== 'AbortError') setMatches([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 280);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const alreadySaved = useMemo(
    () => savedPlaces.some((saved) => saved.id === place.id),
    [savedPlaces, place.id],
  );

  function openNotebook(placeToSave = null) {
    setPendingSave(placeToSave);
    setNotebookOpen(true);
  }

  function startNotebook(name) {
    const nextPlaces = pendingSave
      ? [pendingSave, ...savedPlaces.filter((saved) => saved.id !== pendingSave.id)]
      : savedPlaces;
    const nextNotebook = { user: { name }, savedPlaces: nextPlaces };
    try {
      writeDemoNotebook(nextNotebook);
      setNotebook(nextNotebook);
      setPendingSave(null);
      setNotebookOpen(false);
      setNotice(
        pendingSave
          ? `${pendingSave.name} was added to your notebook.`
          : 'Your demo notebook is ready in this browser.',
      );
      return true;
    } catch {
      setNotice(
        'This browser could not save your notebook. Check its storage settings and try again.',
      );
      return false;
    }
  }

  function selectPlace(found) {
    setPlace(found);
    setQuery('');
    setMatches([]);
    setNotice('');
    document.getElementById('destination')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function toggleSaved(found = place) {
    if (!user) {
      openNotebook(found);
      return;
    }
    const existing = savedPlaces.some((saved) => saved.id === found.id);
    const nextPlaces = existing
      ? savedPlaces.filter((saved) => saved.id !== found.id)
      : [found, ...savedPlaces];
    try {
      const nextNotebook = { ...notebook, savedPlaces: nextPlaces };
      writeDemoNotebook(nextNotebook);
      setNotebook(nextNotebook);
      setNotice(
        existing ? `${found.name} was removed from your notebook.` : `${found.name} was saved.`,
      );
    } catch {
      setNotice('Could not update the notebook in this browser. Check its storage settings.');
    }
  }

  function resetNotebook() {
    const confirmed = window.confirm(
      'Reset this browser’s demo notebook and remove its saved places? This cannot be undone.',
    );
    if (!confirmed) return;
    try {
      clearDemoNotebook();
      setNotebook({ user: null, savedPlaces: [] });
      setNotice('Your demo notebook has been reset.');
    } catch {
      setNotice('Could not reset this browser’s demo notebook.');
    }
  }

  return (
    <>
      <header className="site-header">
        <a href="#top" className="brand" aria-label="Near & Here home">
          <span className="brand-mark">
            <Compass size={20} strokeWidth={1.7} />
          </span>
          <span>
            near<span className="brand-amp">&</span>here
          </span>
          <span className="brand-period">.</span>
        </a>
        <nav className={mobileMenu ? 'nav-links nav-open' : 'nav-links'}>
          <a href="#destination" onClick={() => setMobileMenu(false)}>
            Explore
          </a>
          <a href="#film" onClick={() => setMobileMenu(false)}>
            The feeling of elsewhere
          </a>
          <a href="#notebook" onClick={() => setMobileMenu(false)}>
            My notebook
          </a>
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <span className="user-greeting">Hi, {user.name}</span>
              <button className="header-signin" onClick={resetNotebook}>
                Reset demo
              </button>
            </>
          ) : (
            <button className="header-signin" onClick={() => openNotebook()}>
              Start a notebook <ArrowRight size={14} />
            </button>
          )}
          <button
            className="mobile-menu-button"
            aria-label="Toggle menu"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero-shell">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-mark" /> A MORE PERSONAL WAY TO WANDER
            </div>
            <h1>
              The world feels
              <br />
              closer <em>from here.</em>
            </h1>
            <p>
              Find a place that calls to you. Get the weather, find your bearings, and keep the
              places you love close.
            </p>
            <a className="text-link hero-link" href="#destination">
              Let curiosity lead <ArrowDown size={15} />
            </a>
            <div className="hero-index">
              <span>01</span>
              <span className="index-rule" />
              <span>YOUR NEXT SOMEWHERE</span>
            </div>
          </div>
          <div className="hero-art">
            <div className="art-sun" />
            <div className="art-horizon" />
            <div className="art-hill art-hill-back" />
            <div className="art-hill art-hill-front" />
            <div className="art-window">
              <div className="window-sky" />
              <div className="window-arch" />
              <div className="window-sill" />
              <span className="window-label">A view worth finding</span>
            </div>
            <div className="art-stamp">
              <span>
                GO
                <br />A LITTLE
                <br />
                FURTHER
              </span>
              <Globe2 size={24} strokeWidth={1.2} />
            </div>
            <div className="art-caption">
              <span>
                Somewhere between
                <br />
                here and the horizon
              </span>
              <ArrowDownRight size={19} />
            </div>
          </div>
        </section>

        <section className="search-band">
          <div className="search-prompt">
            <span className="search-overline">ONE LITTLE SEARCH</span>
            <strong>Where to next?</strong>
          </div>
          <form
            className="destination-search"
            onSubmit={(event) => {
              event.preventDefault();
              if (matches[0]) selectPlace(matches[0]);
              else if (query.trim().length < 2) searchRef.current?.focus();
            }}
          >
            <Search size={18} />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try a city, anywhere in the world"
              aria-label="Search any destination"
              autoComplete="off"
            />
            <span className="search-shortcut">↵</span>
            <button aria-label="Search destinations">
              <ArrowRight size={17} />
            </button>
            {(matches.length > 0 || searching) && (
              <div className="search-results" role="listbox">
                {searching && <div className="search-result-note">Finding places…</div>}
                {matches.map((result) => (
                  <button
                    type="button"
                    key={result.id}
                    role="option"
                    className="search-result"
                    onClick={() => selectPlace(result)}
                  >
                    <MapPin size={15} />
                    <span>
                      <strong>{result.name}</strong>
                      <small>{placeRegion(result)}</small>
                    </span>
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            )}
          </form>
          <div className="search-caption">EVERY PLACE HAS A FIRST LOOK</div>
        </section>

        <section className="explore-section" id="destination">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-mark" /> A WINDOW INTO SOMEWHERE
              </div>
              <h2>
                Right now in <em>{place.name}.</em>
              </h2>
              <p className="place-subtitle">
                <MapPin size={14} /> {placeLabel(place)}
              </p>
            </div>
            <button
              className={'save-button ' + (alreadySaved ? 'saved' : '')}
              onClick={() => toggleSaved()}
            >
              <Heart size={15} fill={alreadySaved ? 'currentColor' : 'none'} />{' '}
              {alreadySaved ? 'Saved to notebook' : 'Save this place'}
            </button>
          </div>
          {notice && (
            <p className="inline-notice" role="status">
              {notice}
              <button onClick={() => setNotice('')} aria-label="Dismiss notice">
                <X size={13} />
              </button>
            </p>
          )}
          <div className="explore-grid">
            <div className="map-column">
              <Suspense
                fallback={
                  <div
                    className="map-frame map-loading"
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      fontFamily: 'var(--serif)',
                      color: '#738070',
                    }}
                  >
                    Unfolding the map…
                  </div>
                }
              >
                <TravelMap place={place} />
              </Suspense>
              <div className="map-caption">
                <span>THE WORLD, A LITTLE CLOSER</span>
                <span>MAP DATA © OPENSTREETMAP</span>
              </div>
            </div>
            <div className="info-column">
              <WeatherCard
                place={place}
                forecast={forecast}
                loading={weatherLoading}
                unit={unit}
                onUnitChange={setUnit}
              />
              <article className="travel-note">
                <div className="note-heading">
                  <span className="section-label">
                    <Globe2 size={14} /> A LITTLE CONTEXT
                  </span>
                  <span className="note-index">01 — 02</span>
                </div>
                {noteLoading ? (
                  <div className="note-loading">Turning a page…</div>
                ) : travelNote ? (
                  <>
                    <h3>A place with a story.</h3>
                    <p>{travelNote.text}</p>
                    <a href={travelNote.url} target="_blank" rel="noreferrer">
                      Read more on Wikivoyage <ArrowRight size={14} />
                    </a>
                  </>
                ) : (
                  <>
                    <h3>Make it your own.</h3>
                    <p>
                      Take a look around on the map, check the local forecast, or ask the travel
                      helper to start a plan for {place.name}.
                    </p>
                  </>
                )}
              </article>
            </div>
          </div>
        </section>

        <section className="film-section" id="film">
          <div className="film-copy">
            <div className="eyebrow">
              <span className="eyebrow-mark" /> A MOMENT AWAY
            </div>
            <h2>
              Sometimes the
              <br />
              journey starts
              <br />
              <em>with a feeling.</em>
            </h2>
            <p>A little glimpse of somewhere else. Let your next idea find you.</p>
            <a href="#destination" className="text-link">
              Find your somewhere <ArrowRight size={15} />
            </a>
            <div className="film-number">FIELD NOTE / 001</div>
          </div>
          <div className="film-frame">
            <video
              controls
              preload="none"
              poster="/acropolis-poster.svg"
              aria-label="Openly licensed view of the Acropolis in Athens"
            >
              <source
                src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Acropolis.webm"
                type="video/webm"
              />
              Your browser does not support this video.
            </video>
            <div className="film-corner">
              ATHENS, GREECE <span>37.97° N · 23.72° E</span>
            </div>
            <p className="media-credit">
              Video:{' '}
              <a
                href="https://commons.wikimedia.org/wiki/File:Acropolis.webm"
                target="_blank"
                rel="noreferrer"
              >
                Acropolis.webm
              </a>{' '}
              by Yair-haklai, licensed under{' '}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY-SA 4.0
              </a>
              .
            </p>
          </div>
        </section>

        <section className="member-section">
          <div className="member-illustration">
            <div className="notebook-circle">
              <div className="notebook-page">
                <span className="notebook-dot" />
                <i />
                <i />
                <i />
                <div className="notebook-stamp">
                  <MapPin size={18} />
                </div>
              </div>
            </div>
            <span className="illustration-orbit orbit-one" />
            <span className="illustration-orbit orbit-two" />
            <span className="illustration-caption">
              A SMALL PLACE
              <br />
              FOR BIG PLANS
            </span>
          </div>
          <SavedPlaces
            user={user}
            savedPlaces={savedPlaces}
            onOpen={selectPlace}
            onToggle={toggleSaved}
            onStartNotebook={() => openNotebook()}
          />
        </section>

        <section className="closing-note">
          <div className="closing-topline">
            <span>NEAR & HERE / TRAVEL NOTES</span>
            <span>MADE FOR THE IN-BETWEEN</span>
          </div>
          <p>
            Go somewhere.
            <br />
            <em>Come back different.</em>
          </p>
          <a href="#top" aria-label="Back to top" className="back-top">
            <ArrowDown size={16} />
          </a>
        </section>
      </main>
      <footer className="site-footer">
        <a href="#top" className="brand footer-brand">
          <span className="brand-mark">
            <Compass size={18} />
          </span>
          <span>
            near<span className="brand-amp">&</span>here
          </span>
          <span className="brand-period">.</span>
        </a>
        <span>Weather by Open-Meteo · Destination notes from Wikivoyage</span>
        <span>BUILT TO FOLLOW A LITTLE CURIOSITY</span>
      </footer>
      <ChatAssistant place={place} />
      {notebookOpen && (
        <NotebookDialog onClose={() => setNotebookOpen(false)} onStart={startNotebook} />
      )}
    </>
  );
}
