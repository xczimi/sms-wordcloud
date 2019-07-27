import React from 'react';
import './App.css';
import ReactWordcloud from 'react-wordcloud';
import {Resizable} from 're-resizable';
import words from './words';

const resizeStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'solid 1px #ddd',
  background: '#f0f0f0',
};

function App() {
  return (
    <div className="App">
      <header className="App-header">
        SMS World Cloud
      </header>
      <div className="App-body">
        <Resizable
            defaultSize={{
              width: '100%',
              height: '100%',
            }}
            style={resizeStyle}>
          <div style={{width: '100%', height: '100%'}}>
            <ReactWordcloud words={words} />
          </div>
        </Resizable>
      </div>
    </div>
  );
}

export default App;
