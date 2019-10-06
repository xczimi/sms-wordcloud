import React from 'react';
import './App.css';
import * as d3 from 'd3';
import * as cloud from 'd3-cloud';
import { scaleOrdinal } from 'd3-scale';
import debugWords from './words';

console.log(debugWords);

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      words: [],
    };
  }

  d3Chart(words) {
    var fill = scaleOrdinal().domain(words.map(w => w.text)).range(["69D2E7","A7DBD8","E0E4CC","F38630","FA6900"]);

    var layout = cloud().size([800, 500]).words(words.map(function(w) {
      return {text: w.text, size: w.value};
    }).filter(w => w.size > 1)).padding(5).rotate(function() {
      return 0;
    }).font('Verdana').fontWeight('bold').fontSize(function(d) {
      return d.size;
    }).on('end', draw);

    layout.start();

    function draw(words) {
      d3.select('#chart').
          append('svg').
          attr('width', layout.size()[0]).
          attr('height', layout.size()[1]).
          append('g').
          attr('transform', 'translate(' + layout.size()[0] / 2 + ',' +
              layout.size()[1] / 2 + ')').
          selectAll('text').
          data(words).
          enter().
          append('text').
          style('font-size', function(d) {
            return d.size + 'px';
          }).
          style('font-family', 'Verdana').style('font-weight', 'bold')
      .attr('text-anchor', 'middle').
          attr('transform', function(d) {
            return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')';
          }).
          style('fill', t => { return fill(t.text)} ).
          text(function(d) {
            return d.text;
          });
      loadColours();
    }

    function colourWords(colours) {
      fill.range(colours);
    }

    function loadColours() {
      fetch('http://www.colourlovers.com/api/palettes/random?format=json')
      .then(res => res.json())
      .then(
          (result) => {
            colourWords(result[0].colors);
          },
          (error) => {
            colourWords(["C1C2A5","C3FF00","6A8F72","0EE3DF","685A70"]);
          }
      )
    }
  }

  loadWords() {
    this.setState({
      isLoaded: true,
      words: debugWords
    });
    this.d3Chart(debugWords);
    fetch('https://l1aycdz6w6.execute-api.us-west-1.amazonaws.com/dev/words').
        then(res => res.json()).
        then(
            (result) => {
              this.setState({
                isLoaded: true,
                words: debugWords,
              });
              this.d3Chart(debugWords);
            },
            // Note: it's important to handle errors here
            // instead of a catch() block so that we don't swallow
            // exceptions from actual bugs in components.
            (error) => {
              this.setState({
                isLoaded: true,
                error,
              });
            },
        );
  }

  componentDidMount() {
    this.loadWords();
  }

  render() {
    const {error, isLoaded, words} = this.state;
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div>Loading...</div>;
    } else {
      return (
          <div className="App">
            <header className="App-header">
              SMS Word Cloud
            </header>
            <div className="App-body">
              <div id="chart" style={{width: '100%', height: '100%'}}>
                blah
              </div>
            </div>
          </div>
      );
    }
  }
}

export default App;
