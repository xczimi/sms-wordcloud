import React from 'react';
import './App.css';
import ReactWordcloud from 'react-wordcloud';
import words from './words';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        SMS Word Cloud
      </header>
      <div className="App-body">
          <div style={{width: '100%', height: '100%'}}>
            <ReactWordcloud words={words} />
          </div>
      </div>
    </div>
  );
}

export default App;
